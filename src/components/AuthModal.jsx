import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
    const { showAuthModal, setShowAuthModal, login, register } = useAuth();
    const [mode, setMode] = useState('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState(false);

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setError('');
        setForgotSuccess(false);
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        resetForm();
    };

    const handleClose = () => {
        setShowAuthModal(false);
        resetForm();
        setMode('login');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            if (mode === 'login') {
                await login(email, password);
                resetForm();
            } else if (mode === 'register') {
                await register(name, email, password);
                resetForm();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Request failed');
            setForgotSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = "w-full bg-transparent border border-foreground/20 text-foreground text-sm px-4 py-3 focus:outline-none focus:border-accent transition-colors";

    return (
        <AnimatePresence>
            {showAuthModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center px-4"
                    onClick={handleClose}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-md bg-surface-alt border border-foreground/10 p-8 md:p-10"
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-subtle hover:text-foreground transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* Header */}
                        <div className="text-center mb-8">
                            <p className="text-accent text-[9px] uppercase tracking-[0.5em] mb-3">
                                {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Join Lupora' : 'Account Recovery'}
                            </p>
                            <h2 className="text-foreground text-3xl font-serif italic">
                                {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Forgot Password'}
                            </h2>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-6 px-4 py-3 border border-red-400/30 text-red-400 text-xs tracking-wider text-center">
                                {error}
                            </div>
                        )}

                        {/* Forgot Password Mode */}
                        {mode === 'forgot' ? (
                            forgotSuccess ? (
                                <div className="text-center">
                                    <p className="text-foreground-2 text-sm leading-relaxed mb-6">
                                        If an account exists with that email, we've sent a password reset link. Please check your inbox.
                                    </p>
                                    <button
                                        onClick={() => switchMode('login')}
                                        className="text-accent text-xs tracking-wider hover:text-accent-hover transition-colors"
                                    >
                                        Back to Sign In
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-subtle text-xs text-center mb-6 leading-relaxed">
                                        Enter your email and we'll send you a link to reset your password.
                                    </p>
                                    <form onSubmit={handleForgotSubmit} className="space-y-5">
                                        <div>
                                            <label className="block text-subtle text-[9px] tracking-[0.3em] uppercase mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className={inputClass}
                                                placeholder="your@email.com"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full py-4 bg-accent text-black text-[10px] tracking-[0.3em] uppercase font-medium hover:bg-accent-hover disabled:opacity-50 transition-all duration-500"
                                        >
                                            {submitting ? 'Sending...' : 'Send Reset Link'}
                                        </button>
                                    </form>
                                    <p className="text-center mt-6 text-subtle text-xs tracking-wider">
                                        <button
                                            onClick={() => switchMode('login')}
                                            className="text-accent hover:text-accent-hover transition-colors"
                                        >
                                            Back to Sign In
                                        </button>
                                    </p>
                                </>
                            )
                        ) : (
                            <>
                                {/* Login / Register Form */}
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {mode === 'register' && (
                                        <div>
                                            <label className="block text-subtle text-[9px] tracking-[0.3em] uppercase mb-2">
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                                className={inputClass}
                                                placeholder="Your name"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-subtle text-[9px] tracking-[0.3em] uppercase mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className={inputClass}
                                            placeholder="your@email.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-subtle text-[9px] tracking-[0.3em] uppercase mb-2">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className={inputClass}
                                            placeholder={mode === 'login' ? 'Your password' : 'Min 6 characters'}
                                        />
                                        {mode === 'login' && (
                                            <button
                                                type="button"
                                                onClick={() => switchMode('forgot')}
                                                className="text-subtle text-[10px] tracking-wider mt-2 hover:text-accent transition-colors"
                                            >
                                                Forgot password?
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-4 bg-accent text-black text-[10px] tracking-[0.3em] uppercase font-medium hover:bg-accent-hover disabled:opacity-50 transition-all duration-500"
                                    >
                                        {submitting
                                            ? 'Please wait...'
                                            : mode === 'login' ? 'Sign In' : 'Create Account'
                                        }
                                    </button>
                                </form>

                                {/* Switch Mode */}
                                <p className="text-center mt-6 text-subtle text-xs tracking-wider">
                                    {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                                    <button
                                        onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                                        className="text-accent hover:text-accent-hover transition-colors"
                                    >
                                        {mode === 'login' ? 'Create one' : 'Sign in'}
                                    </button>
                                </p>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
