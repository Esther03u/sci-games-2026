import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import MobileBottomNav from '@/components/public/MobileBottomNav';
import PageTransition from '@/components/ui/PageTransition';

export default function PublicLayout({ children }) {
  return (
    <div
      className="public-app-shell"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Navbar />
      <main
        className="container public-app-main"
        style={{
          paddingTop: '6rem',
          flex: 1,
          width: '100%',
        }}
      >
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
