/**
 * Firebase Cloud Functions
 * 
 * To deploy:
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Login: firebase login
 * 3. Install functions dependencies: cd functions && npm install
 * 4. Deploy: firebase deploy --only functions
 * 
 * Make sure you have:
 * - Firebase Blaze plan (pay-as-you-go)
 * - SendGrid API key set in Firebase config
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

// Initialize Firebase Admin
admin.initializeApp();

// Set SendGrid API key from Firebase config
// Set via: firebase functions:config:set sendgrid.key="YOUR_API_KEY"
const sendgridKey = functions.config().sendgrid?.key || process.env.SENDGRID_API_KEY;

if (!sendgridKey) {
  console.error('⚠️ SendGrid API key not set! Emails will not be sent.');
  console.error('Set it via: firebase functions:config:set sendgrid.key="YOUR_API_KEY"');
} else {
  sgMail.setApiKey(sendgridKey);
  console.log('✅ SendGrid API key configured');
}

/**
 * Cloud Function: Send Email Notification
 * Called from the frontend when a notification is created
 */
exports.sendEmailNotification = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to send emails'
    );
  }

  const { to, subject, htmlBody, textBody } = data;

  // Validate input
  if (!to || !subject || !htmlBody) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required email fields'
    );
  }

  try {
    // Get user's email preferences
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();

    // Check if user has email notifications enabled
    if (userData?.emailNotificationsEnabled === false) {
      console.log(`Email notifications disabled for user ${context.auth.uid}`);
      return { success: false, message: 'Email notifications disabled by user' };
    }

    // Send email via SendGrid
    // IMPORTANT: The "from" email must be verified in SendGrid
    // Go to SendGrid Dashboard → Settings → Sender Authentication → Verify a Single Sender
    // Use YOUR PERSONAL EMAIL that you can verify (e.g., yourname@gmail.com)
    const fromEmail = functions.config().sendgrid?.from_email ||
      process.env.SENDGRID_FROM_EMAIL;

    if (!fromEmail) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'SendGrid from_email not configured. Set it via: firebase functions:config:set sendgrid.from_email="your-email@example.com"'
      );
    }

    const msg = {
      to: to,
      from: {
        email: fromEmail,
        name: 'Exam Paper Management System'
      },
      subject: subject,
      html: htmlBody,
      text: textBody || htmlBody.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    await sgMail.send(msg);

    console.log(`Email sent successfully to ${to}`);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);

    // Handle SendGrid errors
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to send email',
      error.message
    );
  }
});

/**
 * Cloud Function: Trigger on Notification Creation
 * Automatically sends email when a notification is created in Firestore
 */
exports.onNotificationCreated = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    const notificationId = context.params.notificationId;

    try {
      // Get user data to get email address
      const userDoc = await admin.firestore().collection('users').doc(notification.userId).get();

      if (!userDoc.exists) {
        console.log(`User ${notification.userId} not found`);
        return null;
      }

      const userData = userDoc.data();
      const userEmail = userData.email || userData.userEmail;

      if (!userEmail) {
        console.log(`No email found for user ${notification.userId}`);
        return null;
      }

      // Check if user has email notifications enabled
      if (userData.emailNotificationsEnabled === false) {
        console.log(`Email notifications disabled for user ${notification.userId}`);
        return null;
      }

      // Generate email content
      const subject = notification.title || 'New Notification';
      const htmlBody = generateEmailHTML(notification, userData);
      const textBody = generateEmailText(notification, userData);

      // Send email
      // IMPORTANT: The "from" email must be verified in SendGrid
      const fromEmail = functions.config().sendgrid?.from_email || process.env.SENDGRID_FROM_EMAIL;

      if (!fromEmail) {
        console.error('SendGrid from_email not configured. Set it via: firebase functions:config:set sendgrid.from_email="your-email@example.com"');
        return null;
      }

      const msg = {
        to: userEmail,
        from: {
          email: fromEmail,
          name: 'Exam Paper Management System'
        },
        subject: subject,
        html: htmlBody,
        text: textBody
      };

      await sgMail.send(msg);

      // Update notification to mark email as sent
      await admin.firestore().collection('notifications').doc(notificationId).update({
        emailSent: true,
        emailSentAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Email notification sent to ${userEmail} for notification ${notificationId}`);
      return null;
    } catch (error) {
      console.error(`Error sending email for notification ${notificationId}:`, error);

      // Mark email as failed
      await admin.firestore().collection('notifications').doc(notificationId).update({
        emailSent: false,
        emailError: error.message
      });

      return null;
    }
  });

/**
 * Generate HTML email template
 */
function generateEmailHTML(notification, userData) {
  const { type, title, message, fileName } = notification;
  const userName = userData.displayName || userData.name || 'User';
  const appUrl = 'https://file-share-f8260.web.app';

  // Escape HTML entities to prevent XSS
  const esc = (str) => str ? String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;') : '';

  const safeTitle = esc(title);
  const safeMessage = esc(message);
  const safeFileName = esc(fileName);
  const safeUserName = esc(userName);

  const getTypeColor = (type) => {
    switch (type) {
      case 'approval': return '#10b981';
      case 'rejection': return '#ef4444';
      case 'review_request': return '#3b82f6';
      case 'feedback': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const color = getTypeColor(type);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="background: ${color}; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${safeTitle}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">Hello ${safeUserName},</p>
                  <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">${safeMessage}</p>
                  ${safeFileName ? `<div style="background-color: #f9fafb; border-left: 4px solid ${color}; padding: 16px; margin: 20px 0; border-radius: 4px;"><p style="margin: 0; color: #1f2937; font-size: 14px; font-weight: 600;">📄 File: ${safeFileName}</p></div>` : ''}
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${appUrl}/dashboard" style="display: inline-block; background-color: ${color}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">View in Dashboard</a>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">You're receiving this email because you have email notifications enabled.<br><a href="${appUrl}/settings" style="color: #3b82f6; text-decoration: none;">Manage email preferences</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Generate plain text email
 */
function generateEmailText(notification, userData) {
  const { title, message, fileName } = notification;
  const userName = userData.displayName || userData.name || 'User';
  const appUrl = 'https://file-share-f8260.web.app';

  return `
${title}

Hello ${userName},

${message}

${fileName ? `File: ${fileName}` : ''}

View in Dashboard: ${appUrl}/dashboard

---
This is an automated notification from the Exam Paper Management System.
Manage email preferences: ${appUrl}/settings
  `.trim();
}
