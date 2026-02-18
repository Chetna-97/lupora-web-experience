import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
    const { showAuthModal, setShowAuthModal, login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setError('');
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        resetForm();
    };

    const handleClose = () => {
        setShowAuthModal(false);
        resetForm();
        setIsLogin(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(name, email, password);
            }
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

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
                        className="relative w-full max-w-md bg-neutral-950 border border-white/10 p-8 md:p-10"
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* Header */}
                        <div className="text-center mb-8">
                            <p className="text-[#C5A059] text-[9px] uppercase tracking-[0.5em] mb-3">
                                {isLogin ? 'Welcome Back' : 'Join Lupora'}
                            </p>
                            <h2 className="text-white text-3xl font-serif italic">
                                {isLogin ? 'Sign In' : 'Create Account'}
                            </h2>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-6 px-4 py-3 border border-red-400/30 text-red-400 text-xs tracking-wider text-center">
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {!isLogin && (
                                <div>
                                    <label className="block text-gray-500 text-[9px] tracking-[0.3em] uppercase mb-2">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required={!isLogin}
                                        className="w-full bg-transparent border border-white/20 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#C5A059] transition-colors"
                                        placeholder="Your name"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-gray-500 text-[9px] tracking-[0.3em] uppercase mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-transparent border border-white/20 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#C5A059] transition-colors"
                                    placeholder="your@email.com"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-500 text-[9px] tracking-[0.3em] uppercase mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full bg-transparent border border-white/20 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#C5A059] transition-colors"
                                    placeholder={isLogin ? 'Your password' : 'Min 6 characters'}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-[#C5A059] text-black text-[10px] tracking-[0.3em] uppercase font-medium hover:bg-[#d4af6a] disabled:opacity-50 transition-all duration-500"
                            >
                                {submitting
                                    ? 'Please wait...'
                                    : isLogin ? 'Sign In' : 'Create Account'
                                }
                            </button>
                        </form>

                        {/* Switch Mode */}
                        <p className="text-center mt-6 text-gray-500 text-xs tracking-wider">
                            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                            <button
                                onClick={switchMode}
                                className="text-[#C5A059] hover:text-[#d4af6a] transition-colors"
                            >
                                {isLogin ? 'Create one' : 'Sign in'}
                            </button>
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
