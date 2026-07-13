const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    registrationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Registration',
        required: true
    },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    pdfBase64: { type: String, default: '' },
    sentAt: { type: Date },
    generatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Certificate', certificateSchema);
