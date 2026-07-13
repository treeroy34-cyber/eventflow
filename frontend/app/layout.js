import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../lib/AuthContext';
import AnimatedBackground from '../components/AnimatedBackground';
import CursorFollower from '../components/CursorFollower';

export const metadata = {
    title: 'EventFlow — Smart Event Management',
    description: 'SaaS platform for event registration, QR check-in, analytics, and certificate generation.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <AnimatedBackground />
                <CursorFollower />
                <AuthProvider>
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            style: {
                                background: '#1a1a2e',
                                color: '#f1f5f9',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                fontSize: '14px',
                            },
                            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                        }}
                    />
                </AuthProvider>
            </body>
        </html>
    );
}
