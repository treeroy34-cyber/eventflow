'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import AdminLayout from '../../../components/layout/AdminLayout';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, QrCode, BarChart2, Users, Calendar, X, Upload } from 'lucide-react';
import { format } from 'date-fns';

export default function EventsManagementPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editEvent, setEditEvent] = useState(null);

    const load = () => {
        setLoading(true);
        api.get('/events/mine').then(r => setEvents(r.data)).catch(console.error).finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const handleDelete = async (id) => {
        if (!confirm('Delete this event? This cannot be undone.')) return;
        try {
            await api.delete(`/events/${id}`);
            toast.success('Event deleted.');
            load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error deleting event.');
        }
    };

    return (
        <AdminLayout>
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div><h1>Events</h1><p>Create and manage your organization's events</p></div>
                <button id="create-event-btn" className="btn btn-primary" onClick={() => { setEditEvent(null); setShowModal(true); }}>
                    <Plus size={16} /> Create Event
                </button>
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : events.length === 0 ? (
                <div className="card empty-state" style={{ padding: '60px 24px' }}>
                    <Calendar size={48} />
                    <h3 style={{ fontSize: 20, margin: '12px 0 6px' }}>No Events Yet</h3>
                    <p>Create your first event to get started</p>
                    <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowModal(true)}><Plus size={16} /> Create Event</button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {events.map(evt => (
                        <div key={evt._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '18px 24px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{evt.title}</h3>
                                    <span className={`badge ${evt.isPublished ? 'badge-green' : 'badge-amber'}`}>{evt.isPublished ? 'Published' : 'Draft'}</span>
                                    <span className={`badge ${evt.status === 'APPROVED' ? 'badge-green' : evt.status === 'REJECTED' ? 'badge-red' : 'badge-amber'}`}>
                                        {evt.status === 'APPROVED' ? 'Verified' : evt.status === 'REJECTED' ? 'Rejected' : 'Pending Verification'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                    <span><Calendar size={12} /> {format(new Date(evt.date), 'MMM d, yyyy h:mm a')}</span>
                                    <span><Users size={12} /> {evt.registrationCount} / {evt.capacity}</span>
                                    {evt.venue && <span>📍 {evt.venue}</span>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                <Link href={`/admin/registrations?eventId=${evt._id}`} className="btn btn-secondary btn-sm" title="Registrations"><Users size={14} /></Link>
                                <Link href={`/admin/checkin/${evt._id}`} className="btn btn-secondary btn-sm" title="Check-In"><QrCode size={14} /></Link>
                                <Link href={`/admin/analytics?eventId=${evt._id}`} className="btn btn-secondary btn-sm" title="Analytics"><BarChart2 size={14} /></Link>
                                <button className="btn btn-secondary btn-sm" onClick={() => { setEditEvent(evt); setShowModal(true); }} title="Edit"><Edit2 size={14} /></button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(evt._id)} title="Delete"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && <EventModal event={editEvent} onClose={() => { setShowModal(false); setEditEvent(null); }} onSuccess={() => { setShowModal(false); load(); }} />}
        </AdminLayout>
    );
}

function EventModal({ event, onClose, onSuccess }) {
    const getLocalISO = (addHours = 0) => {
        const d = new Date();
        d.setHours(d.getHours() + addHours);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    const [form, setForm] = useState({
        title: event?.title || '', description: event?.description || '',
        date: event?.date ? new Date(new Date(event.date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : getLocalISO(1),
        endDate: event?.endDate ? new Date(new Date(event.endDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : getLocalISO(2),
        venue: event?.venue || '', capacity: event?.capacity || 100,
        image: event?.image || '', gallery: event?.gallery || [], category: event?.category || 'General',
        isPublished: event?.isPublished !== false,
        isPaid: event?.isPaid || false, price: event?.price || ''
    });
    const [saving, setSaving] = useState(false);
    const categories = ['General', 'Conference', 'Workshop', 'Seminar', 'Webinar', 'Social', 'Sports', 'Cultural'];

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const submitData = { ...form, price: form.isPaid ? Number(form.price) : 0 };
            if (event) { await api.put(`/events/${event._id}`, submitData); toast.success('Event updated!'); }
            else { await api.post('/events', submitData); toast.success('Event created!'); }
            onSuccess();
        } catch (err) { toast.error(err.response?.data?.message || 'Error saving event.'); }
        finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <h2>{event ? 'Edit Event' : 'Create New Event'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                        <label className="form-label">Event Title *</label>
                        <input id="event-title" className="form-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Start Date & Time *</label>
                            <input id="event-date" type="datetime-local" className="form-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">End Date & Time</label>
                            <input type="datetime-local" className="form-input" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Venue</label>
                            <input id="event-venue" className="form-input" placeholder="Hall A, Building 2" value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Capacity *</label>
                            <input id="event-capacity" type="number" className="form-input" min={1} value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} required />
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Ticket Type *</label>
                            <select className="form-input" value={form.isPaid ? 'paid' : 'free'} onChange={e => setForm(p => ({ ...p, isPaid: e.target.value === 'paid' }))}>
                                <option value="free">Free Event</option>
                                <option value="paid">Paid Event</option>
                            </select>
                        </div>
                        {form.isPaid && (
                            <div className="form-group">
                                <label className="form-label">Ticket Price (₹) *</label>
                                <input type="number" className="form-input" min={1} placeholder="199" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required={form.isPaid} />
                            </div>
                        )}
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select className="form-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-input" value={form.isPublished ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, isPublished: e.target.value === 'true' }))}>
                                <option value="true">Published</option>
                                <option value="false">Draft</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Banner Image URL or Upload</label>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <input className="form-input" placeholder="https://..." value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} style={{ flex: 1 }} />
                            <label className="btn btn-secondary" style={{ cursor: 'pointer', flexShrink: 0 }}>
                                <Upload size={16} /> Upload
                                <input type="file" accept="image/*" hidden onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    const formData = new FormData();
                                    formData.append('image', file);
                                    try {
                                        toast.loading('Uploading...', { id: 'upload' });
                                        const res = await api.post('/upload', formData);
                                        setForm(p => ({ ...p, image: res.data.url }));
                                        toast.success('Image uploaded!', { id: 'upload' });
                                    } catch (err) {
                                        console.error('Upload error:', err);
                                        const msg = err.response?.data?.message || err.message || 'Upload failed. Try entering a URL.';
                                        toast.error(msg, { id: 'upload' });
                                    }
                                }} />
                            </label>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Event Gallery Images</label>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: form.gallery.length > 0 ? 16 : 0 }}>
                                {form.gallery.map((url, i) => (
                                    <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <img src={url} alt={`Gallery ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button
                                            type="button"
                                            onClick={() => setForm(p => ({ ...p, gallery: p.gallery.filter((_, idx) => idx !== i) }))}
                                            style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                                <Plus size={14} style={{ marginRight: 6 }} /> Add Images
                                <input type="file" accept="image/*" multiple hidden onChange={async (e) => {
                                    const files = Array.from(e.target.files);
                                    if (files.length === 0) return;
                                    const formData = new FormData();
                                    files.forEach(f => formData.append('images', f));
                                    try {
                                        toast.loading('Uploading gallery...', { id: 'upload-gal' });
                                        const res = await api.post('/upload/multiple', formData);
                                        setForm(p => ({ ...p, gallery: [...p.gallery, ...res.data.urls] }));
                                        toast.success('Gallery images uploaded!', { id: 'upload-gal' });
                                    } catch (err) {
                                        console.error('Gallery upload error:', err);
                                        const msg = err.response?.data?.message || err.message || 'Gallery upload failed.';
                                        toast.error(msg, { id: 'upload-gal' });
                                    }
                                }} />
                            </label>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-input" rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button id="event-save-btn" type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
