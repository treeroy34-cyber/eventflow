'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import {
    LayoutDashboard, Calendar, Users, QrCode, BarChart2,
    FileText, Award, UserCog, LogOut, Zap, Building, ShieldCheck
} from 'lucide-react';

import { motion } from 'framer-motion';

const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Events', icon: Calendar, href: '/admin/events' },
    { label: 'Registrations', icon: Users, href: '/admin/registrations' },
    { label: 'Check-In', icon: QrCode, href: '/admin/checkin' },
    { label: 'Analytics', icon: BarChart2, href: '/admin/analytics' },
    { label: 'Organizations', icon: Building, href: '/admin/organizations' },
    { label: 'Reports', icon: FileText, href: '/admin/reports' },
    { label: 'Certificates', icon: Award, href: '/admin/certificates' },
    { label: 'Staff', icon: UserCog, href: '/admin/staff', adminOnly: true },
    { label: 'Moderation', icon: ShieldCheck, href: '/admin/moderation', superAdminOnly: true },
];

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, organization, logout, isAdmin, isSuperAdmin } = useAuth();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const visibleNav = navItems.filter(n => {
        if (n.superAdminOnly && !isSuperAdmin) return false;
        if (n.adminOnly && !isAdmin) return false;
        return true;
    });

    return (
        <div className="admin-layout" style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex' }}>
            {/* Drifting Background Glow Spheres */}
            <div className="bg-glow-container">
                <div className="bg-glow-1" />
                <div className="bg-glow-2" />
            </div>
            {/* Sidebar */}
            <aside className="sidebar">
                <Link href="/" className="sidebar-logo group" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-neon to-accent-dark flex items-center justify-center text-white shadow-[0_0_15px_rgba(236,72,153,0.5)] group-hover:shadow-[0_0_20px_rgba(236,72,153,0.8)] transition-all">
                        <Zap size={16} className="fill-white" />
                    </div>
                    <span className="font-display-xl text-[20px] font-bold text-white tracking-wide">
                        Event<span className="text-pink-neon neon-text-glow">Flow</span>
                    </span>
                </Link>

                <div style={{ padding: '0 12px 16px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {organization?.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {user?.name} · <span style={{ color: 'var(--accent-light)' }}>{user?.role}</span>
                    </div>
                </div>

                <div className="sidebar-section-label">Navigation</div>
                {visibleNav.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-link ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
                    >
                        <item.icon size={16} />
                        {item.label}
                    </Link>
                ))}

                <div className="sidebar-bottom">
                    <Link href="/" className="sidebar-link" style={{ marginBottom: 4 }}>
                        <Calendar size={16} /> View Public Site
                    </Link>
                    <button onClick={handleLogout} className="sidebar-link" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', color: 'var(--red)' }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="admin-content">
                {children}
            </main>
        </div>
    );
}
