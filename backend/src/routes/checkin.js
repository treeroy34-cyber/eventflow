const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');
const { sendCheckInConfirmation } = require('../services/emailService');

// POST /api/checkin - Check in via QR data or registrationId
router.post('/', protect, async (req, res, next) => {
    try {
        const { qrData, registrationId: directId, eventId } = req.body;

        let regId;
        if (qrData) {
            try {
                // Backward compatibility: try parsing as JSON (old highly-dense QR format)
                const parsed = JSON.parse(qrData);
                regId = parsed.ticketId || parsed.registrationId;
            } catch {
                // New format: it's just a raw 5-char string!
                regId = qrData.toString().trim();
            }
        } else if (directId) {
            regId = directId;
        } else {
            return res.status(400).json({ message: 'QR data or registration ID is required.' });
        }

        let regQuery = {};
        if (regId.length === 5) {
            regQuery = { ticketId: regId };
        } else {
            regQuery = { _id: regId };
        }

        const registration = await Registration.findOne(regQuery).populate('eventId');
        if (!registration) return res.status(404).json({ message: 'Registration not found (Invalid Ticket ID).' });

        // Ensure event belongs to this org
        const event = await Event.findOne({ _id: registration.eventId._id, orgId: req.orgId });
        if (!event) return res.status(403).json({ message: 'This registration does not belong to your organization.' });

        // CRITICAL FIX: Ensure the ticket being scanned is actually for the specific event we are currently managing!
        if (eventId && registration.eventId._id.toString() !== eventId) {
            return res.status(400).json({ message: `Invalid Ticket! This ticket is for a different event: "${registration.eventId.title}".` });
        }

        // Check already checked in
        const existing = await Attendance.findOne({ registrationId: registration._id });
        if (existing) {
            return res.status(409).json({
                message: 'Already checked in.',
                attendeeName: registration.attendeeName,
                checkedInAt: existing.checkedInAt,
                alreadyCheckedIn: true
            });
        }

        const attendance = await Attendance.create({
            registrationId: registration._id,
            eventId: event._id,
            orgId: req.orgId,
            checkedInBy: req.user._id
        });

        // Send check-in confirmation email (non-blocking)
        sendCheckInConfirmation({
            to: registration.email,
            attendeeName: registration.attendeeName,
            eventTitle: event.title,
            checkedInAt: attendance.checkedInAt
        }).catch(err => console.error('Email error:', err.message));

        res.json({
            message: 'Check-in successful!',
            attendeeName: registration.attendeeName,
            email: registration.email,
            checkedInAt: attendance.checkedInAt
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/checkin/:eventId - Get attendance list for an event
router.get('/:eventId', protect, async (req, res, next) => {
    try {
        const event = await Event.findOne({ _id: req.params.eventId, orgId: req.orgId });
        if (!event) return res.status(404).json({ message: 'Event not found.' });

        const attendance = await Attendance.find({ eventId: req.params.eventId })
            .populate({ path: 'registrationId', select: 'attendeeName email phone organization' })
            .populate({ path: 'checkedInBy', select: 'name' })
            .sort({ checkedInAt: -1 });

        res.json(attendance);
    } catch (err) {
        next(err);
    }
});

// PUT /api/checkin/:ticketId - SRS-spec alias: check in via manual ticket ID in URL
router.put('/:id', protect, async (req, res, next) => {
    try {
        const regId = req.params.id;

        let regQuery = {};
        if (regId.length === 5) {
            regQuery = { ticketId: regId };
        } else {
            regQuery = { _id: regId };
        }

        const registration = await Registration.findOne(regQuery).populate('eventId');
        if (!registration) return res.status(404).json({ message: 'Registration not found (Invalid Ticket ID).' });

        const event = await Event.findOne({ _id: registration.eventId._id, orgId: req.orgId });
        if (!event) return res.status(403).json({ message: 'This registration does not belong to your organization.' });

        const existing = await Attendance.findOne({ registrationId: registration._id });
        if (existing) {
            return res.status(409).json({
                message: 'Already checked in.',
                attendeeName: registration.attendeeName,
                checkedInAt: existing.checkedInAt,
                checkInStatus: true,
                alreadyCheckedIn: true
            });
        }

        const attendance = await Attendance.create({
            registrationId: registration._id,
            eventId: event._id,
            orgId: req.orgId,
            checkedInBy: req.user._id
        });

        const { sendCheckInConfirmation } = require('../services/emailService');
        sendCheckInConfirmation({
            to: registration.email,
            attendeeName: registration.attendeeName,
            eventTitle: event.title,
            checkedInAt: attendance.checkedInAt
        }).catch(err => console.error('Email error:', err.message));

        res.json({
            message: 'Check-in successful!',
            attendeeName: registration.attendeeName,
            email: registration.email,
            checkInStatus: true,
            checkedInAt: attendance.checkedInAt
        });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/checkin/:attendanceId - Undo check-in (Admin only)
router.delete('/:attendanceId', protect, async (req, res, next) => {
    try {
        const attendance = await Attendance.findOneAndDelete({ _id: req.params.attendanceId, orgId: req.orgId });
        if (!attendance) return res.status(404).json({ message: 'Attendance record not found.' });
        res.json({ message: 'Check-in undone.' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
