import Link from 'next/link';
import { Trophy } from '@/components/animate-ui/icons';

export default function NotFound() {
  return (
    <div className="nf-page">
      <div
        className="glass-card no-hover animate-fade-in"
        style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <div className="nf-icon">
          <Trophy size={64} animateOnHover />
        </div>
        <h1 className="nf-title">404</h1>
        <p className="nf-text">ไม่พบหน้าที่คุณต้องการ</p>
        <Link href="/" className="btn btn-primary btn-lg">
          กลับสู่หน้าหลัก
        </Link>
      </div>
    </div>
  );
}
