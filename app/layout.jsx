import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/lib/toast-context';
import Navbar from '@/components/Navbar/Navbar';
import MandiTicker from '@/components/MandiTicker/MandiTicker';
import GoogleTranslate from '@/components/GoogleTranslate/GoogleTranslate';
import AnnouncementBar from '@/components/AnnouncementBar/AnnouncementBar';

export const metadata = {
  title: 'AgroLink — Fair Deals, Straight From the Field',
  description: 'AgroLink connects Indian farmers directly with verified buyers. No middlemen, fair prices, transparent supply chain tracking and secure payments.',
  keywords: 'agriculture, farmer, buyer, mandi prices, crop trading, India, AgroLink',
  openGraph: {
    title: 'AgroLink — Fair Deals, Straight From the Field',
    description: 'Direct farm-to-buyer trading platform for Indian farmers',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌾</text></svg>" />
      </head>
      <body>
        <ToastProvider>
          <AuthProvider>
            <AnnouncementBar />
            <Navbar />
            <MandiTicker />
            <main style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
              {children}
            </main>
            <GoogleTranslate />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
