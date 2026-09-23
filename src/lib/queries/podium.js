import { createAdminClient } from '@/lib/supabase/admin';

export const DEFAULT_PODIUM_SETTINGS = {
  enabled: true,
  status: 'countdown', // 'countdown' | 'holding' | 'fast_forward' | 'revealed' | 'hidden'
  target_time: '2026-10-11T16:30:00+07:00', // Final day ceremony
  title: 'นับถอยหลังสู่การประกาศผลคะแนนรวม',
  subtitle: 'ร่วมลุ้นว่าสีไหนจะได้ครองอันดับเท่าไหร่ในงาน Sci Games 2026',
  revealed: false,
  fast_forward_at: null,
};

/**
 * Fetch podium countdown settings from app_settings using service role.
 * Safe fallback ensures the page never breaks even if app_settings is missing the key.
 */
export async function getPodiumSettings() {
  try {
    const sb = createAdminClient();
    const { data, error } = await sb
      .from('app_settings')
      .select('value')
      .eq('key', 'podium_countdown')
      .maybeSingle();

    if (error || !data?.value) {
      return DEFAULT_PODIUM_SETTINGS;
    }

    return {
      ...DEFAULT_PODIUM_SETTINGS,
      ...data.value,
    };
  } catch (err) {
    console.error('getPodiumSettings error:', err);
    return DEFAULT_PODIUM_SETTINGS;
  }
}
