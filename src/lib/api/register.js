// Error codes RAISEd by register_athlete() (supabase/migrations/006).
const RPC_ERRORS = {
  DUPLICATE_REGISTRATION: [409, 'รหัสนักศึกษานี้ได้ลงทะเบียนไว้แล้ว ไม่สามารถลงทะเบียนซ้ำได้'],
  QUOTA_FULL: [409, 'โควตากีฬาของสีนี้เต็มแล้ว'],
  INVALID_DEPARTMENT: [400, 'ไม่พบสาขาวิชาที่เลือก กรุณาเลือกสาขาวิชาจากรายการ'],
  INVALID_SPORT: [400, 'ชนิดกีฬาที่เลือกไม่ถูกต้องหรือไม่พบในระบบ'],
  INVALID_SPORT_COUNT: [400, 'สามารถเลือกสมัครกีฬาได้ 1 - 2 ชนิดเท่านั้น'],
};

export function mapRegisterError(error) {
  const text = error?.message || '';
  const code = Object.keys(RPC_ERRORS).find((c) => text.startsWith(c));
  if (!code) {
    return {
      status: 500,
      body: { success: false, error_code: 'SERVER_ERROR', message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลนักกีฬา' },
    };
  }
  let [status, message] = RPC_ERRORS[code];
  // "QUOTA_FULL: ฟุตซอล (12/12)" → keep the sport + count from the DB
  if (code === 'QUOTA_FULL') {
    const m = text.match(/^QUOTA_FULL: (.+?) \((\d+)\/(\d+)\)/);
    if (m) message = `โควตากีฬา ${m[1]} ของสีนี้เต็มแล้ว (${m[2]}/${m[3]} คน)`;
  }
  return { status, body: { success: false, error_code: code, message } };
}
