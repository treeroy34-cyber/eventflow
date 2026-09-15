'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import toast from 'react-hot-toast';
import { Zap, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import ScrollZoom from '../../components/ScrollZoom';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 15, bounce: 0.4 } }
};

export default function LoginPage() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', form);
            login(data);
            toast.success(`Welcome back, ${data.user.name}!`);
            router.push('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const { auth, googleProvider, signInWithPopup, isFirebaseConfigured } = await import('../../lib/firebase');
            if (!isFirebaseConfigured || !auth || !googleProvider) {
                toast.error('Google Sign-In is not configured yet. Please sign in with your email and password below.');
                setLoading(false);
                return;
            }
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const { data } = await api.post('/auth/google-login', {
                email: user.email,
                name: user.displayName || 'Google User'
            });

            login(data);
            toast.success(`Welcome back, ${data.user.name}!`);
            router.push('/dashboard');
        } catch (err) {
            console.error(err);
            if (err.response?.status === 404) {
                toast.error('Account not found. Please register your organization first.');
                router.push('/register');
            } else {
                toast.error(err.response?.data?.message || err.message || 'Google Login failed.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'transparent', position: 'relative', overflowX: 'hidden' }}>
            <ScrollZoom scaleRange={[0.95, 1, 1, 0.95]}>
            <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 10 }}>
                {/* Logo */}
                <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: 40 }} className="flex flex-col items-center">
                    <Link href="/" style={{ textDecoration: 'none' }} className="flex items-center gap-2 cursor-pointer group mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-neon to-accent-dark flex items-center justify-center text-white shadow-[0_0_15px_rgba(236,72,153,0.5)] group-hover:shadow-[0_0_25px_rgba(236,72,153,0.8)] transition-all">
                            <Zap size={24} className="fill-white" />
                        </div>
                        <span className="font-display-xl text-[28px] font-bold text-white tracking-wide">
                            Event<span className="text-pink-neon neon-text-glow">Flow</span>
                        </span>
                    </Link>
                    <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>Welcome back</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Sign in to your organization dashboard</p>
                </motion.div>

                <motion.div variants={itemVariants} className="card" style={{ padding: '36px 32px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        style={{
                            width: '100%', padding: '12px', marginBottom: '24px',
                            background: '#ffffff', color: '#111118', border: '1px solid #e2e8f0',
                            borderRadius: '12px', fontSize: '15px', fontWeight: '600',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /><path d="M1 1h22v22H1z" fill="none" /></svg>
                        Continue with Google
                    </motion.button>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                        <span style={{ padding: '0 14px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 11 }}>Or continue with email</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="form-group">
                            <label className="form-label">Email address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    id="login-email"
                                    type="email"
                                    className="form-input"
                                    style={{ padding: '12px 14px 12px 42px', fontSize: 15 }}
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                Password
                                <span style={{ color: 'var(--accent-light)', cursor: 'pointer', fontWeight: 600 }}>Forgot?</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    id="login-password"
                                    type="password"
                                    className="form-input"
                                    style={{ padding: '12px 14px 12px 42px', fontSize: 15 }}
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>
                        <motion.button
                            id="login-btn"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="btn btn-primary"
                            style={{ padding: '12px', marginTop: 8, width: '100%', justifyContent: 'center', fontSize: 15 }}
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </motion.button>
                    </form>
                </motion.div>

                <motion.p variants={itemVariants} style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
                    New organization?{' '}
                    <Link href="/register" style={{ color: 'var(--accent-light)', fontWeight: 600 }}>Create account →</Link>
                </motion.p>
            </motion.div>
            </ScrollZoom>
        </div>
    );
}
