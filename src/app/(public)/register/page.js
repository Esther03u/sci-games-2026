import RegistrationForm from '@/components/public/RegistrationForm';
import { Pencil } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'สมัครกีฬา',
  description: 'แบบฟอร์มสมัครกีฬาเข้าร่วมการแข่งขัน Sci Games 2026',
};

export default function RegisterPage() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
          <Pencil size={32} style={{ color: '#ca8a04' }} /> สมัครกีฬา
        </h1>
        <p className="page-subtitle">
          กรอกข้อมูลด้านล่างเพื่อสมัครกีฬาตัวแทนคณะวิทยาศาสตร์และเทคโนโลยี
        </p>
      </div>
      <RegistrationForm />
    </div>
  );
}
