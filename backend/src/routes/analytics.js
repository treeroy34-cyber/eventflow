const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const { protect } = require('../middleware/auth');

// GET /api/analytics/overview - Org-level overview
router.get('/overview', protect, async (req, res, next) => {
    try {
        const orgId = req.orgId;

        const totalEvents = await Event.countDocuments({ orgId });
        const totalRegistrations = await Registration.countDocuments({ orgId, status: 'REGISTERED' });
        const totalAttendance = await Attendance.countDocuments({ orgId });

        const attendanceRate = totalRegistrations > 0
            ? Math.round((totalAttendance / totalRegistrations) * 100)
            : 0;

        // Monthly registrations (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyRegs = await Registration.aggregate([
            { $match: { orgId: require('mongoose').Types.ObjectId.createFromHexString(orgId.toString()), createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = monthlyRegs.map(m => ({
            month: `${monthNames[m._id.month - 1]} ${m._id.year}`,
            registrations: m.count
        }));

        // Upcoming vs past events
        const now = new Date();
        const upcomingEvents = await Event.countDocuments({ orgId, date: { $gte: now } });
        const pastEvents = await Event.countDocuments({ orgId, date: { $lt: now } });

        // Recent events with stats
        const recentEvents = await Event.find({ orgId }).sort({ createdAt: -1 }).limit(5);
        const recentEventsWithStats = await Promise.all(recentEvents.map(async (evt) => {
            const regCount = await Registration.countDocuments({ eventId: evt._id, status: 'REGISTERED' });
            const attCount = await Attendance.countDocuments({ eventId: evt._id });
            return {
                id: evt._id,
                title: evt.title,
                date: evt.date,
                capacity: evt.capacity,
                status: evt.status,
                registrations: regCount,
                attendance: attCount,
                attendanceRate: regCount > 0 ? Math.round((attCount / regCount) * 100) : 0
            };
        }));

        res.json({
            totalEvents,
            totalRegistrations,
            totalAttendance,
            attendanceRate,
            upcomingEvents,
            pastEvents,
            monthlyData,
            recentEvents: recentEventsWithStats
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/analytics/:eventId - Per-event analytics
router.get('/:eventId', protect, async (req, res, next) => {
    try {
        const event = await Event.findOne({ _id: req.params.eventId, orgId: req.orgId });
        if (!event) return res.status(404).json({ message: 'Event not found.' });

        const totalRegistrations = await Registration.countDocuments({ eventId: event._id, status: 'REGISTERED' });
        const totalAttendance = await Attendance.countDocuments({ eventId: event._id });
        const attendanceRate = totalRegistrations > 0
            ? Math.round((totalAttendance / totalRegistrations) * 100)
            : 0;
        const capacityUsage = Math.round((totalRegistrations / event.capacity) * 100);

        // Registrations over time (daily)
        const registrationsOverTime = await Registration.aggregate([
            { $match: { eventId: event._id } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Organization breakdown
        const orgBreakdown = await Registration.aggregate([
            { $match: { eventId: event._id, organization: { $ne: '' } } },
            { $group: { _id: '$organization', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            event: { id: event._id, title: event.title, date: event.date, capacity: event.capacity, venue: event.venue },
            totalRegistrations,
            totalAttendance,
            attendanceRate,
            capacityUsage,
            spotsLeft: event.capacity - totalRegistrations,
            registrationsOverTime: registrationsOverTime.map(r => ({ date: r._id, count: r.count })),
            orgBreakdown: orgBreakdown.map(o => ({ name: o._id || 'Unknown', value: o.count }))
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
