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
const ADMIN_EMAILS = ['mabellepromo@gmail.com'];

const isUserAdmin = (user) => {
  if (!user) return false;
  if (ADMIN_EMAILS.includes(user.email)) return true;
  const role = user.user_metadata?.role || user.app_metadata?.role;
  return role === 'admin';
};

const auth = {
  isUserAdmin,
  me: async () => {
    await supabase.auth.refreshSession();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email,
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
    }if (name === 'getMyBinomes') {
  await supabase.auth.refreshSession();
  const { data: { user } } = await supabase.auth.getUser();
  console.log('USER:', user?.email, 'IS_ADMIN:', isUserAdmin(user));
  // ... reste du code
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