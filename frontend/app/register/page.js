'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import toast from 'react-hot-toast';
import { Zap, Building2, User, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function RegisterOrgPage() {
    const [form, setForm] = useState({ orgName: '', orgSlug: '', name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const set = (key) => (e) => {
        const value = key === 'orgSlug' ? e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : e.target.value;
        setForm(p => ({ ...p, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', form);
            login(data);
            toast.success('Organization created! Welcome to EventFlow 🎉');
            router.push('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        if (!form.orgName || !form.orgSlug) {
            toast.error("Please fill in the Organization Name and Slug first.");
            return;
        }

        setLoading(true);
        try {
            const { auth, googleProvider, signInWithPopup, isFirebaseConfigured } = await import('../../lib/firebase');
            if (!isFirebaseConfigured || !auth || !googleProvider) {
                toast.error('Google Registration is not configured yet. Please register with your email and password below.');
                setLoading(false);
                return;
            }
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const { data } = await api.post('/auth/google-login', {
                email: user.email,
                name: user.displayName || 'Google User',
                orgName: form.orgName,
                orgSlug: form.orgSlug
            });

            login(data);
            toast.success('Organization created! Welcome to EventFlow 🎉');
            router.push('/dashboard');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || err.message || 'Google Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'transparent', position: 'relative', overflowX: 'hidden' }}>
            <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 10 }}>
                <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #ff4c83 0%, #90003d 100%)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(255,76,131,0.3)' }}>
                            <Zap size={22} color="#fff" />
                        </div>
                        <span style={{ fontSize: 26, fontWeight: 800 }}>Event<span style={{ color: '#ff4c83' }}>Flow</span></span>
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>Create your workspace</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Set up your organization in seconds</p>
                </motion.div>

                <motion.div variants={itemVariants} className="card" style={{ padding: '36px 32px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>

                    <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{ background: 'rgba(124,58,237,0.15)', padding: 8, borderRadius: 8 }}><Building2 size={16} color="var(--accent-light)" /></div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>1. Organization Details</span>
                        </div>
                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Company Name *</label>
                                <input id="org-name" className="form-input" style={{ padding: '12px 14px', fontSize: 15 }} placeholder="Acme Corp" value={form.orgName} onChange={set('orgName')} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Workspace URL *</label>
                                <input id="org-slug" className="form-input" style={{ padding: '12px 14px', fontSize: 15 }} placeholder="acme-corp" value={form.orgSlug} onChange={set('orgSlug')} required />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ background: 'rgba(59,130,246,0.15)', padding: 8, borderRadius: 8 }}><User size={16} color="#60a5fa" /></div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>2. Admin Account</span>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={handleGoogleRegister}
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
                        Create Account with Google
                    </motion.button>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                        <span style={{ padding: '0 14px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 11 }}>Or create manually</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input id="admin-name" className="form-input" style={{ padding: '12px 14px', fontSize: 15 }} placeholder="Jane Doe" value={form.name} onChange={set('name')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input id="admin-email" type="email" className="form-input" style={{ padding: '12px 14px', fontSize: 15 }} placeholder="jane@acme.com" value={form.email} onChange={set('email')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input id="admin-password" type="password" className="form-input" style={{ padding: '12px 14px', fontSize: 15 }} placeholder="Min. 6 characters" value={form.password} onChange={set('password')} minLength={6} />
                            </div>
                        </div>

                        <motion.button
                            id="register-btn"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="btn btn-primary"
                            style={{ padding: '12px', marginTop: 8, width: '100%', justifyContent: 'center', fontSize: 15 }}
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Organization & Account'}
                        </motion.button>
                    </form>
                </motion.div>

                <motion.p variants={itemVariants} style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: 'var(--accent-light)', fontWeight: 600 }}>Sign in →</Link>
                </motion.p>
            </motion.div>
        </div>
    );
}
