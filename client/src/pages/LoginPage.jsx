import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Code2 } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectJoinCode = searchParams.get('code');
  const from = redirectJoinCode
    ? `/join/${redirectJoinCode}`
    : location.state?.from?.pathname || '/dashboard';

  const validate = () => {
    const newErrors = {};
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);

    if (emailErr) newErrors.email = emailErr;
    if (passErr) newErrors.password = passErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validate()) return;

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Code2 size={32} color="var(--accent-primary)" />
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to your CodeSync workspace</p>
        </div>

        {formError && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(248, 81, 73, 0.1)',
              border: '1px solid var(--accent-danger)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-danger)',
              fontSize: '0.85rem',
              marginBottom: '18px',
            }}
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
            }}
            placeholder="name@company.com"
            icon={Mail}
            error={errors.email}
            required
            autoFocus
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
            }}
            placeholder="••••••••"
            icon={Lock}
            error={errors.password}
            required
          />

          <Button
            type="submit"
            variant="primary"
            icon={LogIn}
            loading={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            Sign In
          </Button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to={`/register${location.search}`}>Create an account</Link>
        </div>
      </div>
    </div>
  );
}
