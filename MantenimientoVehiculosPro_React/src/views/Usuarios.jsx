import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Users, 
  Plus, 
  Edit3, 
  Power, 
  X, 
  Mail, 
  Phone, 
  User, 
  ShieldAlert,
  Lock
} from 'lucide-react';
import Toast from '../components/Toast';

const Usuarios = () => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' | 'edit'
  const [editingUserId, setEditingUserId] = useState(null);

  // Form Fields
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRut, setFormRut] = useState('');
  const [formRole, setFormRole] = useState('MECANICO');
  
  // Toast
  const [toast, setToast] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const list = await api.getUsuarios();
      setUsers(list);
    } catch (e) {
      console.error("Error al cargar usuarios:", e);
      setToast({ message: 'Error al cargar los usuarios del sistema.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreateModal = () => {
    setModalType('create');
    setEditingUserId(null);
    setFormUsername('');
    setFormPassword('');
    setFormFullName('');
    setFormEmail('');
    setFormPhone('');
    setFormRut('');
    setFormRole('MECANICO');
    setShowModal(true);
  };

  const handleOpenEditModal = (u) => {
    setModalType('edit');
    setEditingUserId(u.id);
    setFormUsername(u.username);
    setFormPassword(''); // Contraseña en blanco para no sobreescribir si no se edita
    setFormFullName(u.fullName || '');
    setFormEmail(u.email);
    setFormPhone(u.phoneNumber || '');
    setFormRut(u.rut || '');
    setFormRole(u.role);
    setShowModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();

    if (!formUsername || !formEmail || !formRut || !formRole) {
      setToast({ message: 'Todos los campos marcados son requeridos.', type: 'error' });
      return;
    }

    if (modalType === 'create' && !formPassword) {
      setToast({ message: 'La contraseña es obligatoria para nuevos usuarios.', type: 'error' });
      return;
    }

    // Validar RUT básico
    const rutRegex = /^\d{7,8}-[\dKk]$/;
    if (!rutRegex.test(formRut)) {
      setToast({ message: 'El formato de RUT debe ser: 12345678-K', type: 'error' });
      return;
    }

    // Validar teléfono básico
    if (formPhone && !formPhone.startsWith('+569')) {
      setToast({ message: 'El formato de teléfono debe ser: +56912345678', type: 'error' });
      return;
    }

    const payload = {
      username: formUsername,
      email: formEmail,
      fullName: formFullName,
      phoneNumber: formPhone || null,
      rut: formRut,
      role: formRole
    };

    if (formPassword) {
      payload.password = formPassword;
    }

    const getEditorId = () => {
      return currentUser?.id || currentUser?.userId || users.find(u => u.username === currentUser?.username)?.id || 1;
    };

    try {
      const editorId = getEditorId();
      if (modalType === 'create') {
        // Verificar si el usuario ya existe
        const check = await api.checkUsername(formUsername);
        if (check.exists) {
          setToast({ message: 'El nombre de usuario o correo ya está en uso.', type: 'error' });
          return;
        }

        await api.crearUsuario(editorId, payload);
        setToast({ message: 'Usuario creado exitosamente.', type: 'success' });
      } else {
        await api.actualizarUsuario(editingUserId, editorId, payload);
        setToast({ message: 'Información de usuario actualizada.', type: 'success' });
      }
      setShowModal(false);
      fetchUsers();
    } catch (e) {
      console.error("Error al guardar usuario:", e);
      setToast({ message: e.message || 'Error al guardar usuario.', type: 'error' });
    }
  };

  const handleToggleStatus = async (id) => {
    const editorId = currentUser?.id || currentUser?.userId || users.find(u => u.username === currentUser?.username)?.id || 1;
    if (id === editorId) {
      setToast({ message: 'No puedes desactivar tu propia cuenta.', type: 'warning' });
      return;
    }

    try {
      await api.toggleUsuarioStatus(id, editorId);
      setToast({ message: `Estado del usuario modificado con éxito.`, type: 'success' });
      fetchUsers();
    } catch (e) {
      console.error("Error al cambiar estado:", e);
      setToast({ message: 'Error al cambiar estado del usuario.', type: 'error' });
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Header */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '1rem',
          marginBottom: '2rem' 
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Panel de Usuarios
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Administre las cuentas de administradores, mecánicos y conductores
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={18} />
          <span>Crear Usuario</span>
        </button>
      </div>

      {/* Users List Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border-color)' }}>
          <table 
            style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              textAlign: 'left',
              fontSize: '0.9rem'
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Usuario</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre Completo</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>RUT</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Rol</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Contacto</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Estado</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr 
                  key={u.id} 
                  style={{ 
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{u.username}</td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{u.fullName || 'No registrado'}</td>
                  <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace' }}>{u.rut}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span className={`badge ${
                      u.role === 'ADMIN' ? 'badge-danger' : u.role === 'MECANICO' ? 'badge-warning' : 'badge-success'
                    }`} style={{ fontSize: '0.65rem' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.8rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={12} /> {u.email}</span>
                      {u.phoneNumber && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={12} /> {u.phoneNumber}</span>}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span className={`badge ${u.status === 1 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                      {u.status === 1 ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        title="Editar"
                        style={{ padding: '0.35rem' }}
                        onClick={() => handleOpenEditModal(u)}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        title={u.status === 1 ? "Desactivar" : "Activar"}
                        style={{ 
                          padding: '0.35rem', 
                          color: u.status === 1 ? 'var(--color-danger)' : 'var(--color-success)',
                          borderColor: u.status === 1 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          backgroundColor: u.status === 1 ? 'rgba(239, 68, 68, 0.02)' : 'rgba(16, 185, 129, 0.02)'
                        }}
                        onClick={() => handleToggleStatus(u.id, u.fullName || u.username)}
                        disabled={u.id === currentUser.id}
                      >
                        <Power size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE & EDIT USER MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContext: 'space-between', alignItems: 'center', marginBottom: '1.5rem', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.35rem' }}>
                {modalType === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Username */}
                <div className="form-group">
                  <label className="form-label">Nombre de Usuario *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="ej. jsmith"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      style={{ paddingLeft: '2.5rem' }}
                      required
                      disabled={modalType === 'edit'}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="form-label">
                    {modalType === 'create' ? 'Contraseña *' : 'Contraseña (vacío para no cambiar)'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="••••••••"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      style={{ paddingLeft: '2.5rem' }}
                      required={modalType === 'create'}
                    />
                  </div>
                </div>
              </div>

              {/* Nombre Completo */}
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="ej. John Smith"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Correo Electrónico *</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="ej. jsmith@vehiculospro.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid-2">
                {/* RUT */}
                <div className="form-group">
                  <label className="form-label">RUT *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="12345678-K"
                    value={formRut}
                    onChange={(e) => setFormRut(e.target.value)}
                    required
                  />
                </div>

                {/* Rol */}
                <div className="form-group">
                  <label className="form-label">Rol del Sistema *</label>
                  <select 
                    className="form-input form-select"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    required
                  >
                    <option value="ADMIN">Administrador (ADMIN)</option>
                    <option value="MECANICO">Mecánico (MECANICO)</option>
                    <option value="CONDUCTOR">Conductor (CONDUCTOR)</option>
                  </select>
                </div>
              </div>

              {/* Teléfono */}
              <div className="form-group">
                <label className="form-label">Teléfono de Contacto</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="+56912345678"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Formato requerido: +569 seguido de 8 dígitos</span>
              </div>

              {/* Action buttons */}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalType === 'create' ? 'Crear' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Toast Messages */}
      {toast && (
        <div className="toast-container">
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Usuarios;
