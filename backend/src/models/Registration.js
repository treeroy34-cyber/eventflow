const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const registrationSchema = new mongoose.Schema({
    attendeeName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    organization: { type: String, default: '' },
    ticketId: {
        type: String,
        required: true,
        unique: true,
        default: () => nanoid(5).toUpperCase()
    },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    status: { type: String, enum: ['REGISTERED', 'CANCELLED', 'WAITLISTED'], default: 'REGISTERED' },
    qrCode: { type: String }, // base64 data URL
    qrData: { type: String }, // raw JSON string encoded in QR
    cancelledAt: { type: Date }
}, { timestamps: true });

// Prevent double-registration: one email per event
registrationSchema.index({ email: 1, eventId: 1 }, { unique: true });
// Fast lookups by org and event
registrationSchema.index({ orgId: 1, createdAt: -1 });
registrationSchema.index({ eventId: 1, status: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
