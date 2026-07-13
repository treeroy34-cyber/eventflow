'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Zap, Mail, MapPin, Clock, MessageSquare, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ContactSupport() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        setTimeout(() => {
            toast.success('Support ticket submitted! We will reply within 24 hours.');
            setForm({ name: '', email: '', subject: '', message: '' });
            setSubmitting(false);
        }, 1200);
    };

    return (
        <div className="min-h-screen text-[#e4e1e7] relative py-12 px-6 overflow-x-hidden">
            {/* Header */}
            <header className="max-w-5xl mx-auto flex items-center justify-between mb-16">
                <Link href="/" className="flex items-center gap-2 cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-[0_0_15px_rgba(236,72,153,0.5)] group-hover:shadow-[0_0_25px_rgba(236,72,153,0.8)] transition-all">
                        <Zap size={20} className="fill-white" />
                    </div>
                    <span className="font-display-xl text-[24px] font-bold text-white tracking-wide">
                        Event<span className="text-primary neon-text-glow">Flow</span>
                    </span>
                </Link>
                <Link href="/" className="inline-flex items-center gap-2 text-xs font-label-caps uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors">
                    <ArrowLeft size={14} /> Back to home
                </Link>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Contact Info Column (4 cols) */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                    className="lg:col-span-5 space-y-6"
                >
                    <div className="glass p-8 rounded-[2rem] space-y-6">
                        <h2 className="text-2xl font-bold text-white mb-4">Get in Touch</h2>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                            Have questions about organizing an event, ticket payments, or QR validation? Our customer support agents are ready to assist you.
                        </p>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-white/40">Support Email</p>
                                    <a href="mailto:support@eventflow.io" className="hover:text-primary transition-colors">support@eventflow.io</a>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-white/40">Headquarters</p>
                                    <p className="text-white">Alchemist Tech Labs, Sector 5, Kolkata, IN</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-white/40">Support Hours</p>
                                    <p className="text-white">Monday - Friday: 9 AM - 6 PM IST</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Form Column (7 cols) */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                    className="lg:col-span-7"
                >
                    <div className="glass p-8 md:p-12 rounded-[2rem] glass-hover">
                        <div className="flex items-center gap-3 mb-8">
                            <MessageSquare size={20} className="text-secondary" />
                            <h2 className="text-2xl font-bold text-white">Send a Message</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label className="form-label">Your Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        style={{ padding: '12px 14px', fontSize: 15 }}
                                        placeholder="John Doe"
                                        value={form.name}
                                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        style={{ padding: '12px 14px', fontSize: 15 }}
                                        placeholder="john@example.com"
                                        value={form.email}
                                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Subject</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ padding: '12px 14px', fontSize: 15 }}
                                    placeholder="Ticketing / Dashboard Assistance"
                                    value={form.subject}
                                    onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Message</label>
                                <textarea
                                    className="form-input"
                                    rows="5"
                                    style={{ padding: '12px 14px', fontSize: 15, resize: 'none', height: 'auto' }}
                                    placeholder="Explain your request in detail..."
                                    value={form.message}
                                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                                    required
                                />
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={submitting}
                                className="btn btn-primary w-full py-4 justify-center gap-2 font-bold text-sm"
                            >
                                <Send size={16} />
                                {submitting ? 'Submitting...' : 'Submit Support Ticket'}
                            </motion.button>
                        </form>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
