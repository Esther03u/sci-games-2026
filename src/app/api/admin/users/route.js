import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/resolveActor';
import { createAuditLog } from '@/lib/audit';

const VALID_ROLES = ['super_admin', 'staff'];

export async function POST(request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const { actor } = guard;

  try {
    const supabase = createAdminClient();
    const body = await request.json().catch(() => null);

    if (!body || !body.email || !body.password || !body.display_name || !body.role) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const { email, password, display_name, role, assigned_sport_ids } = body;

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, message: 'บทบาทผู้ใช้ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' },
        { status: 400 }
      );
    }

    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { display_name: display_name.trim() },
    });

    if (authError) {
      return NextResponse.json(
        { success: false, message: authError.message },
        { status: 400 }
      );
    }

    // 2. Insert into admin_users table
    const { data: adminUser, error: dbError } = await supabase
      .from('admin_users')
      .insert({
        auth_user_id: authData.user.id,
        display_name: display_name.trim(),
        role,
      })
      .select('*')
      .single();

    if (dbError) {
      // rollback auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, message: dbError.message },
        { status: 500 }
      );
    }

    // 3. If staff, insert sport assignments
    let sportIds = [];
    if (role === 'staff' && Array.isArray(assigned_sport_ids) && assigned_sport_ids.length) {
      sportIds = assigned_sport_ids;
      const assignments = sportIds.map((sid) => ({
        admin_user_id: adminUser.id,
        sport_id: sid,
      }));
      await supabase.from('staff_sport_assignments').insert(assignments);
    }

    await createAuditLog({
      adminUserId: actor.adminUserId,
      action: 'create_user',
      targetType: 'admin_users',
      targetId: adminUser.id,
      newValues: { email: email.trim(), display_name: adminUser.display_name, role, sport_ids: sportIds },
    });

    return NextResponse.json({ success: true, data: adminUser });
  } catch (err) {
    console.error('Error in /api/admin/users:', err);
    return NextResponse.json(
      { success: false, message: 'ระบบขัดข้อง' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  const { actor } = guard;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing user id' }, { status: 400 });
    }

    if (id === actor.adminUserId) {
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถลบบัญชีของตัวเองได้' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, auth_user_id, display_name, role')
      .eq('id', id)
      .single();

    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'ไม่พบผู้ใช้งาน' }, { status: 404 });
    }

    if (adminUser.auth_user_id) {
      await supabase.auth.admin.deleteUser(adminUser.auth_user_id);
    }

    const { error } = await supabase.from('admin_users').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    await createAuditLog({
      adminUserId: actor.adminUserId,
      action: 'delete_user',
      targetType: 'admin_users',
      targetId: id,
      oldValues: { display_name: adminUser.display_name, role: adminUser.role },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    return NextResponse.json({ success: false, message: 'ระบบขัดข้อง' }, { status: 500 });
  }
}
