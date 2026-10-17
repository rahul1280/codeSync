import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, LogOut, User as UserIcon, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import Avatar from '../common/Avatar';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <Link to="/" className="header-brand">
        <Code2 size={28} />
        <span>CodeSync</span>
      </Link>

      <nav className="header-nav">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" icon={LayoutDashboard}>
                Dashboard
              </Button>
            </Link>

            <div className="dropdown-container">
              <button
                className="btn-ghost"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <Avatar name={user?.name || user?.email || 'User'} size="sm" />
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {user?.name || user?.email?.split('@')[0]}
                </span>
                <ChevronDown size={14} color="var(--text-secondary)" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 190 }}
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="dropdown-menu" onClick={() => setDropdownOpen(false)}>
                    <Link to="/profile" className="dropdown-item">
                      <UserIcon size={16} />
                      Profile
                    </Link>
                    <div className="dropdown-divider" />
                    <button
                      className="dropdown-item danger"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">Get Started</Button>
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
