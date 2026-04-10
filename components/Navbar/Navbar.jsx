'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import styles from './Navbar.module.css';

const farmerLinks = [
  { href: '/farmer/dashboard', label: 'Dashboard' },
  { href: '/farmer/my-listings', label: 'My Listings' },
  { href: '/farmer/orders', label: 'Orders' },
  { href: '/farmer/payments', label: 'Payments' },
  { href: '/farmer/analytics', label: 'Analytics' },
  { href: '/farmer/skills', label: 'Skills & Jobs' },
];

const buyerLinks = [
  { href: '/buyer/dashboard', label: 'Dashboard' },
  { href: '/buyer/browse', label: 'Browse Produce' },
  { href: '/buyer/market-prices', label: 'Market Prices' },
  { href: '/buyer/orders', label: 'Orders' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const links = user?.role === 'farmer' ? farmerLinks : user?.role === 'buyer' ? buyerLinks : [];

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <Link href={user ? `/${user.role}/dashboard` : '/'} className={styles.logo}>
        🌾 <span>AgroLink</span>
      </Link>

      {user && (
        <>
          <button
            className={`${styles.hamburger} ${menuOpen ? styles.open : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span></span><span></span><span></span>
          </button>

          <ul className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}>
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={pathname === link.href ? styles.active : ''}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
            </li>
          </ul>
        </>
      )}
    </nav>
  );
}
