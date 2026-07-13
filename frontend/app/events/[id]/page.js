'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Calendar, MapPin, Users, ArrowLeft, Zap, Info, Download, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollZoom from '../../../components/ScrollZoom';

// Animation variants
const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const slideUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

export default function EventDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [event, setEvent] = useState(null);
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [success, setSuccess] = useState(null);
    const [form, setForm] = useState({ attendeeName: '', email: '', phone: '', organization: '' });

    // Gallery Dropdown State
    const [galleryOpen, setGalleryOpen] = useState(false);
    const galleryRef = useRef(null);

    useEffect(() => {
        // Fetch current event
        api.get(`/events/${id}`).then(r => setEvent(r.data)).catch(() => router.push('/')).finally(() => setLoading(false));
        // Fetch all events for the gallery dropdown
        api.get('/events').then(r => setAllEvents(r.data)).catch(console.error);
    }, [id]);

    // Close gallery dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => { if (galleryRef?.current && !galleryRef.current.contains(e.target)) setGalleryOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const eventsWithGallery = allEvents.filter(e => e.gallery && e.gallery.length > 0);

    const handleRegister = async (e) => {
        e.preventDefault();
        setRegistering(true);
        try {
            if (event.isPaid) {
                const { data } = await api.post('/payment/create-checkout-session', {
                    ...form,
                    name: form.attendeeName, // Map to what the backend expects
                    eventId: id
                });
                window.location.href = data.url;
            } else {
                const { data } = await api.post('/registrations', { ...form, eventId: id });
                setSuccess(data);
                toast.success('Registered! Check your email for the QR ticket.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed.');
        } finally {
            setRegistering(false);
        }
    };

    if (loading) return <div className="loading-center" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}><div className="spinner" /></div>;
    if (!event) return null;

    const spotsLeft = event.capacity - (event.registrationCount || 0);
    const isFull = spotsLeft <= 0;

    return (
        <div style={{ minHeight: '100vh', background: 'transparent', position: 'relative', overflowX: 'hidden' }}>

            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="navbar"
                style={{ position: 'relative', zIndex: 100, background: 'rgba(9, 9, 15, 0.6)' }}
            >
                <div className="navbar-inner">
                    <Link href="/" style={{ textDecoration: 'none' }} className="flex items-center gap-2 cursor-pointer group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-neon to-accent-dark flex items-center justify-center text-white shadow-[0_0_15px_rgba(236,72,153,0.5)] group-hover:shadow-[0_0_25px_rgba(236,72,153,0.8)] transition-all">
                            <Zap size={20} className="fill-white" />
                        </div>
                        <span className="font-display-xl text-[24px] font-bold text-white tracking-wide">
                            Event<span className="text-pink-neon neon-text-glow">Flow</span>
                        </span>
                    </Link>

                    <div className="navbar-links" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ position: 'relative' }} ref={galleryRef}>
                            <button
                                onClick={() => setGalleryOpen(!galleryOpen)}
                                className="navbar-link"
                                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none', padding: '8px 12px' }}
                            >
                                <ImageIcon size={16} />
                                Gallery
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: galleryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>

                            <AnimatePresence>
                                {galleryOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            marginTop: 8,
                                            width: 250,
                                            background: '#13131f',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 12,
                                            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                                            overflow: 'hidden',
                                            zIndex: 50
                                        }}
                                    >
                                        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Browse Gallery
                                        </div>
                                        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                            {eventsWithGallery.length === 0 ? (
                                                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                                    No galleries available yet.
                                                </div>
                                            ) : (
                                                eventsWithGallery.map(e => (
                                                    <Link
                                                        key={e._id}
                                                        href={`/gallery/${e._id}`}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 12,
                                                            padding: '12px 16px',
                                                            textDecoration: 'none',
                                                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                                                            color: 'var(--text-primary)',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        className="dropdown-item"
                                                        onClick={() => setGalleryOpen(false)}
                                                    >
                                                        <div style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                                                            <img src={e.image || e.gallery[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </div>
                                                        <div style={{ overflow: 'hidden' }}>
                                                            <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{e.title}</div>
                                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.gallery.length} photos</div>
                                                        </div>
                                                    </Link>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <Link href="/" className="btn btn-secondary btn-sm"><ArrowLeft size={14} /> Back</Link>
                    </div>
                </div>
            </motion.nav>

            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '60px 24px', position: 'relative', zIndex: 10 }}>
                <ScrollZoom>
                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid-2" style={{ gap: 48, alignItems: 'start' }}>
                    {/* Event Info Column */}
                    <motion.div variants={staggerContainer}>
                        <motion.div variants={slideUp} className="animate-float" style={{ width: '100%', height: 280, borderRadius: 24, marginBottom: 32, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(124,58,237,0.2)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
                            <Calendar size={64} color="rgba(255,255,255,0.1)" style={{ position: 'absolute' }} />
                            {event.image && (
                                <img
                                    src={event.image}
                                    alt={event.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', position: 'relative', zIndex: 1 }}
                                    className="hover-zoom"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            )}
                        </motion.div>

                        <motion.div variants={slideUp} transition={{ type: 'spring', bounce: 0.5 }} style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                            <span className="badge badge-purple" style={{ padding: '6px 14px', fontSize: 13 }}>{event.category || 'General'}</span>
                            {event.isPaid ? (
                                <span className="badge" style={{ padding: '6px 14px', fontSize: 13, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontWeight: 700 }}>₹{event.price}</span>
                            ) : (
                                <span className="badge" style={{ padding: '6px 14px', fontSize: 13, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', fontWeight: 700 }}>Free Event</span>
                            )}
                            {event.orgId?.name && <span className="badge badge-blue" style={{ padding: '6px 14px', fontSize: 13 }}>{event.orgId.name}</span>}
                            {isFull && <span className="badge badge-red" style={{ padding: '6px 14px', fontSize: 13 }}>Fully Booked</span>}
                        </motion.div>

                        <motion.h1 variants={slideUp} className="gradient-text" style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 800, marginBottom: 24, lineHeight: 1.15 }}>{event.title}</motion.h1>

                        <motion.div variants={slideUp} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32, background: 'rgba(255,255,255,0.02)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-primary)', fontSize: 15 }}>
                                <div style={{ background: 'rgba(124,58,237,0.15)', padding: 10, borderRadius: 10 }}><Calendar size={18} color="var(--accent-light)" /></div>
                                <span>{format(new Date(event.date), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}</span>
                            </div>
                            {event.venue && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-primary)', fontSize: 15 }}>
                                    <div style={{ background: 'rgba(124,58,237,0.15)', padding: 10, borderRadius: 10 }}><MapPin size={18} color="var(--accent-light)" /></div>
                                    <span>{event.venue}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-primary)', fontSize: 15 }}>
                                <div style={{ background: 'rgba(124,58,237,0.15)', padding: 10, borderRadius: 10 }}><Users size={18} color="var(--accent-light)" /></div>
                                <span>{event.registrationCount || 0} registered <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>|</span> <strong style={{ color: spotsLeft > 10 ? 'var(--green-light)' : 'var(--amber)' }}>{spotsLeft} spots left</strong></span>
                            </div>
                        </motion.div>

                        {event.description && (
                            <motion.div variants={slideUp}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Info size={18} color="var(--accent)" /> About this event</h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontSize: 15 }}>{event.description}</p>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Registration Form Column */}
                    <motion.div variants={slideUp} style={{ position: 'sticky', top: 100 }}>
                        {success ? (
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card" style={{ textAlign: 'center', padding: 0, overflow: 'hidden', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                                <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', padding: '32px 24px', borderBottom: '2px dashed rgba(255,255,255,0.15)' }}>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                                    <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#fff' }}>Registration Confirmed!</h2>
                                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>A copy of this ticket has been sent to <strong>{success.email || form.email}</strong></p>
                                </div>

                                <div style={{ padding: '32px 24px', background: 'var(--bg-card)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div>
                                            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Attendee</p>
                                            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{form.attendeeName}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Ticket ID</p>
                                            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-light)', fontFamily: 'monospace', letterSpacing: 2 }}>{success.ticketId}</p>
                                        </div>
                                    </div>

                                    {success.qrCode && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                                            <div style={{ padding: 16, background: '#fff', borderRadius: 16, boxShadow: '0 10px 30px rgba(124,58,237,0.15)', marginBottom: 16 }}>
                                                <img src={success.qrCode} alt="Entry QR Code" width={200} height={200} style={{ display: 'block' }} />
                                            </div>
                                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Show this QR code at the entrance for instant check-in</p>
                                        </div>
                                    )}

                                    {success.qrCode && (
                                        <a
                                            href={success.qrCode}
                                            download={`ticket-${event.title.replace(/\s+/g, '-').toLowerCase()}-${success.ticketId}.png`}
                                            className="btn btn-primary btn-lg"
                                            style={{ width: '100%', justifyContent: 'center', gap: 8 }}
                                        >
                                            <Download size={18} /> Download QR Ticket
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="card" style={{ padding: 36, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 28 }}>Secure Your Spot</h2>
                                {isFull ? (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--red)', background: 'rgba(239,68,68,0.05)', borderRadius: 16 }}>
                                        <Users size={40} style={{ opacity: 0.4, marginBottom: 16 }} />
                                        <p style={{ fontWeight: 600, fontSize: 16 }}>This event is fully booked.</p>
                                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Please check back later for cancellations.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        <div className="form-group">
                                            <label className="form-label">Full Name *</label>
                                            <input id="reg-name" className="form-input" placeholder="Jane Doe" value={form.attendeeName} onChange={e => setForm(p => ({ ...p, attendeeName: e.target.value }))} required style={{ padding: '14px 16px', fontSize: 15 }} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email Address *</label>
                                            <input id="reg-email" type="email" className="form-input" placeholder="Your actual Resend email (for testing)" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required style={{ padding: '14px 16px', fontSize: 15 }} />
                                            <p style={{ fontSize: 11, color: 'var(--amber)', marginTop: 6, lineHeight: 1.4 }}>
                                                <strong>Notice:</strong> While testing on Resend's free tier, you MUST enter the exact email address you signed up to Resend with, otherwise the email will not be sent!
                                            </p>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Phone Number <span style={{ opacity: 0.5 }}>(optional)</span></label>
                                            <input className="form-input" placeholder="+1 555 0123" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={{ padding: '14px 16px', fontSize: 15 }} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Organization <span style={{ opacity: 0.5 }}>(optional)</span></label>
                                            <input className="form-input" placeholder="Company or University" value={form.organization} onChange={e => setForm(p => ({ ...p, organization: e.target.value }))} style={{ padding: '14px 16px', fontSize: 15 }} />
                                        </div>
                                        <motion.button
                                            id="reg-submit"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="submit"
                                            className="btn btn-primary btn-lg"
                                            style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
                                            disabled={registering}
                                        >
                                            {registering ? 'Processing...' : event.isPaid ? `Pay ₹${event.price} & Register →` : 'Register Now →'}
                                        </motion.button>
                                        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
                                            Your highly secure QR entry ticket will be generated and emailed instantly automatically.
                                        </p>
                                    </form>
                                )}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
                </ScrollZoom>
            </div>
        </div>
    );
}
