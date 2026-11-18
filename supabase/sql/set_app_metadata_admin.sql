-- Donnée (pas une migration) : rôle admin attribué par la voie sûre.
-- À lancer UNE fois, avec M1, après accord. L'utilisateur doit se
-- déconnecter puis se reconnecter pour que son jeton porte le nouveau rôle.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
where email = 'mamaneric@gmail.com';
