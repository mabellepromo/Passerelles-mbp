import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

const applyFilters = (query, filters = {}) => {
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  return query;
};

const makeEntity = (tableName) => ({
  list: async (orderBy = 'created_date', limit = 1000) => {
    const col = orderBy.startsWith('-') ? orderBy.slice(1) : orderBy;
    const asc = !orderBy.startsWith('-');
    const { data, error } = await supabase.from(tableName).select('*').order(col, { ascending: asc }).limit(limit);
    if (error) throw error;
    return data ?? [];
  },
  filter: async (filters = {}, orderBy = 'created_date') => {
    const col = orderBy.startsWith('-') ? orderBy.slice(1) : orderBy;
    const asc = !orderBy.startsWith('-');
    let query = supabase.from(tableName).select('*').order(col, { ascending: asc });
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },
  get: async (id) => {
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  create: async (obj) => {
    const now = new Date().toISOString();
    const row = { ...obj, created_date: now, updated_date: now };
    if (!row.id) row.id = crypto.randomUUID();
    const { data, error } = await supabase.from(tableName).insert(row).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id, obj) => {
    const row = { ...obj, updated_date: new Date().toISOString() };
    const { data, error } = await supabase.from(tableName).update(row).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  delete: async (id) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw error;
    return { id };
  },
  subscribe: (callback) => {
    return () => {};
  },
});

// Liste des emails admin
const ADMIN_EMAILS = ['contact@mabellepromo.org', 'senayhola@gmail.com'];

const isUserAdmin = (user) => {
  if (!user) return false;
  if (ADMIN_EMAILS.includes(user.email)) return true;
  const role = user.user_metadata?.role || user.app_metadata?.role;
  return role === 'admin';
};

const auth = {
  isUserAdmin,
  me: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    const user = session?.user;
    if (!user) return null;

    let full_name = user.user_metadata?.full_name;

    // Si pas de nom dans les métadonnées, chercher dans les tables mentor/mentore
    if (!full_name) {
      const [mentorRes, mentoreRes] = await Promise.all([
        supabase.from('mentor').select('full_name').eq('email', user.email).maybeSingle(),
        supabase.from('mentore').select('full_name').eq('email', user.email).maybeSingle(),
      ]);
      full_name = mentorRes.data?.full_name || mentoreRes.data?.full_name || user.email;
    }

    return {
      id: user.id,
      email: user.email,
      full_name,
      role: isUserAdmin(user) ? 'admin' : (user.user_metadata?.role || user.app_metadata?.role || 'user'),
    };
  },
  getAccessToken: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session?.access_token ?? null;
  },
  isAuthenticated: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) return false;
    return !!session;
  },
  redirectToLogin: () => { window.location.href = '/login'; },
  logout: async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  },
  sendMagicLink: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) throw error;
  },
};

const functions = {
  invoke: async (name) => {
    if (name === 'getCohorte1Binomes') {
      const [binomes, mentors, mentores] = await Promise.all([
        supabase.from('binome').select('*').eq('cohorte', '1').eq('status', 'active').eq('is_test', false).order('match_date'),
        supabase.from('mentor').select('*').eq('status', 'matched'),
        supabase.from('mentore').select('*').eq('status', 'matched'),
      ]);
      return { data: { binomes: binomes.data ?? [], mentors: mentors.data ?? [], mentores: mentores.data ?? [] } };
    } else if (name === 'getMyBinomes') {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return { data: { binomes: [] } };

      if (isUserAdmin(user)) {
        const { data } = await supabase.from('binome').select('*').eq('status', 'active').eq('is_test', false).order('match_date');
        return { data: { binomes: data ?? [] } };
      }

      const { data } = await supabase.from('binome').select('*')
        .or(`mentor_email.eq.${user.email},mentore_email.eq.${user.email}`)
        .eq('status', 'active');
      return { data: { binomes: data ?? [] } };
    }
    return { data: {} };
  },
};

const integrations = {
  Core: {
    UploadFile: async ({ file }) => {
      const path = `binomes/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('passerelles-files').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('passerelles-files').getPublicUrl(path);
      return { file_url: urlData.publicUrl };
    },
    SendEmail: async ({ to, subject, body }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to, subject, text: body }),
      });
      if (!res.ok) throw new Error('Échec envoi email');
    },
    InvokeLLM: async ({ prompt, response_json_schema }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/invoke-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ prompt, response_json_schema }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur évaluation IA');
      }
      return res.json();
    },
  },
};

export const base44 = {
  auth,
  functions,
  integrations,
  appLogs: { logUserInApp: async () => {} },
  entities: {
    Binome:        makeEntity('binome'),
    Mentor:        makeEntity('mentor'),
    Mentore:       makeEntity('mentore'),
    SuiviMensuel:  makeEntity('suivi_mensuel'),
    JournalDeBord: makeEntity('journal_de_bord'),
    Message:       makeEntity('message'),
    BilanFinal:    makeEntity('bilan_final'),
    BinomeFichier: makeEntity('binome_fichier'),
  },
};