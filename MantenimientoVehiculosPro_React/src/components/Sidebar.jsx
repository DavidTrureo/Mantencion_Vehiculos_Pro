import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';
import { 
  Car, 
  Wrench, 
  Users, 
  QrCode, 
  LogOut, 
  LayoutDashboard,
  User,
  Compass,
  Sparkles,
  X
} from 'lucide-react';

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onClose) onClose();
    logout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';
  const isMecanico = user.role === 'MECANICO';
  const isConductor = user.role === 'CONDUCTOR';

  return (
    <aside 
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--bg-surface-solid)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.25)',
        overflowY: 'auto'
      }}
    >
      {/* Brand Header */}
      <div 
        style={{
          padding: '1.25rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img 
            src={logoImg} 
            alt="VehiculosPro Logo" 
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              boxShadow: '0 4px 10px rgba(59, 130, 246, 0.25)'
            }}
          />
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Vehículos<span style={{ color: 'var(--primary)' }}>Pro</span>
            </h2>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Fleet Manager
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>


      {/* User Info card */}
      <div 
        style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}
      >
        <div 
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '2px solid rgba(59, 130, 246, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {user.profileImageUrl ? (
            <img 
              src={user.profileImageUrl} 
              alt="Perfil" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <User size={24} color="var(--text-secondary)" />
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.fullName || user.username}
          </h4>
          <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem', alignItems: 'center' }}>
            <span className={`badge ${
              isAdmin ? 'badge-danger' : isMecanico ? 'badge-warning' : 'badge-success'
            }`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        
        {/* Dashboard: ADMIN o MECANICO */}
        {(isAdmin || isMecanico) && (
          <NavLink 
            to="/dashboard" 
            onClick={handleLinkClick}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
        )}

        {/* Vehículos: Flota y Disponibilidad (Para todos los roles) */}
        <NavLink 
          to="/vehiculos" 
          onClick={handleLinkClick}
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Car size={20} />
          <span>Vehículos Flota</span>
        </NavLink>

        {/* Mantenimientos y Copiloto IA (ADMIN o MECANICO) */}
        {(isAdmin || isMecanico) && (
          <>
            <NavLink 
              to="/mantenimientos" 
              onClick={handleLinkClick}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Wrench size={20} />
              <span>Mantenimientos</span>
            </NavLink>

            <NavLink 
              to="/copiloto-ia" 
              onClick={handleLinkClick}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Sparkles size={20} color="#38bdf8" />
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Copiloto IA
                <span style={{ fontSize: '0.62rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>IA</span>
              </span>
            </NavLink>
          </>
        )}

        {/* Rutas y GPS: Para todos (ADMIN, MECANICO, CONDUCTOR) */}
        <NavLink 
          to="/rutas-gps" 
          onClick={handleLinkClick}
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Compass size={20} color="#10b981" />
          <span>Rutas y GPS</span>
        </NavLink>

        {/* Enlaces de ADMIN únicamente */}
        {isAdmin && (
          <NavLink 
            to="/usuarios" 
            onClick={handleLinkClick}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Users size={20} />
            <span>Usuarios</span>
          </NavLink>
        )}

        {/* Enlaces de CONDUCTOR o cualquier rol para verificar */}
        <NavLink 
          to="/escanear-qr" 
          onClick={handleLinkClick}
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <QrCode size={20} />
          <span>Escanear QR / Turno</span>
        </NavLink>
      </nav>

      {/* Logout Footer */}
      <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border-color)' }}>
        <button 
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            color: 'var(--color-danger)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)';
          }}
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      <style>{`
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.8rem 1rem;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--radius-md);
          font-weight: 500;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }

        .sidebar-link:hover {
          color: var(--text-primary);
          background-color: rgba(255, 255, 255, 0.04);
        }

        .sidebar-link.active {
          color: #ffffff;
          background-color: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.25);
          box-shadow: inset 0 0 10px rgba(59, 130, 246, 0.05);
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
