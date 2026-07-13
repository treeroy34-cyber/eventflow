'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Calendar, User, Mail, Phone, Building, ArrowRight, Zap, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialEventId = searchParams.get('eventId') || '';

    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);

    const [form, setForm] = useState({
        eventId: initialEventId,
        attendeeName: '',
        email: '',
        phone: '',
        organization: ''
    });

    const [registering, setRegistering] = useState(false);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        // Fetch all published/open events for the dropdown
        api.get('/events').then(res => {
            setEvents(res.data);
            if (!form.eventId && res.data.length > 0) {
                setForm(p => ({ ...p, eventId: res.data[0]._id }));
            }
        }).catch(err => {
            console.error(err);
            toast.error('Failed to load events');
        }).finally(() => setLoadingEvents(false));
    }, []); // Only fetch once on mount

    const handleRegister = async (e) => {
        e.preventDefault();
        setRegistering(true);
        try {
            // Re-map to the underlying /api/register route
            const res = await api.post('/register', form);
            setSuccess(res.data);
            toast.success('Successfully registered!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setRegistering(false);
        }
    };

    if (loadingEvents) {
        return <div className="loading-center"><div className="spinner" /></div>;
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Simple Navbar */}
            <nav className="navbar" style={{ position: 'relative', zIndex: 10, background: 'rgba(9, 9, 15, 0.6)', backdropFilter: 'blur(12px)' }}>
                <div className="navbar-inner">
                    <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={18} color="var(--accent)" />
                        <span style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>EventFlow</span>
                    </Link>
                </div>
            </nav>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', zIndex: 10 }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card"
                    style={{ width: '100%', maxWidth: 500, padding: 40 }}
                >
                    {success ? (
                        <div style={{ textAlign: 'center' }}>
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                                <CheckCircle size={64} color="var(--green)" style={{ margin: '0 auto 20px' }} />
                            </motion.div>
                            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>You're In!</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Your registration for the event was successful. A confirmation email with your QR ticket has been sent to {success.registration?.email}.</p>

                            {success.qrCode && (
                                <div style={{ background: '#fff', padding: 20, borderRadius: 16, display: 'inline-block', marginBottom: 24 }}>
                                    <img src={success.qrCode} alt="QR Code" width={180} />
                                </div>
                            )}

                            <Link href="/" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                                Return to Events
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Register for Event</h1>
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: 32 }}>Fill out the form below to secure your spot.</p>

                            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Calendar size={14} color="var(--accent-light)" /> Select Event *
                                    </label>
                                    <select
                                        className="form-input"
                                        value={form.eventId}
                                        onChange={e => setForm(p => ({ ...p, eventId: e.target.value }))}
                                        required
                                        style={{ appearance: 'auto', padding: '14px 16px', fontSize: 15 }}
                                    >
                                        <option value="" disabled>Choose an event...</option>
                                        {events.map(ev => (
                                            <option key={ev._id} value={ev._id}>
                                                {ev.title} — {format(new Date(ev.date), 'MMM d')}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <User size={14} color="var(--accent-light)" /> Full Name *
                                    </label>
                                    <input className="form-input" placeholder="Jane Doe" value={form.attendeeName} onChange={e => setForm(p => ({ ...p, attendeeName: e.target.value }))} required style={{ padding: '14px 16px', fontSize: 15 }} />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Mail size={14} color="var(--accent-light)" /> Email Address *
                                    </label>
                                    <input type="email" className="form-input" placeholder="jane@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required style={{ padding: '14px 16px', fontSize: 15 }} />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Phone size={14} color="var(--accent-light)" /> Phone Number <span style={{ opacity: 0.5 }}>(optional)</span>
                                    </label>
                                    <input className="form-input" placeholder="+1 555 0123" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={{ padding: '14px 16px', fontSize: 15 }} />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Building size={14} color="var(--accent-light)" /> Organization <span style={{ opacity: 0.5 }}>(optional)</span>
                                    </label>
                                    <input className="form-input" placeholder="Company or University" value={form.organization} onChange={e => setForm(p => ({ ...p, organization: e.target.value }))} style={{ padding: '14px 16px', fontSize: 15 }} />
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="btn btn-primary btn-lg"
                                    style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
                                    disabled={registering || events.length === 0}
                                >
                                    {registering ? 'Processing...' : 'Complete Registration'} <ArrowRight size={16} />
                                </motion.button>
                            </form>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

export default function RegisterEventPage() {
    return (
        <Suspense fallback={<div className="loading-center"><div className="spinner" /></div>}>
            <RegisterForm />
        </Suspense>
    );
}
