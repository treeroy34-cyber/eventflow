'use client';
import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import AdminLayout from '../../../components/layout/AdminLayout';
import toast from 'react-hot-toast';
import { Plus, UserCog, X } from 'lucide-react';
import { format } from 'date-fns';

export default function StaffPage() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const load = () => {
        setLoading(true);
        api.get('/auth/staff').then(r => setStaff(r.data)).catch(() => setStaff([])).finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    return (
        <AdminLayout>
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div><h1>Staff Management</h1><p>Manage staff accounts for your organization</p></div>
                <button id="add-staff-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> Add Staff Member
                </button>
            </div>

            <div className="card">
                {loading ? (
                    <div className="loading-center"><div className="spinner" /></div>
                ) : staff.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px 0' }}>
                        <UserCog size={36} />
                        <p style={{ marginTop: 12 }}>No staff members yet.</p>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Staff can perform check-ins but cannot modify events.</p>
                        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowModal(true)}><Plus size={15} /> Add First Staff Member</button>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
                            <tbody>
                                {staff.map(s => (
                                    <tr key={s.id || s._id}>
                                        <td>{s.name}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{s.email}</td>
                                        <td><span className="badge badge-purple">{s.role}</span></td>
                                        <td>
                                            {s.isActive !== false
                                                ? <span className="badge badge-green">Active</span>
                                                : <span className="badge badge-red">Inactive</span>
                                            }
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>{s.createdAt ? format(new Date(s.createdAt), 'MMM d, yyyy') : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && <StaffModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); load(); }} />}
        </AdminLayout>
    );
}

function StaffModal({ onClose, onSuccess }) {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            await api.post('/auth/staff', form);
            toast.success('Staff member created!');
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error creating staff.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h2>Add Staff Member</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <input id="staff-name" className="form-input" placeholder="John Smith" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input id="staff-email" type="email" className="form-input" placeholder="staff@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Temporary Password *</label>
                        <input id="staff-password" type="password" className="form-input" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} minLength={6} required />
                    </div>
                    <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                        ℹ️ Staff can perform check-ins but cannot create/edit events or manage other staff.
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button id="staff-save-btn" type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Staff Account'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
