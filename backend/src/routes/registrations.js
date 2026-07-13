const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const { generateQRCode } = require('../services/qrService');
const { sendRegistrationConfirmation } = require('../services/emailService');
const { protect } = require('../middleware/auth');

// GET /api/registrations - Protected: list ALL registrations for org (optional ?eventId= filter)
router.get('/', protect, async (req, res, next) => {
    try {
        const { eventId, search, page = 1, limit = 100 } = req.query;
        const filter = { orgId: req.orgId };
        if (eventId) filter.eventId = eventId;
        if (search) {
            filter.$or = [
                { attendeeName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Registration.countDocuments(filter);
        const registrations = await Registration.find(filter)
            .populate('eventId', 'title date venue')
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        // Compute checkInStatus from Attendance collection
        const regIds = registrations.map(r => r._id);
        const attendances = await Attendance.find({ registrationId: { $in: regIds } });
        const attendanceMap = {};
        attendances.forEach(a => { attendanceMap[a.registrationId.toString()] = a; });

        const result = registrations.map(r => ({
            ...r.toObject(),
            checkInStatus: !!attendanceMap[r._id.toString()],
            checkedInAt: attendanceMap[r._id.toString()]?.checkedInAt || null
        }));

        res.json({ total, page: parseInt(page), limit: parseInt(limit), registrations: result });
    } catch (err) {
        next(err);
    }
});

// POST /api/registrations - Public: register for an event
router.post('/', async (req, res, next) => {
    try {
        const { attendeeName, email, phone, organization, eventId } = req.body;

        if (!attendeeName || !email || !eventId) {
            return res.status(400).json({ message: 'Name, email, and event ID are required.' });
        }

        // Check event exists
        const event = await Event.findById(eventId).populate('orgId');
        if (!event) return res.status(404).json({ message: 'Event not found.' });
        if (!event.isPublished) return res.status(400).json({ message: 'Event is not open for registration.' });

        // Check capacity
        const regCount = await Registration.countDocuments({ eventId, status: 'REGISTERED' });
        if (regCount >= event.capacity) {
            return res.status(400).json({ message: 'Event is fully booked.' });
        }

        // Prevent double-registration: one email per event
        const existing = await Registration.findOne({ email: email.toLowerCase(), eventId });
        if (existing) {
            return res.status(409).json({ message: 'You are already registered for this event.' });
        }

        // Create registration first (without QR)
        const registration = await Registration.create({
            attendeeName, email, phone, organization, eventId,
            orgId: event.orgId._id, status: 'REGISTERED'
        });

        // Generate QR code
        const { qrCode, qrData } = await generateQRCode({
            ticketId: registration.ticketId,
            eventId: event._id
        });


        // Upload to Cloudinary (convert base64 data URL to hosted image for reliable email rendering)
        let qrCodeUrl = null;
        try {
            const cloudinary = require('../config/cloudinary');
            const base64String = `data:image/png;base64,${qrCode.replace(/^data:image\/\w+;base64,/, '')}`;
            const uploadRes = await cloudinary.uploader.upload(base64String, {
                folder: 'eventflow/qrcodes',
                public_id: `qr_${registration.ticketId}`,
                resource_type: 'image'
            });
            qrCodeUrl = uploadRes.secure_url;
            console.log(`✅ QR code uploaded: ${qrCodeUrl}`);
        } catch (cloudErr) {
            console.error('⚠️  Cloudinary QR upload failed (email will have no image):', cloudErr.message);
        }

        registration.qrCode = qrCodeUrl || qrCode;
        registration.qrData = qrData;
        await registration.save();

        // Send confirmation email (non-blocking)

        sendRegistrationConfirmation({
            to: email,
            attendeeName,
            eventTitle: event.title,
            eventDate: event.date,
            eventVenue: event.venue,
            qrData: qrData,
            qrCodeUrl: qrCodeUrl
        }).catch(err => console.error('Email error:', err.message));

        res.status(201).json({
            message: 'Registration successful! Check your email for confirmation.',
            ticketId: registration.ticketId,
            qrCode: qrCodeUrl,
            email: registration.email
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/registrations/:eventId - Protected: list registrations for an event
router.get('/:eventId', protect, async (req, res, next) => {
    try {
        const event = await Event.findOne({ _id: req.params.eventId, orgId: req.orgId });
        if (!event) return res.status(404).json({ message: 'Event not found.' });

        const { search, page = 1, limit = 50 } = req.query;
        const filter = { eventId: req.params.eventId };
        if (search) {
            filter.$or = [
                { attendeeName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { organization: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Registration.countDocuments(filter);
        const registrations = await Registration.find(filter)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const Attendance = require('../models/Attendance');
        const attendanceMap = {};
        const attendances = await Attendance.find({ eventId: req.params.eventId });
        attendances.forEach(a => { attendanceMap[a.registrationId.toString()] = a; });

        const result = registrations.map(r => ({
            ...r.toObject(),
            checkedIn: !!attendanceMap[r._id.toString()],
            checkedInAt: attendanceMap[r._id.toString()]?.checkedInAt || null
        }));

        res.json({ total, page: parseInt(page), limit: parseInt(limit), registrations: result });
    } catch (err) {
        next(err);
    }
});

// GET /api/registrations/ticket/:ticketId - Public: get ticket (for QR email links)
router.get('/ticket/:ticketId', async (req, res, next) => {
    try {
        const reg = await Registration.findOne({ ticketId: req.params.ticketId }).populate('eventId');
        if (!reg) return res.status(404).json({ message: 'Registration not found.' });
        res.json({ registration: reg });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
