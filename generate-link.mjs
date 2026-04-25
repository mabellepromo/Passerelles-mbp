import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hrhwoqguocwrfwbkkqwq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Manque SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const email = process.argv[2] || 'senayhola@gmail.com';

// Générer directement le lien (compte déjà existant)
const { data, error } = await supabase.auth.admin.generateLink({
  type: 'recovery',
  email,
  options: { redirectTo: 'https://passerelles-mbp.vercel.app/auth/callback' }
});

if (error) {
  // Fallback: magic link
  const { data: ml, error: mle } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: 'https://passerelles-mbp.vercel.app/' }
  });
  if (mle) {
    console.error('Erreur:', mle.message);
  } else {
    console.log('\n🔗 Lien de connexion pour', email, '(valable 24h) :');
    console.log('\n' + ml.properties.action_link + '\n');
  }
} else {
  console.log('\n🔗 Lien d\'activation pour', email, '(valable 24h) :');
  console.log('\n' + data.properties.action_link + '\n');
}
