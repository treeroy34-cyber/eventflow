'use client';
import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import AdminLayout from '../../../components/layout/AdminLayout';
import toast from 'react-hot-toast';
import { ShieldCheck, ShieldAlert, Check, X, Calendar, MapPin, DollarSign } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { format } from 'date-fns';

export default function ModerationPage() {
    const { isSuperAdmin, loading: authLoading } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadPending = async () => {
        if (!isSuperAdmin) return;
        setLoading(true);
        try {
            const res = await api.get('/events/moderation/pending');
            setEvents(res.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error fetching pending events.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && isSuperAdmin) {
            loadPending();
        }
    }, [authLoading, isSuperAdmin]);

    const handleUpdateStatus = async (eventId, newStatus) => {
        try {
            await api.patch(`/events/${eventId}/status`, { status: newStatus });
            toast.success(`Event ${newStatus === 'APPROVED' ? 'Approved' : 'Rejected'} successfully!`);
            // Remove from current list
            setEvents(prev => prev.filter(e => e._id !== eventId));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error updating event status.');
        }
    };

    if (authLoading) {
        return (
            <AdminLayout>
                <div className="loading-center"><div className="spinner" /></div>
            </AdminLayout>
        );
    }

    if (!isSuperAdmin) {
        return (
            <AdminLayout>
                <div className="card empty-state" style={{ padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <ShieldAlert size={48} color="var(--red)" style={{ marginBottom: 16 }} />
                    <h3 style={{ fontSize: 20, margin: '12px 0 6px', color: 'var(--red)', fontWeight: 700 }}>Access Denied</h3>
                    <p style={{ color: 'var(--text-muted)' }}>You must be a platform Super Admin to access this moderation console.</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1>Event Moderation</h1>
                    <p>Review and verify organization events before they go public</p>
                </div>
                <div className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}>
                    <ShieldCheck size={16} /> Super Admin Console
                </div>
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : events.length === 0 ? (
                <div className="card empty-state" style={{ padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Calendar size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>Clean Queue</h3>
                    <p style={{ color: 'var(--text-muted)' }}>There are currently no events pending moderation approval.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
                    {events.map((event) => (
                        <div key={event._id} className="card" style={{ display: 'flex', flexDirection: 'column', mdDirection: 'row', gap: 24, padding: 32, backdropFilter: 'blur(20px)' }}>
                            <div className="grid-2" style={{ gap: 24, width: '100%' }}>
                                {/* Event Info Details */}
                                <div style={{ spaceY: 16 }}>
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                        <span className="badge badge-blue">{event.category}</span>
                                        <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                            By {event.orgId?.name || 'Unknown Org'}
                                        </span>
                                    </div>

                                    <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>{event.title}</h3>
                                    
                                    <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {event.description || 'No description provided.'}
                                    </p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Calendar size={14} className="text-primary" />
                                            <span>{format(new Date(event.date), 'EEEE, MMMM d, yyyy - h:mm a')}</span>
                                        </div>
                                        {event.venue && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <MapPin size={14} className="text-primary" />
                                                <span>{event.venue}</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <DollarSign size={14} className="text-primary" />
                                            <span>{event.isPaid ? `₹${event.price}` : 'Free Admission'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Banner and Action Buttons */}
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
                                    <div style={{ width: '100%', height: 160, borderRadius: 16, overflow: 'hidden', background: '#0e0e12', border: '1px solid var(--border)' }}>
                                        {event.image ? (
                                            <img src={event.image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 12 }}>
                                                No Event Banner
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                                        <button 
                                            onClick={() => handleUpdateStatus(event._id, 'REJECTED')}
                                            className="btn btn-secondary" 
                                            style={{ flex: 1, justifyContent: 'center', gap: 8, borderColor: 'var(--red)', color: 'var(--red)' }}
                                        >
                                            <X size={16} /> Reject Event
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateStatus(event._id, 'APPROVED')}
                                            className="btn btn-primary" 
                                            style={{ flex: 1, justifyContent: 'center', gap: 8 }}
                                        >
                                            <Check size={16} /> Approve & Publish
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
