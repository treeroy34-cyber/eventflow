const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const { protect } = require('../middleware/auth');
const { Parser } = require('json2csv');

// GET /api/reports/:eventId/csv - Export registrations + attendance as CSV (using json2csv)
router.get('/:eventId/csv', protect, async (req, res, next) => {
    try {
        const event = await Event.findOne({ _id: req.params.eventId, orgId: req.orgId });
        if (!event) return res.status(404).json({ message: 'Event not found.' });

        const registrations = await Registration.find({ eventId: event._id }).sort({ createdAt: 1 });
        const attendances = await Attendance.find({ eventId: event._id });

        const attendanceMap = {};
        attendances.forEach(a => { attendanceMap[a.registrationId.toString()] = a.checkedInAt; });

        const data = registrations.map((r, i) => ({
            '#': i + 1,
            Name: r.attendeeName,
            Email: r.email,
            Phone: r.phone || '',
            Organization: r.organization || '',
            'Registered At': new Date(r.createdAt).toLocaleString(),
            'Checked In': attendanceMap[r._id.toString()] ? 'Yes' : 'No',
            'Check-In Time': attendanceMap[r._id.toString()]
                ? new Date(attendanceMap[r._id.toString()]).toLocaleString()
                : '',
            checkInStatus: !!attendanceMap[r._id.toString()]
        }));

        const fields = ['#', 'Name', 'Email', 'Phone', 'Organization', 'Registered At', 'Checked In', 'Check-In Time'];
        const parser = new Parser({ fields });
        const csv = parser.parse(data);

        const filename = `${event.title.replace(/\s+/g, '_')}_registrations.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (err) {
        next(err);
    }
});

// GET /api/reports/:eventId/attendance-csv - Export only checked-in attendees
router.get('/:eventId/attendance-csv', protect, async (req, res, next) => {
    try {
        const event = await Event.findOne({ _id: req.params.eventId, orgId: req.orgId });
        if (!event) return res.status(404).json({ message: 'Event not found.' });

        const attendances = await Attendance.find({ eventId: event._id })
            .populate({ path: 'registrationId', model: 'Registration' })
            .sort({ checkedInAt: 1 });

        const data = attendances.map((a, i) => ({
            '#': i + 1,
            Name: a.registrationId.attendeeName,
            Email: a.registrationId.email,
            Phone: a.registrationId.phone || '',
            Organization: a.registrationId.organization || '',
            'Check-In Time': new Date(a.checkedInAt).toLocaleString()
        }));

        const fields = ['#', 'Name', 'Email', 'Phone', 'Organization', 'Check-In Time'];
        const parser = new Parser({ fields });
        const csv = parser.parse(data);

        const filename = `${event.title.replace(/\s+/g, '_')}_attendance.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (err) {
        next(err);
    }
});

// GET /api/reports/:eventId/organizations - Get organization registrations & attendance stats
router.get('/:eventId/organizations', protect, async (req, res, next) => {
    try {
        const event = await Event.findOne({ _id: req.params.eventId, orgId: req.orgId });
        if (!event) return res.status(404).json({ message: 'Event not found.' });

        const orgStats = await Registration.aggregate([
            { $match: { eventId: require('mongoose').Types.ObjectId.createFromHexString(event._id.toString()), status: 'REGISTERED' } },
            // Lookup attendance
            {
                $lookup: {
                    from: 'attendances',
                    localField: '_id',
                    foreignField: 'registrationId',
                    as: 'attendance'
                }
            },
            {
                $group: {
                    _id: '$organization',
                    registrations: { $sum: 1 },
                    checkins: {
                        $sum: { $cond: [{ $gt: [{ $size: '$attendance' }, 0] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    name: { $cond: [{ $eq: ['$_id', ''] }, 'Unspecified / Individual', '$_id'] },
                    registrations: 1,
                    checkins: 1,
                    rate: {
                        $round: [
                            { $multiply: [{ $divide: ['$checkins', '$registrations'] }, 100] },
                            0
                        ]
                    }
                }
            },
            { $sort: { registrations: -1 } }
        ]);

        res.json(orgStats);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
