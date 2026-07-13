const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true, unique: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    checkedInAt: { type: Date, default: Date.now },
    method: { type: String, enum: ['QR', 'MANUAL'], default: 'QR' }
}, { timestamps: true });

// unique: true on registrationId prevents double check-in at DB level
attendanceSchema.index({ eventId: 1, checkedInAt: -1 });
attendanceSchema.index({ orgId: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
