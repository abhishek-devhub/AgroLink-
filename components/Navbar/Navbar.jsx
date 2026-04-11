'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import styles from './Navbar.module.css';

const farmerLinks = [
  { href: '/farmer/dashboard',     label: 'Dashboard',    icon: '🏠' },
  { href: '/farmer/my-listings',   label: 'My Listings',  icon: '📋' },
  { href: '/farmer/orders',        label: 'Orders',       icon: '📦' },
  { href: '/farmer/smart-pricing', label: 'Smart Pricing',icon: '🌦️' },
  { href: '/farmer/analytics',     label: 'Analytics',    icon: '📊' },
  { href: '/govt-announcements',   label: 'Govt Updates', icon: '🏛️' },
  { href: '/community',            label: 'Community',    icon: '🌾' },
];

const buyerLinks = [
  { href: '/buyer/dashboard',      label: 'Dashboard',    icon: '🏠' },
  { href: '/buyer/browse',         label: 'Browse',       icon: '🛒' },
  { href: '/buyer/market-prices',  label: 'Prices',       icon: '📊' },
  { href: '/buyer/orders',         label: 'Orders',       icon: '📦' },
  { href: '/govt-announcements',   label: 'Govt Updates', icon: '🏛️' },
  { href: '/community',            label: 'Community',    icon: '🌾' },
];


export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const links = user?.role === 'farmer' ? farmerLinks : user?.role === 'buyer' ? buyerLinks : [];
  const displayName = user?.name || user?.ownerName || '';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const roleLabel = user?.role === 'farmer' ? '🌾 Farmer' : '🏪 Buyer';

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
        <Link href={user ? `/${user.role}/dashboard` : '/'} className={styles.logo}>
          <span className={styles.logoEmoji}>🌾</span>
          <span className={styles.logoText}>AgroLink</span>
        </Link>

        {user ? (
          <>
            {/* Desktop nav links */}
            <ul className={styles.navLinks}>
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`${styles.navLink} ${pathname === link.href || pathname.startsWith(link.href + '/') ? styles.active : ''}`}
                  >
                    <span className={styles.linkIcon}>{link.icon}</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* User info + logout */}
            <div className={styles.userSection}>
              <div className={styles.userInfo}>
                <div className={styles.userAvatar}
                  style={{ background: user.role === 'farmer' ? 'var(--grad-leaf)' : 'var(--grad-harvest)' }}>
                  {initials || (user.role === 'farmer' ? '🧑‍🌾' : '🏪')}
                </div>
                <div className={styles.userMeta}>
                  <div className={styles.userName}>{displayName.split(' ')[0] || 'User'}</div>
                  <div className={styles.userRole}>{roleLabel}</div>
                </div>
              </div>
              <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
                <span>↩</span> Logout
              </button>
            </div>

            {/* Hamburger */}
            <button
              className={`${styles.hamburger} ${menuOpen ? styles.open : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <span /><span /><span />
            </button>
          </>
        ) : (
          <div className={styles.guestActions}>
            <Link href="/login" className={styles.loginLink}>Login</Link>
            <Link href="/farmer/register" className="btn-primary btn-sm">Get Started</Link>
          </div>
        )}
      </nav>

      {/* Mobile drawer */}
      {user && menuOpen && (
        <div className={styles.mobileMenu} onClick={() => setMenuOpen(false)}>
          <div className={styles.mobileDrawer} onClick={e => e.stopPropagation()}>
            <div className={styles.mobileUser}
              style={{ background: user.role === 'farmer' ? 'var(--grad-leaf)' : 'var(--grad-harvest)' }}>
              <div className={styles.mobileAvatar}>{initials || '👤'}</div>
              <div>
                <div style={{ fontWeight: 700, color: '#fff' }}>{displayName}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.125rem' }}>{roleLabel}</div>
              </div>
            </div>
            <nav className={styles.mobileNav}>
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.mobileNavLink} ${pathname === link.href ? styles.mobileActive : ''}`}
                >
                  <span>{link.icon}</span> {link.label}
                </Link>
              ))}
            </nav>
            <button className={styles.mobileLogout} onClick={handleLogout}>
              ↩ Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}
