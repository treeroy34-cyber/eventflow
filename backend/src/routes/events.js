const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { protect, restrictTo, restrictToSuperAdmin } = require('../middleware/auth');

// GET /api/events - Public: list all published events (optionally filter by org)
router.get('/', async (req, res, next) => {
    try {
        const filter = { isPublished: true, status: 'APPROVED' };
        if (req.query.orgSlug) {
            const Organization = require('../models/Organization');
            const org = await Organization.findOne({ slug: req.query.orgSlug });
            if (org) filter.orgId = org._id;
        }
        const events = await Event.find(filter)
            .populate('orgId', 'name slug')
            .populate('createdBy', 'name')
            .sort({ date: 1 });

        // Attach registration count
        const eventsWithCounts = await Promise.all(events.map(async (evt) => {
            const count = await Registration.countDocuments({ eventId: evt._id, status: 'REGISTERED' });
            return { ...evt.toObject(), registrationCount: count };
        }));

        res.json(eventsWithCounts);
    } catch (err) {
        next(err);
    }
});

// GET /api/events/mine - Admin: get own org's events
router.get('/mine', protect, async (req, res, next) => {
    try {
        const events = await Event.find({ orgId: req.orgId })
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        // attach registration count
        const eventsWithCounts = await Promise.all(events.map(async (evt) => {
            const count = await Registration.countDocuments({ eventId: evt._id, status: 'REGISTERED' });
            return { ...evt.toObject(), registrationCount: count };
        }));

        res.json(eventsWithCounts);
    } catch (err) {
        next(err);
    }
});

// GET /api/events/moderation/pending - Super Admin: list all pending events
router.get('/moderation/pending', protect, restrictToSuperAdmin, async (req, res, next) => {
    try {
        const events = await Event.find({ status: 'PENDING' })
            .populate('orgId', 'name slug')
            .populate('createdBy', 'name')
            .sort({ createdAt: 1 });
        res.json(events);
    } catch (err) {
        next(err);
    }
});

// GET /api/events/:id - Public: get single event
router.get('/:id', async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('orgId', 'name slug')
            .populate('createdBy', 'name');
        if (!event) return res.status(404).json({ message: 'Event not found.' });
        const regCount = await Registration.countDocuments({ eventId: event._id, status: 'REGISTERED' });
        res.json({ ...event.toObject(), registrationCount: regCount });
    } catch (err) {
        next(err);
    }
});

// POST /api/events - Admin: create event
router.post('/', protect, restrictTo('ADMIN'), async (req, res, next) => {
    try {
        const { title, description, date, endDate, venue, capacity, image, gallery, category, isPaid, price } = req.body;
        if (!title || !date || !capacity) {
            return res.status(400).json({ message: 'Title, date, and capacity are required.' });
        }
        const event = await Event.create({
            title, description, date, endDate, venue,
            capacity: parseInt(capacity), image, category,
            gallery: Array.isArray(gallery) ? gallery : [],
            isPaid: !!isPaid, price: isPaid ? Number(price) : 0,
            orgId: req.orgId, createdBy: req.user._id
        });
        res.status(201).json(event);
    } catch (err) {
        next(err);
    }
});

// PUT /api/events/:id - Admin: update event
router.put('/:id', protect, restrictTo('ADMIN'), async (req, res, next) => {
    try {
        const event = await Event.findOne({ _id: req.params.id, orgId: req.orgId });
        if (!event) return res.status(404).json({ message: 'Event not found.' });

        const { title, description, date, endDate, venue, capacity, image, gallery, category, isPublished, isPaid, price } = req.body;
        Object.assign(event, {
            title, description, date, endDate, venue, capacity, image, category, isPublished,
            gallery: Array.isArray(gallery) ? gallery : event.gallery,
            isPaid: !!isPaid, price: isPaid ? Number(price) : 0
        });

        // Security: If a standard admin/user edits an event, revert its status to PENDING
        const isUserSuperAdmin = req.user.isSuperAdmin === true || req.user.email === 'tasqrrr315@gmail.com';
        if (!isUserSuperAdmin) {
            event.status = 'PENDING';
        }

        await event.save();
        res.json(event);
    } catch (err) {
        next(err);
    }
});

// DELETE /api/events/:id - Admin: delete event
router.delete('/:id', protect, restrictTo('ADMIN'), async (req, res, next) => {
    try {
        const event = await Event.findOneAndDelete({ _id: req.params.id, orgId: req.orgId });
        if (!event) return res.status(404).json({ message: 'Event not found.' });
        res.json({ message: 'Event deleted successfully.' });
    } catch (err) {
        next(err);
    }
});



// PATCH /api/events/:id/status - Super Admin: Approve or Reject an event
router.patch('/:id/status', protect, restrictToSuperAdmin, async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Choose APPROVED or REJECTED.' });
        }

        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found.' });

        event.status = status;
        await event.save();

        res.json({ message: `Event status updated to ${status}.`, event });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
