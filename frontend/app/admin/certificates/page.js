'use client';
import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import AdminLayout from '../../../components/layout/AdminLayout';
import toast from 'react-hot-toast';
import { Award, Mail, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function CertificatesPage() {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [attendance, setAttendance] = useState([]);
    const [loadingCerts, setLoadingCerts] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        api.get('/events/mine').then(r => { setEvents(r.data); if (r.data.length > 0) setSelectedEventId(r.data[0]._id); });
    }, []);

    useEffect(() => {
        if (!selectedEventId) return;
        api.get(`/checkin/${selectedEventId}`).then(r => setAttendance(r.data)).catch(console.error);
    }, [selectedEventId]);

    const sendAll = async () => {
        if (!selectedEventId) return;
        setSending(true);
        try {
            const { data } = await api.post(`/certificates/${selectedEventId}`);
            toast.success(data.message);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send certificates.');
        } finally {
            setSending(false);
        }
    };

    const downloadOne = (registrationId) => {
        window.open(`http://localhost:5000/api/certificates/${selectedEventId}/download/${registrationId}`, '_blank');
    };

    return (
        <AdminLayout>
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div><h1>Certificates</h1><p>Generate &amp; send PDF certificates to attendees</p></div>
                {attendance.length > 0 && (
                    <button id="send-all-certs-btn" className="btn btn-primary" onClick={sendAll} disabled={sending}>
                        <Mail size={15} /> {sending ? 'Sending...' : `Send All (${attendance.length})`}
                    </button>
                )}
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
                <div className="form-group">
                    <label className="form-label">Select Event</label>
                    <select id="cert-event-select" className="form-input" style={{ maxWidth: 400 }} value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                        {events.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                    </select>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700 }}>Checked-In Attendees ({attendance.length})</h2>
                </div>
                {attendance.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px 0' }}>
                        <Award size={36} />
                        <p style={{ marginTop: 12 }}>No checked-in attendees yet for this event.</p>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Certificates can only be issued to attended attendees.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Check-In Time</th><th>Certificate</th></tr></thead>
                            <tbody>
                                {attendance.map((a, i) => (
                                    <tr key={a._id}>
                                        <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                                        <td>{a.registrationId?.attendeeName}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{a.registrationId?.email}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{format(new Date(a.checkedInAt), 'MMM d, h:mm a')}</td>
                                        <td>
                                            <button className="btn btn-secondary btn-sm" onClick={() => downloadOne(a.registrationId._id)}>
                                                <Download size={13} /> PDF
                                            </button>
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
