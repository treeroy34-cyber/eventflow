'use client';
import Link from 'next/link';
import { XCircle, ArrowLeft, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CancelPage() {
    return (
        <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', flexDirection: 'column' }}>
            <nav className="navbar" style={{ background: 'rgba(9, 9, 15, 0.6)' }}>
                <div className="navbar-inner">
                    <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <Zap size={24} color="var(--accent)" />
                        <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                            Event<span style={{ color: 'var(--accent-light)' }}>Flow</span>
                        </span>
                    </Link>
                </div>
            </nav>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '60px 40px' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', marginBottom: 24, color: '#ef4444' }}>
                        <XCircle size={40} />
                    </div>

                    <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Payment Cancelled</h1>
                    <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
                        You have cancelled the checkout process. Your card was not charged and your registration was not completed.
                    </p>

                    <Link href="/" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', justifyContent: 'center', gap: 8 }}>
                        <ArrowLeft size={18} /> Return to Events
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
