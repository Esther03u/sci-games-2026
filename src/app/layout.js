import { Kanit } from 'next/font/google';
import './globals.css';
import PageTracker from '@/components/public/PageTracker';

const kanit = Kanit({
  subsets: ['thai', 'latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-kanit',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'Sci Games — กีฬาสานสัมพันธ์ภายใน',
    template: '%s | Sci Games',
  },
  description:
    'เว็บไซต์กีฬาสานสัมพันธ์ภายใน คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต 9-11 ตุลาคม 2569',
  keywords: ['กีฬาสี', 'Sci Games', 'ราชภัฏภูเก็ต', 'กีฬาสานสัมพันธ์'],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sci Games',
  },
  openGraph: {
    title: 'Sci Games — กีฬาสานสัมพันธ์ภายใน',
    description: 'เว็บไซต์กีฬาสานสัมพันธ์ภายใน คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต',
    type: 'website',
    locale: 'th_TH',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0b0e' },
  ],
};

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={kanit.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={kanit.className}>
        <PageTracker />
        <div className="app-content-root" style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
