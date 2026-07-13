'use client';
import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import AdminLayout from '../../../components/layout/AdminLayout';
import toast from 'react-hot-toast';
import { Download, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function ReportsPage() {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        api.get('/events/mine').then(r => { setEvents(r.data); if (r.data.length > 0) setSelectedEventId(r.data[0]._id); });
    }, []);

    useEffect(() => {
        if (!selectedEventId) return;
        setLoading(true);
        api.get(`/analytics/${selectedEventId}`).then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
    }, [selectedEventId]);

    const download = async (type) => {
        if (!selectedEventId) { toast.error('Please select an event.'); return; }

        try {
            const response = await api.get(`/reports/${selectedEventId}/${type}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;

            // Extract filename from the Content-Disposition header if possible, or use a default
            const contentDisposition = response.headers['content-disposition'];
            let filename = `report_${type}.csv`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match && match.length === 2) filename = match[1];
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success('Download complete!');
        } catch (err) {
            toast.error('Failed to download report.');
            console.error(err);
        }
    };

    const selectedEvent = events.find(e => e._id === selectedEventId);

    return (
        <AdminLayout>
            <div className="page-header"><h1>Reports</h1><p>Export event data as CSV files</p></div>

            <div className="card" style={{ marginBottom: 20 }}>
                <div className="form-group">
                    <label className="form-label">Select Event</label>
                    <select id="report-event-select" className="form-input" style={{ maxWidth: 400 }} value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                        {events.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                    </select>
                </div>
            </div>

            {stats && selectedEvent && (
                <div className="grid-3" style={{ marginBottom: 24 }}>
                    {[
                        { label: 'Registrations', value: stats.totalRegistrations },
                        { label: 'Checked In', value: stats.totalAttendance },
                        { label: 'Attendance Rate', value: `${stats.attendanceRate}%` },
                    ].map((s, i) => (
                        <div key={i} className="stat-card">
                            <div className="stat-label">{s.label}</div>
                            <div className="stat-value" style={{ fontSize: 28 }}>{s.value}</div>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid-2">
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, background: 'rgba(59,130,246,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={20} color="#3b82f6" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700 }}>Full Registrations Report</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>All attendees with check-in status</div>
                        </div>
                    </div>
                    <button id="download-registrations-csv" className="btn btn-secondary" onClick={() => download('csv')}>
                        <Download size={14} /> Download CSV
                    </button>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, background: 'rgba(16,185,129,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={20} color="#10b981" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700 }}>Attendance-Only Report</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Only checked-in attendees</div>
                        </div>
                    </div>
                    <button id="download-attendance-csv" className="btn btn-success" onClick={() => download('attendance-csv')}>
                        <Download size={14} /> Download CSV
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
