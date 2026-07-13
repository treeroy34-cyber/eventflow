'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import AdminLayout from '../../../components/layout/AdminLayout';
import { QrCode, Calendar, Users, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function SelectCheckInEventPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/events/mine').then(r => setEvents(r.data)).catch(console.error).finally(() => setLoading(false));
    }, []);

    return (
        <AdminLayout>
            <div className="page-header">
                <h1>Select Event for Check-In</h1>
                <p>Choose an active event to start managing attendance and scanning QR codes</p>
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : events.length === 0 ? (
                <div className="card empty-state" style={{ padding: '60px 24px' }}>
                    <QrCode size={48} />
                    <h3 style={{ fontSize: 20, margin: '12px 0 6px' }}>No Events Yet</h3>
                    <p>Create an event first to manage check-ins</p>
                    <Link href="/admin/events" className="btn btn-primary" style={{ marginTop: 20 }}>Go to Events</Link>
                </div>
            ) : (
                <div className="grid-3" style={{ gap: 24 }}>
                    {events.map(evt => (
                        <Link href={`/admin/checkin/${evt._id}`} key={evt._id} style={{ textDecoration: 'none' }}>
                            <div className="card hover-zoom" style={{ display: 'flex', flexDirection: 'column', height: '100%', transition: 'all 0.2s', cursor: 'pointer', border: '1px solid rgba(124,58,237,0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <div style={{ background: 'rgba(124,58,237,0.1)', padding: 10, borderRadius: 10 }}>
                                        <QrCode size={20} color="var(--accent)" />
                                    </div>
                                    <span className={`badge ${evt.isPublished ? 'badge-green' : 'badge-amber'}`}>{evt.isPublished ? 'Published' : 'Draft'}</span>
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>{evt.title}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, flex: 1 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={13} /> {format(new Date(evt.date), 'MMM d, yyyy h:mm a')}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={13} /> {evt.registrationCount || 0} / {evt.capacity} Registered</span>
                                </div>
                                <div className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', pointerEvents: 'none' }}>
                                    Start Check-In <ArrowRight size={14} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
