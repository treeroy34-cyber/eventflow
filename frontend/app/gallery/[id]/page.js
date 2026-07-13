'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { Zap, ArrowLeft, Image as ImageIcon, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function EventGalleryPage() {
    const { id } = useParams();
    const router = useRouter();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lightbox, setLightbox] = useState(null); // index of the open image

    useEffect(() => {
        api.get(`/events/${id}`)
            .then(r => setEvent(r.data))
            .catch(() => router.push('/'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
            <div className="spinner" />
        </div>
    );
    if (!event) return null;

    const gallery = event.gallery || [];

    return (
        <div style={{ minHeight: '100vh', background: 'transparent', position: 'relative' }}>
            {/* Navbar */}
            <nav className="navbar" style={{ position: 'relative', zIndex: 10, background: 'rgba(9, 9, 15, 0.6)' }}>
                <div className="navbar-inner">
                    <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-gradient)', padding: '6px', borderRadius: '8px' }}>
                            <Zap size={18} color="#fff" />
                        </div>
                        <span style={{ fontSize: '22px', fontWeight: 900, backgroundImage: 'linear-gradient(90deg, #ffffff, #d8b4fe, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            EventFlow
                        </span>
                    </Link>
                    <Link href="/" className="btn btn-secondary btn-sm">
                        <ArrowLeft size={14} /> Back to Events
                    </Link>
                </div>
            </nav>

            {/* Page Header */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px 40px', position: 'relative', zIndex: 10 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ background: 'rgba(124,58,237,0.15)', padding: 10, borderRadius: 12 }}>
                            <ImageIcon size={22} color="var(--accent-light)" />
                        </div>
                        <div>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Event Gallery</p>
                            <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, lineHeight: 1.2 }}>{event.title}</h1>
                        </div>
                    </div>
                    {event.date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginTop: 8, paddingLeft: 4 }}>
                            <Calendar size={14} />
                            <span>{format(new Date(event.date), 'MMMM d, yyyy')}</span>
                        </div>
                    )}
                </motion.div>

                {/* Gallery Grid */}
                {gallery.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state" style={{ marginTop: 60 }}>
                        <ImageIcon size={48} style={{ opacity: 0.3 }} />
                        <h3 style={{ fontSize: 20, margin: '12px 0 6px' }}>No Photos Yet</h3>
                        <p>The organiser hasn't uploaded any gallery photos for this event yet.</p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="show"
                        variants={{
                            hidden: { opacity: 0 },
                            show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                        }}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gap: 16,
                            marginTop: 40
                        }}
                    >
                        {gallery.map((url, idx) => (
                            <motion.div
                                key={idx}
                                variants={{
                                    hidden: { opacity: 0, scale: 0.8, y: 20 },
                                    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 15 } }
                                }}
                                whileHover={{ scale: 1.05, y: -6, boxShadow: '0 15px 35px rgba(0,0,0,0.5)' }}
                                transition={{ type: 'spring', stiffness: 300 }}
                                onClick={() => setLightbox(idx)}
                                style={{ aspectRatio: '4 / 3', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', cursor: 'zoom-in', background: '#1a1a2e', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
                            >
                                <img
                                    src={url}
                                    alt={`Gallery ${idx + 1}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                                    className="hover-zoom"
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {lightbox !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightbox(null)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
                    >
                        <button
                            onClick={() => setLightbox(null)}
                            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1001 }}
                        >
                            <X size={20} />
                        </button>
                        <motion.img
                            key={lightbox}
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                            src={gallery[lightbox]}
                            alt={`Gallery ${lightbox + 1}`}
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 16, boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
                        />
                        <div style={{ position: 'absolute', bottom: 24, display: 'flex', gap: 12 }}>
                            <button onClick={(e) => { e.stopPropagation(); setLightbox(l => (l > 0 ? l - 1 : gallery.length - 1)); }}
                                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 18 }}>‹</button>
                            <span style={{ color: 'rgba(255,255,255,0.6)', alignSelf: 'center', fontSize: 14 }}>{lightbox + 1} / {gallery.length}</span>
                            <button onClick={(e) => { e.stopPropagation(); setLightbox(l => (l < gallery.length - 1 ? l + 1 : 0)); }}
                                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 18 }}>›</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
