'use client';
import Link from 'next/link';
import { ArrowLeft, Zap, Shield, Eye, Cookie } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
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
                            <Eye size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-white">Privacy & Cookie Policy</h1>
                            <p className="text-xs text-on-surface-variant mt-1">Last Updated: July 7, 2026</p>
                        </div>
                    </div>

                    <div className="space-y-8 font-body-md text-on-surface-variant leading-relaxed">
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white">1. Information We Collect</h2>
                            <p>
                                When you use EventFlow, we collect information necessary to deliver services, including:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Account Details:</strong> Email address, organization details, and credentials.</li>
                                <li><strong>Registration Information:</strong> Attendee name, email address, phone number, and organization for event tickets.</li>
                                <li><strong>Transaction Data:</strong> Payment details (processed securely via Stripe or Razorpay; we do not store raw card numbers).</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white">2. Cookies & Local Storage</h2>
                            <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                                <Cookie size={20} className="text-primary mt-1 flex-shrink-0" />
                                <p className="text-sm">
                                    We use essential cookies and browser Local Storage to keep you authenticated, store dashboard state preferences, and maintain secure session states. Clicks, navigation routes, and general analytics are tracked anonymously to improve platform stability.
                                </p>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white">3. How We Use Your Data</h2>
                            <p>
                                We use your personal data to generate and email QR code entry tickets, manage registrations, facilitate payments, and provide dashboard analytics to organizers. We do not sell your personal data to third parties.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white">4. Data Security</h2>
                            <p>
                                All communications on EventFlow are encrypted over HTTPS. Registration data and user records are stored securely, using industry-standard access controls and database encryption protocols to prevent unauthorized data leaks.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white">5. Your Data Rights</h2>
                            <p>
                                Depending on your location, you may have rights under the GDPR or local data privacy laws. These include the right to access, edit, or request the deletion of your personal registration details. To execute these rights, please contact our support team.
                            </p>
                        </section>
                    </div>

                    <div className="border-t border-white/10 pt-8 flex items-center justify-between text-xs text-on-surface-variant">
                        <div className="flex items-center gap-2">
                            <Shield size={14} className="text-secondary" />
                            <span>Data Encrypted & GDPR Compliant</span>
                        </div>
                        <span>© 2026 EventFlow Inc.</span>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
