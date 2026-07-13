const QRCode = require('qrcode');

/**
 * Generate a scannable QR code as a base64 data URL.
 * Uses high error correction and standard black-on-white for universal scanner support.
 *
 * @param {{ ticketId: string, eventId: string }} payload
 * @returns {Promise<{ qrCode: string, qrData: string }>}
 */
const generateQRCode = async (payload) => {
    // Simplify qrData to JUST the 5-char ticket ID to ensure maximum readability and minimum density
    const qrData = payload.ticketId;

    // Use lower error correction ('M') to vastly increase block sizes for easy scanning off shiny screens
    const qrCode = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
    });

    return { qrCode, qrData };
};

module.exports = { generateQRCode };
