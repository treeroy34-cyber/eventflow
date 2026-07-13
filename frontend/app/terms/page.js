'use client';
import Link from 'next/link';
import { ArrowLeft, Zap, Shield, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TermsOfService() {
    return (
        <div className="min-h-screen text-[#e4e1e7] relative py-12 px-6 overflow-x-hidden">
            {/* Header */}
            <header className="max-w-4xl mx-auto flex items-center justify-between mb-16">
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
            <main className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                    className="glass p-8 md:p-16 rounded-[2.5rem] space-y-12 glass-hover"
                >
                    <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-white">Terms of Service</h1>
                            <p className="text-xs text-on-surface-variant mt-1">Last Updated: July 7, 2026</p>
                        </div>
                    </div>

                    <div className="space-y-8 font-body-md text-on-surface-variant leading-relaxed">
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white">1. Agreement to Terms</h2>
                            <p>
                                By accessing or using EventFlow ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to all of the terms and conditions, you must not access or use our services.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white">2. User Registration & Accounts</h2>
                            <p>
                                To organize events or purchase tickets, you may be required to register for an account. You agree to provide accurate, current, and complete information and maintain the security of your credentials. You are fully responsible for all activities that occur under your account.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white">3. Event Ticketing & Payments</h2>
                            <p>
                                EventFlow acts as a SaaS platform enabling organizers to list events and manage ticket sales. 
                                Payments for paid events are processed securely via our payment gateway partners. Ticket refunds are subject to the specific refund policies set by individual event organizers. EventFlow is not responsible for refund disputes.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white">4. QR Code & Check-in System</h2>
                            <p>
                                Tickets issued by EventFlow contain unique QR codes. These QR codes are intended for single-use validation at the event venue. Unauthorized duplication, resale, or manipulation of QR tickets is strictly prohibited and may result in ticket cancellation and account suspension.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white">5. Limitation of Liability</h2>
                            <p>
                                EventFlow is provided "as is" without warranties of any kind. We do not guarantee uninterrupted access to the platform and are not liable for any losses arising from event cancellations, platform downtime, or unauthorized access to user data.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white">6. Modifications to Service</h2>
                            <p>
                                We reserve the right to modify or terminate any part of the Platform or services at any time without notice. Continued use of the Platform after changes to the Terms indicates your acceptance of the updated terms.
                            </p>
                        </section>
                    </div>

                    <div className="border-t border-white/10 pt-8 flex items-center justify-between text-xs text-on-surface-variant">
                        <div className="flex items-center gap-2">
                            <Shield size={14} className="text-secondary" />
                            <span>Secured Event Management SaaS</span>
                        </div>
                        <span>© 2026 EventFlow Inc.</span>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
