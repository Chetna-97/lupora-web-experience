import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import usePageTitle from '../utils/usePageTitle';

export default function ResetPasswordPage() {
  usePageTitle('Reset Password');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-surface pt-24 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-red-400 text-sm tracking-widest uppercase mb-6">Invalid reset link</p>
          <Link
            to="/"
            className="px-10 py-3 border border-foreground/20 text-foreground text-[9px] tracking-[0.4em] uppercase hover:bg-accent hover:border-accent hover:text-black transition-all duration-500"
          >
            Go Home
          </Link>
        </motion.div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-surface pt-24 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <p className="text-accent text-[9px] uppercase tracking-[0.5em] mb-3">Success</p>
          <h1 className="text-foreground text-3xl font-serif italic mb-4">Password Reset</h1>
          <p className="text-muted text-sm mb-8">Your password has been updated. You can now sign in with your new password.</p>
          <Link
            to="/"
            className="px-10 py-3 bg-accent text-black text-[9px] tracking-[0.4em] uppercase font-medium hover:bg-accent-hover transition-all duration-500"
          >
            Go to Homepage
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pt-24 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <p className="text-accent text-[9px] uppercase tracking-[0.5em] mb-3">Lupora</p>
          <h1 className="text-foreground text-3xl font-serif italic">Set New Password</h1>
        </div>

        {errorMsg && (
          <div className="mb-6 px-4 py-3 border border-red-400/30 text-red-400 text-xs tracking-wider text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-subtle text-[9px] tracking-[0.3em] uppercase mb-2">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-transparent border border-foreground/20 text-foreground text-sm px-4 py-3 focus:outline-none focus:border-accent transition-colors"
              placeholder="Min 6 characters"
            />
          </div>
          <div>
            <label className="block text-subtle text-[9px] tracking-[0.3em] uppercase mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-transparent border border-foreground/20 text-foreground text-sm px-4 py-3 focus:outline-none focus:border-accent transition-colors"
              placeholder="Repeat password"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-4 bg-accent text-black text-[10px] tracking-[0.3em] uppercase font-medium hover:bg-accent-hover disabled:opacity-50 transition-all duration-500"
          >
            {status === 'loading' ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
