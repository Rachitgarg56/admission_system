'use client';
import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ROLES } from '../lib/constants';

const navItems = [
  { label: 'Dashboard',    href: '/dashboard',  roles: ['Admin', 'Admission Officer', 'Management'] },
  { label: 'Programs',     href: '/programs',   roles: ['Admin'] },
  { label: 'Applicants',   href: '/applicants', roles: ['Admin', 'Admission Officer'] },
  { label: 'Allocate Seat',href: '/allocate',   roles: ['Admission Officer'] },
  { label: 'Confirmations',href: '/confirm',    roles: ['Admission Officer'] },
];

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [role, setRole] = useState('Admission Officer');

  const visibleNav = navItems.filter(n => n.roles.includes(role));

  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {/* Sidebar */}
          <aside style={{
            width: '220px', flexShrink: 0,
            background: 'var(--accent)',
            color: '#fff',
            display: 'flex', flexDirection: 'column',
            padding: '1.5rem 0',
            position: 'sticky', top: 0, height: '100vh',
          }}>
            {/* Logo */}
            <div style={{ padding: '0 1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', lineHeight: 1.2 }}>
                Admission<br />System
              </div>
              <div style={{ fontSize: '11px', opacity: 0.55, marginTop: '2px' }}>2026 · Minimal</div>
            </div>

            {/* Role selector */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', opacity: 0.55, marginBottom: '6px', textTransform: 'uppercase' }}>
                Logged in as
              </div>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.1)',
                  color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '5px', padding: '5px 8px',
                  fontSize: '13px', cursor: 'pointer', outline: 'none',
                }}
              >
                {ROLES.map(r => <option key={r} value={r} style={{ background: 'var(--accent)', color: '#fff' }}>{r}</option>)}
              </select>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '1rem 0' }}>
              {visibleNav.map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link key={item.href} href={item.href} style={{
                    display: 'block',
                    padding: '0.55rem 1.25rem',
                    fontSize: '13px',
                    fontWeight: active ? 600 : 400,
                    color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                    background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                    textDecoration: 'none',
                    borderLeft: active ? '3px solid #7ec89a' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div style={{ padding: '1rem 1.25rem', fontSize: '11px', opacity: 0.4 }}>
              edumerge · Assignment
            </div>
          </aside>

          {/* Main */}
          <main style={{ flex: 1, padding: '2rem 2.5rem', maxWidth: '960px' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
