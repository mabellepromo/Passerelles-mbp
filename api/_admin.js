const ADMIN_EMAILS = ['contact@mabellepromo.org', 'senayhola@gmail.com', 'mabellepromo@gmail.com'];

const isUserAdmin = (user) => {
  if (!user?.email) return false;
  if (ADMIN_EMAILS.includes(user.email)) return true;
  const role = user.user_metadata?.role || user.app_metadata?.role;
  return role === 'admin';
};

module.exports = { ADMIN_EMAILS, isUserAdmin };
