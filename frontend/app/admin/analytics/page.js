'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '../../../lib/api';
import AdminLayout from '../../../components/layout/AdminLayout';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const COLORS = ['#7c3aed', '#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

// Staggered animation variants
const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const slideUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

function AnalyticsContent() {
    const searchParams = useSearchParams();
    const eventIdParam = searchParams.get('eventId');
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(eventIdParam || '');
    const [overview, setOverview] = useState(null);
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/events/mine').then(r => { setEvents(r.data); if (r.data.length > 0 && !selectedEventId) setSelectedEventId(r.data[0]._id); });
    }, []);

    useEffect(() => {
        setLoading(true);
        const p = [api.get('/analytics/overview').then(r => setOverview(r.data))];
        if (selectedEventId) p.push(api.get(`/analytics/${selectedEventId}`).then(r => setEventData(r.data)));
        Promise.all(p).finally(() => setLoading(false));
    }, [selectedEventId]);

    return (
        <AdminLayout>
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div><h1>Analytics</h1><p>Registrations, attendance, and performance metrics</p></div>
                <select className="form-input" style={{ width: 260 }} value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                    <option value="">Select Event</option>
                    {events.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                </select>
            </div>

            {loading ? <div className="loading-center"><div className="spinner" /></div> : (
                <>
                    {/* Org overview stats */}
                    {overview && (
                        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid-4" style={{ marginBottom: 24 }}>
                            {[
                                { label: 'Total Events', value: overview.totalEvents, color: '#7c3aed' },
                                { label: 'Total Registrations', value: overview.totalRegistrations, color: '#3b82f6' },
                                { label: 'Total Check-ins', value: overview.totalAttendance, color: '#10b981' },
                                { label: 'Attendance Rate', value: `${overview.attendanceRate}%`, color: '#f59e0b' },
                            ].map((s, i) => (
                                <motion.div variants={slideUp} key={i} className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: s.color, filter: 'blur(50px)', opacity: 0.3, zIndex: 0 }} />
                                    <div style={{ position: 'relative', zIndex: 1 }}>
                                        <div className="stat-label">{s.label}</div>
                                        <div className="stat-value" style={{ fontSize: 28, color: s.color }}>{s.value}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* Per-event analytics */}
                    {eventData && (
                        <>
                            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid-3" style={{ marginBottom: 24 }}>
                                {[
                                    { label: 'Registered', value: eventData.totalRegistrations, color: '#7c3aed' },
                                    { label: 'Checked In', value: eventData.totalAttendance, color: '#10b981' },
                                    { label: 'Spots Left', value: eventData.spotsLeft, color: '#ef4444' },
                                ].map((s, i) => (
                                    <motion.div variants={slideUp} key={i} className="stat-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div className="stat-label">{s.label}</div>
                                        <div className="stat-value" style={{ fontSize: 28, color: s.color }}>{s.value}</div>
                                    </motion.div>
                                ))}
                            </motion.div>

                            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid-2" style={{ marginBottom: 24 }}>
                                {/* Registrations over time */}
                                <motion.div variants={slideUp} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', bottom: -50, left: '50%', transform: 'translateX(-50%)', width: '80%', height: 100, background: 'var(--accent)', filter: 'blur(80px)', opacity: 0.15, pointerEvents: 'none' }} />
                                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, position: 'relative', zIndex: 1 }}>Daily Registrations</h2>
                                    {eventData.registrationsOverTime.length === 0 ? <div className="empty-state" style={{ padding: '24px 0' }}>No data</div> : (
                                        <ResponsiveContainer width="100%" height={200} style={{ position: 'relative', zIndex: 1 }}>
                                            <BarChart data={eventData.registrationsOverTime}>
                                                <defs>
                                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#d8b4fe" stopOpacity={1} />
                                                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.8} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                                                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} allowDecimals={false} />
                                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ background: 'rgba(15,15,26,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, color: '#f1f5f9', fontSize: 13, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} />
                                                <Bar dataKey="count" fill="url(#colorCount)" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </motion.div>

                                {/* Org breakdown */}
                                <motion.div variants={slideUp} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 120, height: 120, background: '#3b82f6', filter: 'blur(90px)', opacity: 0.15, pointerEvents: 'none' }} />
                                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, position: 'relative', zIndex: 1 }}>Attendees by Organization</h2>
                                    {eventData.orgBreakdown.length === 0 ? <div className="empty-state" style={{ padding: '24px 0' }}>No org data</div> : (
                                        <ResponsiveContainer width="100%" height={200} style={{ position: 'relative', zIndex: 1 }}>
                                            <PieChart>
                                                <Pie data={eventData.orgBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                                    {eventData.orgBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(255,255,255,0.05)" />)}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ background: 'rgba(15,15,26,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                                                    itemStyle={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600 }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </motion.div>
                            </motion.div>

                            {/* Capacity bar */}
                            <motion.div variants={slideUp} initial="hidden" animate="show" className="card" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ fontSize: 14, fontWeight: 600 }}>Capacity Usage</span>
                                    <span style={{ fontSize: 14, color: 'var(--accent-light)', fontWeight: 700 }}>{eventData.capacityUsage}%</span>
                                </div>
                                <div className="progress-bar" style={{ height: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6 }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(eventData.capacityUsage, 100)}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="progress-bar-fill"
                                        style={{
                                            background: eventData.capacityUsage >= 100 ? 'var(--red)' : eventData.capacityUsage > 80 ? 'var(--amber)' : 'var(--accent)',
                                            boxShadow: `0 0 15px ${eventData.capacityUsage >= 100 ? 'var(--red)' : eventData.capacityUsage > 80 ? 'var(--amber)' : 'var(--accent)'}`,
                                            borderRadius: 6
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{eventData.totalRegistrations} registered</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{eventData.event.capacity} capacity</span>
                                </div>
                            </motion.div>
                        </>
                    )}
                </>
            )}
        </AdminLayout>
    );
}

export default function AnalyticsPage() {
    return <Suspense fallback={<AdminLayout><div className="loading-center"><div className="spinner" /></div></AdminLayout>}><AnalyticsContent /></Suspense>;
}
