// Create (or repair) a super_admin account on the Supabase project in .env.local.
//   node scripts/create-admin.mjs <email> <password> [display name]
// Idempotent: if the auth user exists its password is updated and the
// admin_users row is ensured.
import { adminClient } from './lib/env.mjs';

const [email, password, displayName = 'Super Admin'] = process.argv.slice(2);
if (!email || !password) {
  console.error('usage: node scripts/create-admin.mjs <email> <password> [display name]');
  process.exit(1);
}
const admin = adminClient();

const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
let user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (user) {
  const { error } = await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  if (error) throw error;
  console.log('auth user exists — password updated');
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (error) throw error;
  user = data.user;
  console.log('auth user created');
}

const { data: row } = await admin
  .from('admin_users')
  .select('id, role')
  .eq('auth_user_id', user.id)
  .maybeSingle();
if (row) {
  if (row.role !== 'super_admin')
    await admin.from('admin_users').update({ role: 'super_admin' }).eq('id', row.id);
  console.log('admin_users row exists (super_admin)');
} else {
  const { error } = await admin
    .from('admin_users')
    .insert({ auth_user_id: user.id, display_name: displayName, role: 'super_admin' });
  if (error) throw error;
  console.log('admin_users row created (super_admin)');
}
console.log(`done: ${email} → super_admin. Sign in at /admin/login`);
