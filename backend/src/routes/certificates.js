const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const { protect, restrictTo } = require('../middleware/auth');
const { generateCertificate } = require('../services/pdfService');
const { sendCertificateEmail } = require('../services/emailService');

// POST /api/certificates/:eventId - Generate & email certificates to all checked-in attendees
router.post('/:eventId', protect, restrictTo('ADMIN'), async (req, res, next) => {
    try {
        const event = await Event.findOne({ _id: req.params.eventId, orgId: req.orgId })
            .populate('orgId', 'name');
        if (!event) return res.status(404).json({ message: 'Event not found.' });

        const attendances = await Attendance.find({ eventId: event._id })
            .populate({ path: 'registrationId', model: 'Registration' });

        if (attendances.length === 0) {
            return res.status(400).json({ message: 'No checked-in attendees found.' });
        }

        let generated = 0;
        let failed = 0;

        for (const att of attendances) {
            try {
                const reg = att.registrationId;

                // Check if certificate already issued
                const existing = await Certificate.findOne({ registrationId: reg._id });

                const pdfBuffer = await generateCertificate({
                    attendeeName: reg.attendeeName,
                    eventTitle: event.title,
                    eventDate: event.date,
                    orgName: event.orgId.name
                });

                if (!existing) {
                    await Certificate.create({
                        registrationId: reg._id,
                        eventId: event._id,
                        orgId: req.orgId,
                        sentAt: new Date()
                    });
                }

                await sendCertificateEmail({
                    to: reg.email,
                    attendeeName: reg.attendeeName,
                    eventTitle: event.title,
                    pdfBuffer
                });

                generated++;
            } catch (e) {
                console.error('Certificate error for attendee:', e.message);
                failed++;
            }
        }

        res.json({ message: `Certificates sent: ${generated}, Failed: ${failed}` });
    } catch (err) {
        next(err);
    }
});

// GET /api/certificates/:eventId/download/:registrationId - Download a single certificate as PDF
router.get('/:eventId/download/:registrationId', protect, async (req, res, next) => {
    try {
        const event = await Event.findOne({ _id: req.params.eventId, orgId: req.orgId }).populate('orgId', 'name');
        if (!event) return res.status(404).json({ message: 'Event not found.' });

        const reg = await Registration.findOne({ _id: req.params.registrationId, eventId: event._id });
        if (!reg) return res.status(404).json({ message: 'Registration not found.' });

        const attendance = await Attendance.findOne({ registrationId: reg._id });
        if (!attendance) return res.status(400).json({ message: 'Attendee was not checked in.' });

        const pdfBuffer = await generateCertificate({
            attendeeName: reg.attendeeName,
            eventTitle: event.title,
            eventDate: event.date,
            orgName: event.orgId.name
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="certificate_${reg.attendeeName.replace(/\s+/g, '_')}.pdf"`);
        res.send(pdfBuffer);
    } catch (err) {
        next(err);
    }
});

// GET /api/certificates/:eventId - List issued certificates
router.get('/:eventId', protect, async (req, res, next) => {
    try {
        const event = await Event.findOne({ _id: req.params.eventId, orgId: req.orgId });
        if (!event) return res.status(404).json({ message: 'Event not found.' });

        const certs = await Certificate.find({ eventId: event._id })
            .populate({ path: 'registrationId', select: 'attendeeName email' });
        res.json(certs);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
