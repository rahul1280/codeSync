import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomApi } from '../api/roomApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function JoinPage() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState(null);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      // Save intent to redirect after login
      navigate(`/login?redirect=join&code=${inviteCode}`, { replace: true });
      return;
    }

    if (attemptedRef.current) return;
    attemptedRef.current = true;

    async function attemptJoin() {
      try {
        const res = await roomApi.joinRoom(inviteCode);
        const joinedRoom = res.room || res;
        toast.success('Joined room successfully!');
        navigate(`/room/${joinedRoom._id || joinedRoom.id}`, { replace: true });
      } catch (err) {
        const msg = err.response?.data?.message || 'Invalid or expired invitation link.';
        setError(msg);
      }
    }

    attemptJoin();
  }, [inviteCode, isAuthenticated, authLoading, navigate, toast]);

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <AlertCircle size={48} color="var(--accent-danger)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Invitation Error</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: '24px' }}>
          {error}
        </p>
        <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px',
      }}
    >
      <Spinner size="lg" />
      <span style={{ color: 'var(--text-secondary)' }}>Joining collaboration room...</span>
    </div>
  );
}
