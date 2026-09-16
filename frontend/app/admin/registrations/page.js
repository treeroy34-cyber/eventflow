'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api, { getBaseURL } from '../../../lib/api';
import AdminLayout from '../../../components/layout/AdminLayout';
import toast from 'react-hot-toast';
import { Search, Download, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

function RegistrationsContent() {
    const searchParams = useSearchParams();
    const eventIdParam = searchParams.get('eventId');
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(eventIdParam || '');
    const [registrations, setRegistrations] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get('/events/mine').then(r => { setEvents(r.data); if (!selectedEventId && r.data.length > 0 && !eventIdParam) setSelectedEventId(''); });
    }, []);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedEventId) params.append('eventId', selectedEventId);
        if (search) params.append('search', search);
        api.get(`/registrations?${params.toString()}`).then(r => { setRegistrations(r.data.registrations); setTotal(r.data.total); }).catch(console.error).finally(() => setLoading(false));
    }, [selectedEventId, search]);

    const handleExport = () => {
        if (!selectedEventId) { alert('Select an event to export CSV.'); return; }
        window.open(`${getBaseURL()}/reports/${selectedEventId}/csv`, '_blank');
    };

    return (
        <AdminLayout>
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div><h1>Registrations</h1><p>View and manage attendees across all events</p></div>
                <button className="btn btn-secondary" onClick={handleExport}><Download size={14} /> Export CSV</button>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', padding: '16px 20px' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <select id="event-filter" className="form-input" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                        <option value="">All Events</option>
                        {events.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                    </select>
                </div>
                <div className="search-bar" style={{ flex: 2, minWidth: 200 }}>
                    <Search size={15} />
                    <input id="reg-search" className="form-input" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{total} total</span>
            </div>

            <div className="card">
                {loading ? (
                    <div className="loading-center"><div className="spinner" /></div>
                ) : registrations.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px 0' }}><p>No registrations found.</p></div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th><th>Name</th><th>Email</th><th>Phone</th>
                                    <th>Organization</th><th>Event</th><th>Check-In Status</th><th>Registered</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registrations.map((r, i) => (
                                    <tr key={r._id}>
                                        <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                                        <td>{r.attendeeName}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{r.email}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{r.phone || '—'}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{r.organization || '—'}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{r.eventId?.title || '—'}</td>
                                        <td>
                                            {r.checkInStatus ? (
                                                <span className="badge badge-green"><CheckCircle size={11} /> Checked In</span>
                                            ) : (
                                                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}><XCircle size={11} /> Not Checked In</span>
                                            )}
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>{format(new Date(r.createdAt), 'MMM d, h:mm a')}</td>
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

export default function RegistrationsPage() {
    return <Suspense fallback={<AdminLayout><div className="loading-center"><div className="spinner" /></div></AdminLayout>}><RegistrationsContent /></Suspense>;
}
