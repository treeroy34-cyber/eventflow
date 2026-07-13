'use client';
import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Building, Users, CheckCircle, Search } from 'lucide-react';

export default function OrganizationsAnalyticsPage() {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [loading, setLoading] = useState(false);
    const [organizations, setOrganizations] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get('/events/mine').then(r => {
            setEvents(r.data);
            if (r.data.length > 0) setSelectedEventId(r.data[0]._id);
        }).catch(console.error);
    }, []);

    useEffect(() => {
        if (!selectedEventId) return;
        setLoading(true);
        api.get(`/reports/${selectedEventId}/organizations`)
            .then(r => setOrganizations(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedEventId]);

    const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(search.toLowerCase())
    );

    const totalRegs = organizations.reduce((sum, o) => sum + o.registrations, 0);
    const totalChecks = organizations.reduce((sum, o) => sum + o.checkins, 0);

    return (
        <AdminLayout>
            <div className="page-header">
                <h1>Organizations Analytics</h1>
                <p>View registrations and check-ins grouped by organization.</p>
            </div>

            <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', padding: '16px 20px' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Select Event</label>
                    <select className="form-input" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                        {events.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                    </select>
                </div>
                <div style={{ flex: 2, minWidth: 200 }}>
                    <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Filter Organizations</label>
                    <div className="search-bar">
                        <Search size={15} />
                        <input
                            className="form-input"
                            placeholder="Search by name..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: 36 }}
                        />
                    </div>
                </div>
            </div>

            {organizations.length > 0 && !loading && (
                <div className="grid-3" style={{ marginBottom: 24 }}>
                    <div className="stat-card">
                        <div className="stat-label">Unique Organizations</div>
                        <div className="stat-value" style={{ fontSize: 28 }}>{organizations.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Total Selected Registrations</div>
                        <div className="stat-value" style={{ fontSize: 28, color: '#3b82f6' }}>{totalRegs}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Total Selected Check-ins</div>
                        <div className="stat-value" style={{ fontSize: 28, color: '#10b981' }}>{totalChecks}</div>
                    </div>
                </div>
            )}

            <div className="card">
                {loading ? (
                    <div className="loading-center" style={{ minHeight: 200 }}><div className="spinner" /></div>
                ) : filteredOrgs.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px 0' }}>
                        <Building size={32} />
                        <p style={{ marginTop: 8 }}>No organizations found.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Organization Name</th>
                                    <th>Registrations</th>
                                    <th>Checked In</th>
                                    <th>Attendance Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrgs.map((org, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 500 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {org.name === 'Unspecified / Individual' ? <Users size={16} color="var(--text-muted)" /> : <Building size={16} color="var(--accent-light)" />}
                                                {org.name}
                                            </div>
                                        </td>
                                        <td>{org.registrations}</td>
                                        <td>{org.checkins}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span className={`badge ${org.rate >= 70 ? 'badge-green' : org.rate >= 40 ? 'badge-amber' : 'badge-red'}`}>
                                                    {org.rate}%
                                                </span>
                                                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${org.rate}%`,
                                                        background: org.rate >= 70 ? 'var(--green)' : org.rate >= 40 ? 'var(--amber)' : 'var(--red)'
                                                    }} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
