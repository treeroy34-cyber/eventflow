'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import AdminLayout from '../../components/layout/AdminLayout';
import { motion } from 'framer-motion';
import ScrollZoom from '../../components/ScrollZoom';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.15 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Calendar, Users, CheckCircle, TrendingUp, Zap, ArrowRight, Search, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPage() {
    const { organization } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/analytics/overview').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
    }, []);

    // Registration Table State
    const [eventsList, setEventsList] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [search, setSearch] = useState('');
    const [regLoading, setRegLoading] = useState(false);

    useEffect(() => {
        api.get('/events/mine').then(r => setEventsList(r.data)).catch(console.error);
    }, []);

    useEffect(() => {
        setRegLoading(true);
        const params = new URLSearchParams();
        if (selectedEventId) params.append('eventId', selectedEventId);
        if (search) params.append('search', search);
        api.get(`/registrations?${params.toString()}`).then(r => setRegistrations(r.data.registrations)).catch(console.error).finally(() => setRegLoading(false));
    }, [selectedEventId, search]);

    if (loading) return <AdminLayout><div className="loading-center"><div className="spinner" /></div></AdminLayout>;
    if (!data) return <AdminLayout><div /></AdminLayout>;

    const statCards = [
        { 
            label: 'Total Events', 
            value: data.totalEvents, 
            icon: Calendar, 
            color: '#a78bfa', 
            trend: '+12% active',
            glowColor: 'rgba(139, 92, 246, 0.15)',
            href: '/admin/events' 
        },
        { 
            label: 'Total Registrations', 
            value: data.totalRegistrations, 
            icon: Users, 
            color: '#6366f1', 
            trend: 'Across all events',
            glowColor: 'rgba(99, 102, 241, 0.12)',
            href: '/admin/registrations' 
        },
        { 
            label: 'Total Check-ins', 
            value: data.totalAttendance, 
            icon: CheckCircle, 
            color: '#10b981', 
            trend: `${data.attendanceRate}% completion`,
            glowColor: 'rgba(16, 185, 129, 0.12)',
            href: '/admin/events',
            showProgress: true,
            progress: data.attendanceRate
        },
        { 
            label: 'Attendance Rate', 
            value: `${data.attendanceRate}%`, 
            icon: TrendingUp, 
            color: '#6ee7b7', 
            trend: 'Overall attendance target',
            glowColor: 'rgba(110, 231, 183, 0.12)',
            href: '/admin/analytics' 
        },
    ];

    return (
        <AdminLayout>
            <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ width: '100%' }}>
                <motion.div variants={itemVariants} className="page-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Zap size={20} color="var(--accent)" />
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{organization?.name}</span>
                    </div>
                    <h1>Dashboard Overview</h1>
                    <p>Welcome back! Here's what's happening.</p>
                </motion.div>

                {/* Stat Cards */}
                <motion.div variants={itemVariants} className="grid-4" style={{ marginBottom: 28 }}>
                    {statCards.map((s, i) => (
                        <ScrollZoom key={i} style={{ display: 'flex', width: '100%' }}>
                            <Link 
                                href={s.href} 
                                className="stat-card glass-card glass-interactive" 
                                style={{ 
                                    textDecoration: 'none', 
                                    position: 'relative', 
                                    overflow: 'hidden',
                                    borderColor: 'rgba(255, 255, 255, 0.08)',
                                    padding: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    borderRadius: '16px',
                                    width: '100%'
                                }}
                            >
                                {/* Glow effect backdrops */}
                                <div 
                                    style={{ 
                                        position: 'absolute', 
                                        right: '-20px', 
                                        top: '-20px', 
                                        width: '100px', 
                                        height: '100px', 
                                        borderRadius: '50%', 
                                        background: s.glowColor, 
                                        filter: 'blur(20px)',
                                        pointerEvents: 'none'
                                    }} 
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                    <div className="stat-label" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</div>
                                    <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <s.icon size={18} color={s.color} />
                                    </div>
                                </div>
                                <div style={{ marginTop: 12 }}>
                                    <div className="stat-value" style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
                                    
                                    {s.showProgress ? (
                                        <div style={{ marginTop: 8 }}>
                                            <div className="progress-bar" style={{ height: 4, background: 'rgba(255,255,255,0.08)' }}>
                                                <div className="progress-bar-fill" style={{ width: `${s.progress}%`, background: `linear-gradient(90deg, #8b5cf6, #4f46e5)` }} />
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>{s.trend}</div>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: 12, color: s.color, marginTop: 4, fontWeight: 500 }}>
                                            {s.trend}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </ScrollZoom>
                    ))}
                </motion.div>

                <ScrollZoom style={{ marginBottom: 28, width: '100%' }}>
                    <div className="grid-2" style={{ width: '100%' }}>
                        {/* Monthly Chart */}
                        <div className="card glass-card">
                        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Registrations Over Time</h2>
                        {data.monthlyData.length === 0 ? (
                            <div className="empty-state" style={{ padding: '32px 0' }}>No data yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={data.monthlyData}>
                                    <defs>
                                        <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ background: '#060414', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }} />
                                    <Area type="monotone" dataKey="registrations" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRegistrations)" dot={{ fill: '#a78bfa', r: 4, strokeWidth: 1, stroke: '#060414' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Events Summary */}
                    <div className="card glass-card">
                        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Events Summary</h2>
                        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                            <div style={{ flex: 1, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-light)' }}>{data.upcomingEvents}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Upcoming</div>
                            </div>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                                <div style={{ fontSize: 28, fontWeight: 800 }}>{data.pastEvents}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Past</div>
                            </div>
                        </div>
                        <div className="progress-bar" style={{ height: 6, background: 'rgba(255,255,255,0.08)' }}>
                            <div className="progress-bar-fill" style={{ width: `${data.attendanceRate}%`, background: `linear-gradient(90deg, #8b5cf6, #4f46e5)` }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                            <span>Overall Attendance Rate</span>
                            <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{data.attendanceRate}%</span>
                        </div>
                    </div>
                    </div>
                </ScrollZoom>

                {/* Recent Events Table */}
                <ScrollZoom style={{ marginBottom: 28, width: '100%' }}>
                    <div className="card glass-card" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h2 style={{ fontSize: 17, fontWeight: 700 }}>Recent Events</h2>
                        <Link href="/admin/events" className="btn btn-secondary btn-sm">View All <ArrowRight size={13} /></Link>
                    </div>
                    {data.recentEvents.length === 0 ? (
                        <div className="empty-state" style={{ padding: '32px 0' }}>
                            <Calendar size={32} />
                            <p style={{ marginTop: 8 }}>No events yet. <Link href="/admin/events" style={{ color: 'var(--accent-light)' }}>Create one!</Link></p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead><tr><th>Event</th><th>Status</th><th>Date</th><th>Registered</th><th>Checked In</th><th>Rate</th><th></th></tr></thead>
                                <tbody>
                                    {data.recentEvents.map(evt => (
                                        <tr key={evt.id}>
                                            <td style={{ fontWeight: 600 }}>{evt.title}</td>
                                            <td>
                                                <span className={`badge-glow ${evt.status === 'APPROVED' ? 'badge-glow-green' : evt.status === 'REJECTED' ? 'badge-glow-red' : 'badge-glow-amber'}`}>
                                                    <span className="badge-dot" />
                                                    {evt.status || 'PENDING'}
                                                </span>
                                            </td>
                                            <td>{format(new Date(evt.date), 'MMM d, yyyy')}</td>
                                            <td>{evt.registrations} / {evt.capacity}</td>
                                            <td>{evt.attendance}</td>
                                            <td>
                                                <span className={`badge-glow ${evt.attendanceRate >= 70 ? 'badge-glow-green' : evt.attendanceRate >= 40 ? 'badge-glow-amber' : 'badge-glow-red'}`}>
                                                    <span className="badge-dot" />
                                                    {evt.attendanceRate}%
                                                </span>
                                            </td>
                                            <td><Link href={`/admin/registrations?eventId=${evt.id}`} className="btn btn-secondary btn-sm">View</Link></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    </div>
                </ScrollZoom>

                {/* Attendees / Registrations Dashboard Control Panel */}
                <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700 }}>Manage Attendees</h2>
                    <Link href="/admin/registrations" className="btn btn-secondary btn-sm">Advanced View <ArrowRight size={13} /></Link>
                </motion.div>

                {/* Filters */}
                <motion.div variants={itemVariants} className="card glass-card" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', padding: '16px 20px' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <select id="dashboard-event-filter" className="form-input" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                            <option value="">All Events</option>
                            {eventsList.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                        </select>
                    </div>
                    <div className="search-bar" style={{ flex: 2, minWidth: 200 }}>
                        <Search size={15} />
                        <input id="dashboard-reg-search" className="form-input" placeholder="Search attendees by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
                    </div>
                </motion.div>

                <ScrollZoom style={{ width: '100%' }}>
                    <div className="card glass-card" style={{ width: '100%' }}>
                    {regLoading ? (
                        <div className="loading-center" style={{ minHeight: 200 }}><div className="spinner" /></div>
                    ) : registrations.length === 0 ? (
                        <div className="empty-state" style={{ padding: '40px 0' }}><p>No registrations found matching your search.</p></div>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th><th>Email</th><th>Organization</th><th>Event</th><th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrations.slice(0, 10).map(r => (
                                        <tr key={r._id}>
                                            <td>{r.attendeeName}</td>
                                            <td style={{ color: 'var(--text-muted)' }}>{r.email}</td>
                                            <td style={{ color: 'var(--text-muted)' }}>{r.organization || '—'}</td>
                                            <td style={{ color: 'var(--text-muted)' }}>{r.eventId?.title || '—'}</td>
                                            <td>
                                                {r.checkInStatus
                                                    ? <span className="badge-glow badge-glow-green"><span className="badge-dot" /> Checked In</span>
                                                    : <span className="badge-glow badge-glow-amber"><span className="badge-dot" /> Pending</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    </div>
                </ScrollZoom>
            </motion.div>
        </AdminLayout>
    );
}
