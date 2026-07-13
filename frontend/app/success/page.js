'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import { CheckCircle, Calendar, Download, Zap, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('session_id');
    const [status, setStatus] = useState('verifying');
    const [registration, setRegistration] = useState(null);

    useEffect(() => {
        if (!sessionId) {
            router.push('/');
            return;
        }

        const verifyPayment = async () => {
            try {
                const res = await api.post('/payment/verify', { sessionId });
                setRegistration(res.data.registration);
                setStatus('success');
            } catch (err) {
                console.error('Payment verification failed:', err);
                setStatus('error');
            }
        };

        verifyPayment();
    }, [sessionId, router]);

    if (status === 'verifying') {
        return (
            <div className="card" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '60px 40px' }}>
                <Loader2 size={48} color="var(--accent)" style={{ animation: 'spin 2s linear infinite', margin: '0 auto' }} />
                <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 24 }}>Verifying Payment...</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Please don't close this window while we secure your ticket.</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="card" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '60px 40px' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <span style={{ fontSize: 32 }}>❌</span>
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 24 }}>Verification Failed</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>We couldn't verify your payment. If you were charged, please contact support.</p>
                <Link href="/" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-flex' }}>Return to Home</Link>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ maxWidth: 560, margin: '0 auto', padding: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginBottom: 24 }}>
                    <CheckCircle size={40} />
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>Payment Successful!</h1>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 12 }}>
                    You are officially registered. We've instantly emailed your highly secure Digital Ticket to <strong>{registration?.email}</strong>.
                </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '24px 32px', marginBottom: 32 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Ticket Holder</span>
                        <span style={{ fontWeight: 600 }}>{registration?.attendeeName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Secure Ticket ID</span>
                        <span style={{ fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.1em', color: 'var(--accent-light)' }}>{registration?.ticketId}</span>
                    </div>

                    {registration?.qrCode && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ background: '#ffffff', padding: 12, borderRadius: 12 }}>
                                <img src={registration.qrCode} alt="Ticket QR Code" style={{ width: 140, height: 140, display: 'block' }} />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Status</span>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>PAID & CONFIRMED</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 16, flexDirection: 'column' }}>
                {registration?.qrCode && (
                    <a
                        href={registration.qrCode}
                        download={`ticket-${registration.ticketId}.png`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', justifyContent: 'center', gap: 8 }}
                    >
                        <Download size={18} /> Download QR Ticket
                    </a>
                )}
                <Link href="/" className="btn btn-secondary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                    <Calendar size={18} /> Browse More Events
                </Link>
            </div>
        </motion.div>
    );
}

export default function SuccessPage() {
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
                <Suspense fallback={<div className="spinner" />}>
                    <SuccessContent />
                </Suspense>
            </div>
        </div>
    );
}
