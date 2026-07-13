const { jsPDF } = require("jspdf");

/**
 * Generate certificate PDF as a Buffer using jsPDF (Server-side)
 */
const generateCertificate = ({ attendeeName, eventTitle, eventDate, orgName }) => {
    return new Promise((resolve) => {
        // Create landscape A4 document
        // jsPDF uses points (pt) by default. A4 landscape is 841.89 x 595.28 pt
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'pt',
            format: 'a4'
        });

        const width = doc.internal.pageSize.getWidth();
        const height = doc.internal.pageSize.getHeight();

        // Background
        doc.setFillColor('#0f0f1a');
        doc.rect(0, 0, width, height, 'F');

        // Border gradient simulation (outer frame)
        doc.setDrawColor('#7c3aed');
        doc.setLineWidth(4);
        doc.rect(20, 20, width - 40, height - 40, 'S');

        doc.setDrawColor('#4f46e5');
        doc.setLineWidth(1);
        doc.rect(28, 28, width - 56, height - 56, 'S');

        // Header
        doc.setTextColor('#a78bfa');
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(orgName || 'EventFlow', width / 2, 65, { align: 'center' });

        doc.setTextColor('#ffffff');
        doc.setFontSize(30);
        doc.setFont("helvetica", "bold");
        doc.text('CERTIFICATE OF PARTICIPATION', width / 2, 100, { align: 'center' });

        // Decorative line
        doc.setDrawColor('#7c3aed');
        doc.setLineWidth(2);
        doc.line(100, 145, width - 100, 145);

        // Body text
        doc.setTextColor('#94a3b8');
        doc.setFontSize(16);
        doc.setFont("helvetica", "normal");
        doc.text('This is to certify that', width / 2, 185, { align: 'center' });

        // Attendee name
        doc.setTextColor('#c4b5fd');
        doc.setFontSize(40);
        doc.setFont("helvetica", "bold");
        doc.text(attendeeName, width / 2, 235, { align: 'center' });

        doc.setTextColor('#94a3b8');
        doc.setFontSize(16);
        doc.setFont("helvetica", "normal");
        doc.text('has successfully participated in', width / 2, 285, { align: 'center' });

        // Event title
        doc.setTextColor('#ffffff');
        doc.setFontSize(26);
        doc.setFont("helvetica", "bold");
        doc.text(eventTitle, width / 2, 330, { align: 'center' });

        // Date
        doc.setTextColor('#94a3b8');
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        const dateStr = new Date(eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.text(`Held on ${dateStr}`, width / 2, 380, { align: 'center' });

        // Decorative line
        doc.setDrawColor('#4f46e5');
        doc.setLineWidth(1);
        doc.line(100, 415, width - 100, 415);

        // Footer
        doc.setTextColor('#6b7280');
        doc.setFontSize(11);
        doc.text('Issued by EventFlow — Digital Event Management Platform', width / 2, 445, { align: 'center' });

        // Output to Buffer
        const pdfArrayBuffer = doc.output('arraybuffer');
        resolve(Buffer.from(pdfArrayBuffer));
    });
};

module.exports = { generateCertificate };
