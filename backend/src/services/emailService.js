const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY not set — emails will be logged to console only.');
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
};

const FROM = process.env.EMAIL_FROM || 'EventFlow <onboarding@resend.dev>';

/**
 * Sends an email via Resend. Falls back to console.log in dev if key is not set.
 * Also always writes to a local preview file for easy student presentation/demo.
 */
const sendEmail = async ({ to, subject, html, attachments }) => {
  // Always write to a local HTML file for project demonstrations
  try {
    const publicDir = path.join(__dirname, '../../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Choose file name based on subject to differentiate ticket, check-in, reminder
    let fileName = 'last-ticket-preview.html';
    if (subject.includes('Checked in')) {
      fileName = 'last-checkin-preview.html';
    } else if (subject.includes('Reminder')) {
      fileName = 'last-reminder-preview.html';
    } else if (subject.includes('Certificate')) {
      fileName = 'last-certificate-preview.html';
    }
    
    fs.writeFileSync(path.join(publicDir, fileName), html, 'utf8');
    console.log(`🖥️  Local email preview saved to: http://localhost:5005/${fileName}`);
  } catch (fsErr) {
    console.error('⚠️  Failed to save local email preview:', fsErr.message);
  }

  const resend = getResend();
  if (!resend) {
    console.log(`\n📧 [DEV EMAIL - would send to ${to}]\nSubject: ${subject}\n`);
    return;
  }

  try {
    const payload = { from: FROM, to, subject, html };
    if (attachments) payload.attachments = attachments;

    const { data, error } = await resend.emails.send(payload);
    if (error) {
      console.warn(`⚠️  Resend delivery failed (Sandbox restriction or configuration): ${error.message}`);
    } else {
      console.log(`📧 Email sent to ${to} — id: ${data.id}`);
    }
  } catch (err) {
    console.warn(`⚠️  Resend exception: ${err.message}`);
  }
};

// ─── Email Templates ────────────────────────────────────────────────────────

/**
 * Registration confirmation email with absolute URL QR code.
 */
const sendRegistrationConfirmation = async ({ to, attendeeName, eventTitle, eventDate, eventVenue, qrData, qrCodeUrl }) => {
  const dateStr = new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  let ticketId;
  try {
    const parsed = JSON.parse(qrData);
    ticketId = parsed.ticketId || parsed.registrationId;
  } catch {
    ticketId = qrData; // Handle the new simple 5-char alphanumeric format
  }

  const attachments = qrCodeUrl ? [{
    filename: `QR_Ticket_${ticketId}.png`,
    path: qrCodeUrl
  }] : undefined;

  await sendEmail({
    to,
    subject: `🎫 You're registered for ${eventTitle}!`,
    attachments,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a12;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#11111e;border-radius:16px;overflow:hidden;border:1px solid rgba(124,58,237,0.3);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);padding:36px 32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">🎉</div>
      <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;">Registration Confirmed!</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:15px;">Your spot is secured</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="font-size:16px;color:#e2e8f0;margin:0 0 8px;">Hi <strong style="color:#a78bfa">${attendeeName}</strong>,</p>
      <p style="font-size:14px;color:#94a3b8;margin:0 0 24px;">You've successfully registered for the event below.</p>

      <!-- Event Card -->
      <div style="background:#1e1b4b;border:1px solid #4f46e5;border-radius:12px;padding:20px;margin-bottom:24px;">
        <h2 style="margin:0 0 12px;color:#a78bfa;font-size:20px;">${eventTitle}</h2>
        <p style="margin:6px 0;color:#c4b5fd;font-size:14px;">📅 <strong>${dateStr}</strong></p>
        ${eventVenue ? `<p style="margin:6px 0;color:#c4b5fd;font-size:14px;">📍 <strong>${eventVenue}</strong></p>` : ''}
        <p style="margin:6px 0;color:#94a3b8;font-size:12px;">Registration ID: <code style="background:rgba(124,58,237,0.2);padding:2px 6px;border-radius:4px;color:#a78bfa;">${ticketId}</code></p>
      </div>

      <!-- QR Code Section -->
      <div style="text-align:center;background:#0f0f1a;border:2px dashed rgba(124,58,237,0.4);border-radius:16px;padding:28px;margin-bottom:24px;">
        <p style="margin:0 0 16px;color:#a78bfa;font-size:15px;font-weight:700;">📱 Your Entry QR Code</p>
        ${qrCodeUrl ? `<img src="${qrCodeUrl}" alt="QR Code for ${eventTitle}" width="200" height="200" style="border-radius:12px;background:#ffffff;padding:12px;display:block;margin:0 auto;" />` : ''}
        <p style="margin:20px 0 0;color:#64748b;font-size:12px;">Show this QR code at the entrance for check-in</p>
        <p style="margin:4px 0 0;color:#64748b;font-size:12px;">We've also attached a high-quality copy to this email for you to save!</p>
      </div>

      <!-- Tips -->
      <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;color:#34d399;font-size:13px;font-weight:700;">✅ What to bring:</p>
        <ul style="margin:8px 0 0;padding-left:20px;color:#94a3b8;font-size:13px;line-height:1.8;">
          <li>This email (open on phone or printed)</li>
          <li>A valid photo ID</li>
        </ul>
      </div>

      <p style="margin:0;color:#475569;font-size:12px;text-align:center;">
        You'll receive a reminder email 24 hours and 1 hour before the event.<br/>
        Powered by <strong style="color:#7c3aed;">EventFlow</strong>
      </p>
    </div>
  </div>
</body>
</html>`
  });
};

/**
 * Check-in confirmation email sent after scanning.
 */
const sendCheckInConfirmation = async ({ to, attendeeName, eventTitle, checkedInAt }) => {
  const timeStr = new Date(checkedInAt).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  await sendEmail({
    to,
    subject: `✅ Checked in to ${eventTitle}`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a12;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#11111e;border-radius:16px;overflow:hidden;border:1px solid rgba(16,185,129,0.3);">
    <div style="background:linear-gradient(135deg,#059669,#047857);padding:32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">✅</div>
      <h1 style="margin:0;color:#fff;font-size:24px;">Welcome! You're checked in.</h1>
    </div>
    <div style="padding:28px;">
      <p style="color:#e2e8f0;font-size:16px;">Hi <strong style="color:#34d399">${attendeeName}</strong>,</p>
      <p style="color:#94a3b8;font-size:14px;">Your attendance at <strong style="color:#e2e8f0">${eventTitle}</strong> has been recorded.</p>
      <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:16px;margin:20px 0;">
        <p style="margin:0;color:#34d399;font-size:13px;">⏰ Check-in time: <strong>${timeStr}</strong></p>
      </div>
      <p style="color:#475569;font-size:12px;text-align:center;">Enjoy the event! — <strong style="color:#7c3aed;">EventFlow</strong></p>
    </div>
  </div>
</body>
</html>`
  });
};

/**
 * Event reminder email (24h or 1h before event).
 */
const sendEventReminder = async ({ to, attendeeName, eventTitle, eventDate, eventVenue, hoursLeft }) => {
  const dateStr = new Date(eventDate).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  await sendEmail({
    to,
    subject: `⏰ Reminder: ${eventTitle} starts in ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}!`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a12;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#11111e;border-radius:16px;overflow:hidden;border:1px solid rgba(245,158,11,0.3);">
    <div style="background:linear-gradient(135deg,#d97706,#b45309);padding:32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">⏰</div>
      <h1 style="margin:0;color:#fff;font-size:24px;">Event Starting Soon!</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:15px;">In ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}</p>
    </div>
    <div style="padding:28px;">
      <p style="color:#e2e8f0;font-size:16px;">Hi <strong style="color:#fbbf24">${attendeeName}</strong>,</p>
      <div style="background:#1e1b4b;border:1px solid #4f46e5;border-radius:12px;padding:20px;margin:20px 0;">
        <h2 style="margin:0 0 10px;color:#a78bfa;font-size:18px;">${eventTitle}</h2>
        <p style="margin:4px 0;color:#c4b5fd;font-size:14px;">📅 <strong>${dateStr}</strong></p>
        ${eventVenue ? `<p style="margin:4px 0;color:#c4b5fd;font-size:14px;">📍 <strong>${eventVenue}</strong></p>` : ''}
      </div>
      <p style="color:#94a3b8;font-size:13px;">Don't forget to bring this email for QR check-in. See you there!</p>
      <p style="color:#475569;font-size:12px;text-align:center;">— <strong style="color:#7c3aed;">EventFlow</strong></p>
    </div>
  </div>
</body>
</html>`
  });
};

/**
 * Certificate delivery email with PDF attachment.
 */
const sendCertificateEmail = async ({ to, attendeeName, eventTitle, pdfBuffer }) => {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a12;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#11111e;border-radius:16px;overflow:hidden;border:1px solid rgba(124,58,237,0.3);">
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">🏆</div>
      <h1 style="margin:0;color:#fff;font-size:24px;">Certificate of Participation</h1>
    </div>
    <div style="padding:28px;">
      <p style="color:#e2e8f0;font-size:16px;">Hi <strong style="color:#a78bfa">${attendeeName}</strong>,</p>
      <p style="color:#94a3b8;font-size:14px;">Congratulations on attending <strong style="color:#e2e8f0">${eventTitle}</strong>! Your certificate of participation is attached to this email as a PDF.</p>
      <p style="color:#475569;font-size:12px;text-align:center;margin-top:24px;">Thank you for attending! — <strong style="color:#7c3aed;">EventFlow</strong></p>
    </div>
  </div>
</body>
</html>`;

  // Always write HTML and PDF locally for presentation/demo
  try {
    const publicDir = path.join(__dirname, '../../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicDir, 'last-certificate-preview.html'), html, 'utf8');
    fs.writeFileSync(path.join(publicDir, 'last-certificate-preview.pdf'), pdfBuffer);
    console.log(`🖥️  Local certificate HTML saved to: http://localhost:5005/last-certificate-preview.html`);
    console.log(`📄 Local certificate PDF saved to: http://localhost:5005/last-certificate-preview.pdf`);
  } catch (fsErr) {
    console.error('⚠️  Failed to save local certificate files:', fsErr.message);
  }

  const resend = getResend();
  if (!resend) {
    console.log(`[DEV] Certificate email would be sent to ${to}`);
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `🏆 Your Certificate – ${eventTitle}`,
      html,
      attachments: [{
        filename: `certificate_${eventTitle.replace(/\s+/g, '_')}.pdf`,
        content: pdfBuffer.toString('base64')
      }]
    });
    if (error) {
      console.warn(`⚠️  Resend certificate delivery failed: ${error.message}`);
    } else {
      console.log(`📧 Certificate sent to ${to}`);
    }
  } catch (err) {
    console.warn(`⚠️  Resend certificate exception: ${err.message}`);
  }
};

module.exports = {
  sendRegistrationConfirmation,
  sendCheckInConfirmation,
  sendEventReminder,
  sendCertificateEmail
};
