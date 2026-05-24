'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import API from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/restaurants');
  }, [loading, user, router]);

  const [mode, setMode] = useState('clerk');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { data } = await API.post('/auth/login', form);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      localStorage.setItem('auth_token', data.token);
      window.__clerk_token = data.token;
      router.push('/restaurants');
      router.refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'clerk' ? 'email' : 'clerk');
    setError('');
  };

  if (loading) return null;
  if (user) return null;

  return (
    <div className="auth-page">
      <div className="auth-card slide-up">
        {/* Tab toggle */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'clerk' ? 'active' : ''}`}
            onClick={() => setMode('clerk')}
          >
            Social Login
          </button>
          <button
            className={`auth-tab ${mode === 'email' ? 'active' : ''}`}
            onClick={() => setMode('email')}
          >
            Email & Password
          </button>
        </div>

        {mode === 'email' ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <h2 className="auth-title">Sign in with email</h2>

            {error && <div className="auth-error">{error}</div>}

            <div className="input-group">
              <label>Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                className="input"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 8 }}
              disabled={submitting}
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="auth-footer-text">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="auth-link">Create one</Link>
            </p>
          </form>
        ) : (
          <SignIn
            appearance={{
              elements: {
                rootBox: { width: '100%' },
                card: { boxShadow: 'none', border: 'none', background: 'transparent' },
                headerTitle: { color: '#ffffff', fontSize: '1.5rem', fontWeight: '700' },
                headerSubtitle: { color: '#cbd5e1' },
                socialButtonsBlockButton: { backgroundColor: '#1e293b', border: '1px solid #334155', color: '#ffffff' },
                dividerLine: { backgroundColor: '#334155' },
                dividerText: { color: '#94a3b8' },
                formFieldLabel: { color: '#cbd5e1' },
                formFieldInput: { backgroundColor: '#1e293b', border: '1px solid #334155', color: '#ffffff' },
                formButtonPrimary: { backgroundColor: '#f97316', color: '#ffffff', '&:hover': { backgroundColor: '#ea6c0a' } },
                footerActionText: { color: '#94a3b8' },
                footerActionLink: { color: '#f97316' },
                identityPreviewText: { color: '#ffffff' },
                formResendCodeLink: { color: '#f97316' },
              },
              layout: { socialButtonsPlacement: 'top' },
              variables: {
                colorBackground: 'transparent',
                colorText: '#ffffff',
                colorTextSecondary: '#cbd5e1',
                colorInputBackground: '#1e293b',
                colorInputText: '#ffffff',
                colorPrimary: '#f97316',
              },
            }}
            routing="path"
            path="/login"
            signUpUrl="/register"
            forceRedirectUrl="/restaurants"
          />
        )}

        {/* Clerk bottom link shown in email mode */}
        {mode === 'email' && (
          <p className="auth-footer-text" style={{ textAlign: 'center', marginTop: 16 }}>
            Or{' '}
            <button
              onClick={toggleMode}
              style={{ background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 'inherit' }}
            >
              sign in with Google / GitHub
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
