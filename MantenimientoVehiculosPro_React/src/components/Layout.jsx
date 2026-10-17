import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X, Car } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      import('../services/firebase').then(({ requestNotificationPermission }) => {
        requestNotificationPermission(user.id, user.role);
      });
    }
  }, [user]);

  if (!user) return <Outlet />;

  return (
    <div className="app-container">
      {/* Desktop Sidebar (Only rendered/visible on desktop) */}
      <div className="desktop-sidebar-container">
        <Sidebar />
      </div>

      {/* Mobile Menu Backdrop (Closes menu on tap outside) */}
      <div 
        className={`mobile-backdrop ${mobileMenuOpen ? 'visible' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Sidebar Drawer (Slides in/out smoothly) */}
      <div className={`mobile-sidebar-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <Sidebar onClose={() => setMobileMenuOpen(false)} />
      </div>

      {/* Mobile Top Header */}
      <header className="mobile-header">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Abrir o cerrar menú"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.4rem'
          }}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Car size={20} color="var(--primary)" />
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
            Vehículos<span style={{ color: 'var(--primary)' }}>Pro</span>
          </span>
        </div>

        <div style={{ width: '36px' }}>{/* Spacer for symmetrical centering */}</div>
      </header>

      {/* Main Page Wrapper */}
      <main className="main-content">
        <Outlet />
      </main>

      <style>{`
        .desktop-sidebar-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 260px;
          height: 100vh;
          z-index: 100;
        }

        .mobile-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 199;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease;
        }

        .mobile-backdrop.visible {
          opacity: 1;
          pointer-events: auto;
        }

        .mobile-sidebar-drawer {
          position: fixed;
          top: 0;
          left: 0;
          width: 280px;
          max-width: 82vw;
          height: 100vh;
          z-index: 200;
          transform: translateX(-105%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 4px 0 25px rgba(0, 0, 0, 0.5);
          display: flex;
        }

        .mobile-sidebar-drawer.open {
          transform: translateX(0);
        }

        .mobile-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background-color: var(--bg-surface-solid);
          border-bottom: 1px solid var(--border-color);
          display: none;
          align-items: center;
          justifyContent: space-between;
          padding: 0 1rem;
          z-index: 90;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }

        @media (min-width: 769px) {
          .mobile-backdrop,
          .mobile-sidebar-drawer,
          .mobile-header {
            display: none !important;
          }
        }

        @media (max-width: 768px) {
          .desktop-sidebar-container {
            display: none !important;
          }
          .mobile-header {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;

