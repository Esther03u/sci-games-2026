import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request) {
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
    if (role === 'staff' && assigned_sport_ids?.length) {
      const assignments = assigned_sport_ids.map((sid) => ({
        admin_user_id: adminUser.id,
        sport_id: sid,
      }));
      await supabase.from('staff_sport_assignments').insert(assignments);
    }

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
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing user id' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get auth_user_id
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('auth_user_id')
      .eq('id', id)
      .single();

    if (adminUser?.auth_user_id) {
      await supabase.auth.admin.deleteUser(adminUser.auth_user_id);
    }

    const { error } = await supabase.from('admin_users').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    return NextResponse.json({ success: false, message: 'ระบบขัดข้อง' }, { status: 500 });
  }
}
