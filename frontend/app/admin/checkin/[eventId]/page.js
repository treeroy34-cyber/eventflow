'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import jsQR from 'jsqr';
import api from '../../../../lib/api';
import AdminLayout from '../../../../components/layout/AdminLayout';
import toast from 'react-hot-toast';
import { QrCode, Search, CheckCircle, Upload } from 'lucide-react';
import { format } from 'date-fns';

export default function CheckInPage() {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [scanning, setScanning] = useState(false);
    const [manualId, setManualId] = useState('');
    const [processing, setProcessing] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const scanningRef = useRef(false);

    useEffect(() => {
        api.get('/events/mine').then(r => setEvent(r.data.find(e => e._id === eventId))).catch(console.error);
        loadAttendance();
        return () => stopScanner(); // Cleanup camera on unmount
    }, [eventId]);

    const loadAttendance = () => {
        api.get(`/checkin/${eventId}`).then(r => setAttendance(r.data)).catch(console.error);
    };

    const doCheckIn = async (payload) => {
        if (processing) return;
        setProcessing(true);
        try {
            await api.post('/checkin', { ...payload, eventId });
            toast.success('✅ Check-in successful!');
            loadAttendance();
        } catch (err) {
            if (err.response?.status === 409) {
                toast.success(`Already checked in: ${err.response.data.attendeeName}`);
                loadAttendance(); // Force a refresh of the list just in case
            } else {
                toast.error(err.response?.data?.message || 'Check-in failed.');
            }
        } finally {
            setProcessing(false);
        }
    };

    const startScanner = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute("playsinline", true);
                videoRef.current.play();
                setScanning(true);
                scanningRef.current = true;
                requestAnimationFrame(tick);
            }
        } catch (err) {
            console.error(err);
            toast.error('Could not access camera. Please check permissions.');
        }
    };

    const stopScanner = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setScanning(false);
        scanningRef.current = false;
    };

    const tick = () => {
        if (!scanningRef.current) return;
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

            // Automatically attempt scanning a horizontally mirrored version of the image!
            // This guarantees that a selfie-cam pointing at a QR code will read successfully.
            if (!code) {
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
                const flippedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                ctx.restore();
                code = jsQR(flippedData.data, flippedData.width, flippedData.height, { inversionAttempts: "dontInvert" });
            }

            if (code && code.data && code.data.trim()) {
                stopScanner();
                doCheckIn({ qrData: code.data });
                return;
            }
        }
        requestAnimationFrame(tick);
    };

    const processImageFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, img.width, img.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                    let code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });

                    if (!code) {
                        ctx.save();
                        ctx.scale(-1, 1);
                        ctx.drawImage(img, -canvas.width, 0, canvas.width, canvas.height);
                        const flipped = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        ctx.restore();
                        code = jsQR(flipped.data, flipped.width, flipped.height, { inversionAttempts: "attemptBoth" });
                    }

                    if (code && code.data) resolve(code.data);
                    else reject(new Error("No QR code found"));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFileUpload = async (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        try {
            toast.loading('Analyzing image...', { id: 'qrScan' });
            const qrData = await processImageFile(file);
            toast.dismiss('qrScan');
            doCheckIn({ qrData });
        } catch (err) {
            toast.dismiss('qrScan');
            toast.error('Could not read QR code. Please ensure it is clear and visible.');
        } finally {
            e.target.value = '';
        }
    };

    const handleManual = (e) => {
        e.preventDefault();
        if (!manualId.trim()) return;
        doCheckIn({ registrationId: manualId.trim() });
        setManualId('');
    };

    return (
        <AdminLayout>
            <div className="page-header">
                <h1>QR Check-In</h1>
                <p>{event?.title || 'Loading event...'} · {attendance.length} checked in</p>
            </div>

            <div className="grid-2" style={{ alignItems: 'stretch', marginBottom: 24, minHeight: 450 }}>
                {/* Scanner Panel */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <QrCode size={18} color="var(--accent)" /> Custom QR Scanner
                    </h2>

                    {/* The Live Scanner View (Hidden when not scanning) */}
                    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: '#000', marginBottom: 16, display: scanning ? 'block' : 'none' }}>
                        <video
                            ref={videoRef}
                            style={{
                                width: '100%',
                                display: 'block',
                                transform: 'scaleX(-1)' // Mirror perfectly for self-facing cams, fixing the user's "left hand raises left hand" complaint
                            }}
                        />
                        {/* Scanning Graphic Overlay */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60%', height: '60%', border: '2px dashed #7c3aed', borderRadius: 12 }}></div>
                    </div>

                    {/* Hidden canvas for image data processing */}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {!scanning ? (
                        <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={startScanner}>
                                <QrCode size={16} /> Start Camera
                            </button>
                            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => fileInputRef.current?.click()} disabled={processing}>
                                <Upload size={16} /> Upload Image
                            </button>
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                        </div>
                    ) : (
                        <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }} onClick={stopScanner}>
                            Stop Scanner
                        </button>
                    )}

                    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Search size={13} /> Or enter Registration ID manually
                        </p>
                        <form onSubmit={handleManual} style={{ display: 'flex', gap: 8 }}>
                            <input className="form-input" placeholder="Registration ID..." value={manualId} onChange={e => setManualId(e.target.value)} style={{ flex: 1 }} />
                            <button type="submit" className="btn btn-primary btn-sm" disabled={processing}>
                                {processing ? '...' : 'Check In'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Live Attendance Feed */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle size={16} color="var(--green)" /> Checked In ({attendance.length})
                    </h2>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {attendance.length === 0 ? (
                            <div className="empty-state" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0' }}><p>No check-ins yet</p></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {attendance.map(a => (
                                    <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10 }}>
                                        <div style={{ width: 32, height: 32, background: 'rgba(16,185,129,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <CheckCircle size={14} color="var(--green)" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {a.registrationId?.attendeeName || 'Unknown'}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                {a.registrationId?.email} · {format(new Date(a.checkedInAt), 'h:mm a')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
