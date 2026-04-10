import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import Navbar from '@/components/Navbar/Navbar';
import MandiTicker from '@/components/MandiTicker/MandiTicker';
import GoogleTranslate from '@/components/GoogleTranslate/GoogleTranslate';

export const metadata = {
  title: 'AgroLink — Fair Deals, Straight From the Field',
  description: 'AgroLink connects farmers directly with buyers. No middlemen, real pay, transparent supply chain tracking.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <MandiTicker />
          <main>{children}</main>
          <GoogleTranslate />
        </AuthProvider>
      </body>
    </html>
  );
}
