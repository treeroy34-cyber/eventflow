'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { Zap, Search, ArrowRight, Menu, X, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ScrollZoom from '../components/ScrollZoom';

const fallbackEvents = [
    {
        _id: 'mock-1',
        title: 'Midnight Zenith Gala',
        description: 'Explore the boundaries of design, creative fiction, and futuristic interfaces in this immersive space.',
        category: 'Music Galas',
        date: new Date().toISOString(),
        venue: 'Neo Tokyo Orbit',
        capacity: 150,
        registrationCount: 150,
        isPaid: true,
        price: 499,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBViGbM4flaPZQNtu7-7UkD7ESC3ME8cfl33CqLh4D4yXoADA5NPMh-CiCKnHEh8sv-VkHps05SgTxzYeJrvFU8VYw1wZ2uscn-vzlr6Xgd9KRrwSc0sqgjE3ftDFcIHkA2L-jEMkiywzhCFw9C_leVrpwjzKGThKg8DqjRbfH3FjWIsdnd33pXQrjex15_rS4YbRgvqpyucajXlpEtIfKnjQ4YC68i002YEhylDFsKq84YOwhRZWl',
        gallery: [],
        status: 'Sold Out'
    },
    {
        _id: 'mock-2',
        title: 'Neon Pulse Night',
        description: 'Deep dive into decentralized systems, AI agents, and next-generation music beat retreats.',
        category: 'Art Tech',
        date: new Date().toISOString(),
        venue: 'Cloud Valley Center',
        capacity: 200,
        registrationCount: 124,
        isPaid: false,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1Q2jz0nWcin8dFHtWWQHUa7Hi7qij2ZEQmzv3YtKX4YE3B5SE8SqjSOaNPgIhS3o4UlWtTv44uWNmmZ9tLB6KmFvlWDq3qAsKDL9FYukKYmaF2lpvJfPKDqqLp9WtuGPduP0szDEScjkElijSL12Sn0fe8FHsjiKhCGPvJ6PUrx0IJNJNlQXkALxA-uNpZn2ZhdCEgd3XTCUfRtbeMdJDWY5DmNMEPnkShH0SiJu5n29X2rJMgF68',
        gallery: []
    },
    {
        _id: 'mock-3',
        title: 'Alchemist Beats',
        description: 'Immersive audio-visual experiences featuring modular synths, laser shows, and spatial sound engineering.',
        category: 'Cybersports',
        date: new Date().toISOString(),
        venue: 'Virtual Lounge',
        capacity: 500,
        registrationCount: 395,
        isPaid: true,
        price: 999,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdCwh-cmbA1eSw4GL-6ic3ZKfPGZ3G6sPXwkq0P9ZxU122eIjQuT2i3AJz0XtpaSPRme9lyWbli1V7SL_naB6oxWKyanRNE86HT91IKukzcN0xFevUECHZKIdlDQdEEyqIJGwbNfTPv5WgLs4eJh4tW2uGttuwKnAN8mTegJ_cdvK-TODVa3DDZEnSTRt0IvG6EscKAie4_l8SVuASrq8G5xZdgMm0lDmT4ilB0X3ta_gZZOZDPdyD',
        gallery: []
    },
    {
        _id: 'mock-4',
        title: 'Obsidian Fashion Week',
        description: 'Where digital style meets physical reality. Witness the evolution of garments in the metadata.',
        category: 'Design',
        date: new Date().toISOString(),
        venue: 'Meta Fashion Hall',
        capacity: 300,
        registrationCount: 150,
        isPaid: false,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJLcOqOYORgH2UzBjODr4VFLkwc8KHD0kQriDwt0F9bVdZlU2Dh-0JVVRKv-_swGuqzT4jMCjLuTuUsI37wIj6wS_yvqP5QT58lBNsCVVnkqVmAoTOVcMY5OsryVoPuovxdP74qhjCfrFD-dWl90bX1tswC03S7kKMB85jqajgNlvUM-ZcORmQwLneiLAaWT4gv6MvylcM2YI5RSmTq214oWqXihE8T4egccaKbOSa9197Dn9adnlo',
        gallery: []
    }
];

export default function PublicEventsPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const galleryRef = useRef(null);
    const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
    const { user } = useAuth();

    // Fetch events from API
    useEffect(() => {
        api.get('/events')
            .then(r => {
                if (r.data) {
                    setEvents(r.data);
                } else {
                    setEvents([]);
                }
            })
            .catch(err => {
                console.error(err);
                setEvents([]);
            })
            .finally(() => setLoading(false));
    }, []);

    // Close gallery dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (galleryRef.current && !galleryRef.current.contains(e.target)) {
                setGalleryOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const eventsWithGallery = events.filter(e => e.gallery && e.gallery.length > 0);

    const filtered = events.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.venue || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.category || '').toLowerCase().includes(search.toLowerCase())
    );

    const displayEvents = filtered;

    const card1 = displayEvents[0];

    // Intersection observer effect
    useEffect(() => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        };
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
        return () => revealObserver.disconnect();
    }, [loading, events]);

    const handleMouseMove = (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 10;
        const y = (e.clientY / window.innerHeight - 0.5) * 10;
        setMouseOffset({ x, y });
    };

    const handleSearchExplore = () => {
        document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#131317] gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-neon to-accent-dark flex items-center justify-center text-white shadow-[0_0_20px_rgba(236,72,153,0.5)] animate-pulse">
                    <Zap size={28} className="fill-white" />
                </div>
                <span className="font-display-xl text-[26px] font-bold text-white tracking-wide animate-pulse">
                    Event<span className="text-pink-neon neon-text-glow">Flow</span>
                </span>
            </div>
        );
    }

    return (
        <div 
            onMouseMove={handleMouseMove}
            className="selection:bg-primary-container selection:text-white relative min-h-screen text-[#e4e1e7]"
        >
            {/* Top Navigation Anchor */}
            <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-3 bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-[0_0_15px_rgba(0,238,252,0.2)] rounded-b-xl">
                <Link href={user ? "/dashboard" : "/login"} className="flex items-center gap-2 cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-neon to-accent-dark flex items-center justify-center text-white shadow-[0_0_15px_rgba(236,72,153,0.5)] group-hover:shadow-[0_0_25px_rgba(236,72,153,0.8)] transition-all">
                        <Zap size={20} className="fill-white" />
                    </div>
                    <span className="font-display-xl text-[24px] font-bold text-white tracking-wide">
                        Event<span className="text-pink-neon neon-text-glow">Flow</span>
                    </span>
                </Link>
                
                <nav className="hidden md:flex gap-8 items-center">
                    <Link className="font-label-caps text-[12px] text-primary font-bold tracking-[0.1em] uppercase" href="/">Discovery</Link>
                    <a className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary tracking-[0.1em] uppercase transition-colors" href="#events">Schedule</a>
                    <Link className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary tracking-[0.1em] uppercase transition-colors" href={user ? "/dashboard" : "/login"}>Tickets</Link>
                    
                    {/* Gallery Dropdown in header */}
                    <div className="relative" ref={galleryRef}>
                        <button
                            onClick={() => setGalleryOpen(!galleryOpen)}
                            className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary tracking-[0.1em] uppercase flex items-center gap-1 transition-colors"
                        >
                            Gallery
                            <ChevronDown size={14} />
                        </button>
                        <AnimatePresence>
                            {galleryOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-3 w-64 glass rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50"
                                >
                                    <div className="px-4 py-3 border-b border-white/5 text-[10px] font-bold uppercase tracking-wider text-white/40 bg-[#131317]/95">
                                        Browse Galleries
                                    </div>
                                    <div className="max-h-72 overflow-y-auto bg-[#131317]/95 backdrop-blur-md">
                                        {eventsWithGallery.length === 0 ? (
                                            <div className="px-4 py-6 text-center text-xs text-white/30">
                                                No galleries available.
                                            </div>
                                        ) : (
                                            eventsWithGallery.map(e => (
                                                <Link
                                                    key={e._id}
                                                    href={`/gallery/${e._id}`}
                                                    onClick={() => setGalleryOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                                                >
                                                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-black/40">
                                                        <img src={e.image || e.gallery[0]} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <div className="text-xs font-semibold text-white truncate">{e.title}</div>
                                                        <div className="text-[10px] text-white/40">{e.gallery.length} photos</div>
                                                    </div>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <Link className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary tracking-[0.1em] uppercase transition-colors" href={user ? "/dashboard" : "/login"}>
                        {user ? 'Dashboard' : 'Profile'}
                    </Link>
                </nav>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="text-primary hover:bg-white/10 p-2 rounded-xl transition-all"
                    >
                        <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
                    </button>
                </div>
            </header>

            {/* Mobile Drawer Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-[280px] glass z-40 flex flex-col pt-24 px-6 gap-6"
                    >
                        <Link onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-white" href="/">Discovery</Link>
                        <a onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-white" href="#events">Schedule</a>
                        <Link onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-white" href={user ? "/dashboard" : "/login"}>Tickets</Link>
                        <Link onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-white" href={user ? "/dashboard" : "/login"}>
                            {user ? 'Dashboard' : 'Profile'}
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Section */}
            <main className="relative min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto overflow-visible">
                {/* Orbital Background elements */}
                <div 
                    style={{ transform: `translate(${mouseOffset.x}px, ${mouseOffset.y}px)`, transition: 'transform 0.2s ease-out' }}
                    className="absolute top-0 right-0 w-[800px] h-[800px] orbital-gradient -z-10 opacity-60 pointer-events-none"
                />
                <div 
                    style={{ transform: `translate(${mouseOffset.x * -0.5}px, ${mouseOffset.y * -0.5}px)`, transition: 'transform 0.2s ease-out' }}
                    className="absolute bottom-0 left-0 w-[600px] h-[600px] orbital-gradient -z-10 opacity-40 pointer-events-none"
                />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left Hero Content */}
                    <motion.div 
                        initial="hidden"
                        animate="show"
                        variants={{
                            hidden: { opacity: 0 },
                            show: {
                                opacity: 1,
                                transition: { staggerChildren: 0.15, delayChildren: 0.2 }
                            }
                        }}
                        className="space-y-8"
                    >
                        <motion.div 
                            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } } }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-primary/20"
                        >
                            <span className="w-2 h-2 rounded-full bg-secondary-container shadow-[0_0_8px_#00eefc]"></span>
                            <span className="font-label-caps text-[12px] tracking-[0.1em] text-secondary-container uppercase font-bold">Premium Access Live</span>
                        </motion.div>
                        <motion.h1 
                            variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } } }}
                            className="font-display-xl text-[44px] md:text-[64px] font-bold text-white leading-tight"
                        >
                            Experience the <span className="text-primary neon-text-glow">Digital Alchemy</span> of Events.
                        </motion.h1>
                        <motion.p 
                            variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } } }}
                            className="font-body-md text-body-md text-on-surface-variant max-w-lg"
                        >
                            Discover immersive, futuristic experiences that blend ethereal fantasy with cutting-edge cybernetics. Your gateway to high-end global galas and exclusive digital showcases.
                        </motion.p>
                        
                        {/* Search Filters Cluster */}
                        <motion.div 
                            variants={{ hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } } }}
                            className="glass p-6 rounded-3xl space-y-4 max-w-xl"
                        >
                            <div className="flex flex-wrap gap-4">
                                <div className="flex-1 min-w-[200px] relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary">search</span>
                                    <input 
                                        className="w-full bg-[#0e0e12] border-none rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary/50 placeholder:text-on-surface-variant/50" 
                                        placeholder="Search events..." 
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSearchExplore}
                                    className="px-8 py-4 bg-gradient-to-r from-primary-container to-tertiary-container text-white font-bold rounded-2xl hover:shadow-[0_0_20px_rgba(255,76,131,0.6)] transition-shadow flex items-center gap-2 btn-pulse"
                                >
                                    <span>Explore</span>
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </motion.button>
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                <span onClick={() => { setSearch('Music'); handleSearchExplore(); }} className="px-4 py-2 glass rounded-full text-[12px] font-label-caps text-primary whitespace-nowrap cursor-pointer hover:bg-primary/10">Music Galas</span>
                                <span onClick={() => { setSearch('Art'); handleSearchExplore(); }} className="px-4 py-2 glass rounded-full text-[12px] font-label-caps text-on-surface-variant whitespace-nowrap cursor-pointer hover:bg-primary/10">Art Tech</span>
                                <span onClick={() => { setSearch('Cyber'); handleSearchExplore(); }} className="px-4 py-2 glass rounded-full text-[12px] font-label-caps text-on-surface-variant whitespace-nowrap cursor-pointer hover:bg-primary/10">Cybersports</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right Hero Image/Visual - Next Event */}
                    <motion.div 
                        className="relative group animate-scale-fade" 
                        style={{ animationDelay: '0.5s', transformStyle: 'preserve-3d' }}
                        animate={{ rotateX: -mouseOffset.y * 2, rotateY: mouseOffset.x * 2 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-secondary-container/20 rounded-[4rem] blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" style={{ transform: 'translateZ(-20px)' }}></div>
                        <div className="relative rounded-[3rem] overflow-hidden glass border-white/20 aspect-square lg:aspect-auto lg:h-[600px] shadow-2xl glass-hover">
                            {card1 ? (
                                <>
                                    <img 
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                                        alt="Promo Event Image" 
                                        src={card1.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=cover&w=800&q=80'}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
                                    <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                                        <div className="glass p-6 rounded-2xl backdrop-blur-2xl">
                                            <p className="font-label-caps text-[12px] text-pink-neon mb-1 uppercase tracking-wider">Next Event</p>
                                            <h3 className="font-headline-lg text-[24px] font-bold text-white">{card1.title}</h3>
                                        </div>
                                        <Link 
                                            href={`/events/${card1._id}`}
                                            className="w-16 h-16 rounded-full glass border-white/30 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer hover:neon-border-glow"
                                        >
                                            <span className="material-symbols-outlined text-white text-3xl">play_arrow</span>
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-black/40">
                                    <Zap size={64} className="text-pink-neon animate-pulse mb-6" />
                                    <h3 className="font-headline-lg text-[28px] font-bold text-white mb-2">EventFlow Showcase</h3>
                                    <p className="font-body-md text-on-surface-variant max-w-sm">
                                        Join us for elite gatherings, summits, and certified showcases.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* Global Partners Marquee */}
            <ScrollZoom>
            <section className="py-12 bg-black/20 backdrop-blur-md border-y border-white/10 relative overflow-hidden">
                <div className="marquee flex items-center whitespace-nowrap">
                    <div className="flex gap-24 px-12 items-center">
                        <span className="font-display-xl text-[32px] text-black tracking-widest font-extrabold italic">EVENT_FLOW</span>
                        <span className="font-display-xl text-[32px] text-black tracking-widest font-extrabold italic">SEAMLESS_TICKETS</span>
                        <span className="font-display-xl text-[32px] text-black tracking-widest font-extrabold italic">REALTIME_DATA</span>
                        <span className="font-display-xl text-[32px] text-black tracking-widest font-extrabold italic">GLOBAL_REACH</span>
                        <span className="font-display-xl text-[32px] text-black tracking-widest font-extrabold italic">SMART_CHECKIN</span>
                    </div>
                    <div className="flex gap-24 px-12 items-center">
                        <span className="font-display-xl text-[32px] text-black tracking-widest font-extrabold italic">EVENT_FLOW</span>
                        <span className="font-display-xl text-[32px] text-black tracking-widest font-extrabold italic">SEAMLESS_TICKETS</span>
                        <span className="font-display-xl text-[32px] text-black tracking-widest font-extrabold italic">REALTIME_DATA</span>
                        <span className="font-display-xl text-[32px] text-black tracking-widest font-extrabold italic">GLOBAL_REACH</span>
                        <span className="font-display-xl text-[32px] text-black tracking-widest font-extrabold italic">SMART_CHECKIN</span>
                    </div>
                </div>
            </section>
            </ScrollZoom>

            {/* Featured Galas Bento Grid */}
            <ScrollZoom>
            <section id="events" className="py-20 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 reveal">
                    <div className="space-y-2">
                        <h2 className="font-headline-lg text-[40px] font-bold text-white">Featured Galas</h2>
                        <p className="font-body-md text-body-md text-on-surface-variant">Handpicked high-end experiences for our premium members.</p>
                    </div>
                    <button onClick={() => setSearch('')} className="font-label-caps text-[12px] text-primary border-b border-primary hover:text-white hover:border-white transition-all pb-1 uppercase tracking-wider">
                        View All Upcoming
                    </button>
                </div>

                {displayEvents.length === 0 ? (
                    <div className="card glass-card text-center py-20 px-6 flex flex-col items-center justify-center reveal">
                        <span className="material-symbols-outlined text-[48px] text-white/20 mb-4">search_off</span>
                        <h3 className="font-headline-lg text-[22px] font-bold text-white mb-2">No Experiences Found</h3>
                        <p className="font-body-md text-on-surface-variant max-w-md mx-auto">
                            We couldn't find any events matching your criteria. Try searching for something else or browse all categories.
                        </p>
                        <button onClick={() => setSearch('')} className="px-6 py-2.5 bg-gradient-to-r from-primary-container to-tertiary-container text-white font-bold rounded-xl mt-6">
                            View All Events
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 reveal">
                        {displayEvents.map(evt => (
                            <motion.div 
                                key={evt._id}
                                whileHover={{ scale: 1.02, y: -4 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="group relative rounded-[2.5rem] overflow-hidden glass glass-hover h-[460px] flex flex-col justify-end p-8 border border-white/5"
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {/* Background Image */}
                                <img 
                                    src={evt.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=cover&w=800&q=80'} 
                                    alt={evt.title} 
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                />
                                {/* Dark Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-95"></div>
                                
                                {/* Badges */}
                                <div className="absolute top-6 left-6 flex gap-2 z-10">
                                    <span className="px-3 py-1 bg-pink-neon/20 backdrop-blur-md rounded-full text-[10px] font-label-caps text-pink-neon border border-pink-neon/30 uppercase tracking-wider font-bold">
                                        {evt.category}
                                    </span>
                                    <span className="px-3 py-1 bg-white/5 backdrop-blur-md rounded-full text-[10px] font-label-caps text-white/80 border border-white/10 uppercase tracking-wider font-bold">
                                        {evt.isPaid ? `₹${evt.price}` : 'Free'}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="relative z-10 space-y-4">
                                    <h3 className="font-headline-lg text-[22px] font-bold text-white group-hover:text-pink-neon transition-colors duration-300 leading-snug">
                                        {evt.title}
                                    </h3>
                                    
                                    <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                                        {evt.description}
                                    </p>

                                    <div className="flex items-center gap-4 text-[11px] text-white/40 font-label-caps tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                                            <span>{format(new Date(evt.date), 'MMM d, yyyy')}</span>
                                        </div>
                                        {evt.venue && (
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[14px]">location_on</span>
                                                <span className="truncate max-w-[120px]">{evt.venue}</span>
                                            </div>
                                        )}
                                    </div>

                                    <Link 
                                        href={`/events/${evt._id}`} 
                                        className="block w-full text-center py-3 bg-white hover:bg-pink-neon text-black hover:text-white font-extrabold rounded-xl transition-all transform hover:scale-[1.02] text-[11px] uppercase tracking-wider"
                                    >
                                        Get Tickets
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
            </ScrollZoom>

            {/* Newsletter Section */}
            <ScrollZoom>
            <section className="py-20 px-6 reveal">
                <div className="max-w-4xl mx-auto glass p-12 md:p-20 rounded-[3rem] relative overflow-hidden text-center space-y-8 glass-hover">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -z-10"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-container/20 blur-[100px] -z-10"></div>
                    <h2 className="font-headline-lg text-[32px] md:text-[40px] font-bold text-white">Stay Ahead of the Curve</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mx-auto">
                        Join our community and be the first to know about premium events, early-bird ticket releases, and exclusive organizer features.
                    </p>
                    <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto" onSubmit={(e) => { e.preventDefault(); toast.success('Subscribed successfully! Welcome to the EventFlow inner circle.'); }}>
                        <input 
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" 
                            placeholder="Your digital address (Email)" 
                            required 
                            type="email"
                        />
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 bg-white text-black font-extrabold rounded-2xl hover:bg-primary-container hover:text-white transition-colors btn-pulse" type="submit"
                        >
                            Subscribe
                        </motion.button>
                    </form>
                    <p className="font-label-caps text-[10px] text-on-surface-variant/50 uppercase tracking-[0.2em]">
                        Secure Encryption Enabled • Priority Queue Access
                    </p>
                </div>
            </section>
            </ScrollZoom>

            {/* Footer Anchor */}
            <footer className="w-full py-8 mt-20 bg-surface-dim/40 backdrop-blur-md border-t border-white/10">
                <div className="flex flex-col md:flex-row items-center justify-between px-6 max-w-7xl mx-auto">
                    <div className="space-y-2 mb-8 md:mb-0 text-center md:text-left">
                        <span className="text-primary opacity-50 font-display-xl text-[20px] font-bold">EventFlow</span>
                        <p className="font-label-caps text-[12px] text-on-surface-variant tracking-wider">© 2026 EventFlow. Digital Alchemy.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-8">
                        <Link className="font-label-caps text-[12px] text-on-surface-variant hover:text-secondary tracking-wider uppercase transition-colors" href="/terms">Terms of Service</Link>
                        <Link className="font-label-caps text-[12px] text-on-surface-variant hover:text-secondary tracking-wider uppercase transition-colors" href="/privacy">Privacy Policy</Link>
                        <Link className="font-label-caps text-[12px] text-on-surface-variant hover:text-secondary tracking-wider uppercase transition-colors" href="/contact">Contact Support</Link>
                    </div>
                    <div className="flex gap-4 mt-8 md:mt-0">
                        <Link className="w-10 h-10 rounded-xl glass flex items-center justify-center text-primary-fixed-dim hover:neon-border-glow transition-all" href="/" title="Discovery Hub">
                            <span className="material-symbols-outlined text-[20px]">public</span>
                        </Link>
                        <Link className="w-10 h-10 rounded-xl glass flex items-center justify-center text-primary-fixed-dim hover:neon-border-glow transition-all" href={user ? "/dashboard" : "/login"} title="Organizer Dashboard">
                            <span className="material-symbols-outlined text-[20px]">hub</span>
                        </Link>
                    </div>
                </div>
            </footer>

            {/* Bottom Mobile Nav */}
            <nav className="md:hidden fixed bottom-0 w-full flex justify-around items-center px-4 py-2 bg-surface-dim/80 backdrop-blur-2xl border-t border-white/5 z-50 rounded-t-full shadow-2xl">
                <Link className="flex flex-col items-center justify-center bg-primary-container/20 text-primary rounded-full p-2 shadow-[0_0_12px_rgba(255,76,131,0.5)] scale-110" href="/">
                    <span className="material-symbols-outlined">explore</span>
                    <span className="font-label-caps text-[8px] uppercase mt-1">Discovery</span>
                </Link>
                <a className="flex flex-col items-center justify-center text-on-surface-variant/70 p-2 hover:text-primary transition-colors" href="#events">
                    <span className="material-symbols-outlined">calendar_month</span>
                    <span className="font-label-caps text-[8px] uppercase mt-1">Schedule</span>
                </a>
                <Link className="flex flex-col items-center justify-center text-on-surface-variant/70 p-2 hover:text-primary transition-colors" href={user ? "/dashboard" : "/login"}>
                    <span className="material-symbols-outlined">confirmation_number</span>
                    <span className="font-label-caps text-[8px] uppercase mt-1">Tickets</span>
                </Link>
                <Link className="flex flex-col items-center justify-center text-on-surface-variant/70 p-2 hover:text-primary transition-colors" href={user ? "/dashboard" : "/login"}>
                    <span className="material-symbols-outlined">person</span>
                    <span className="font-label-caps text-[8px] uppercase mt-1">Profile</span>
                </Link>
            </nav>
        </div>
    );
}
