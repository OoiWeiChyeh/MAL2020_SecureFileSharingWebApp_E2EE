/**
 * Email Notification Service
 * Sends email notifications when system notifications are created
 * 
 * For production: This will call a Cloud Function that uses SendGrid
 * For development: Logs email content (can be tested with email testing services)
 */

/**
 * Send email notification
 * @param {Object} emailData - Email data
 * @param {string} emailData.to - Recipient email
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.htmlBody - HTML email body
 * @param {string} emailData.textBody - Plain text email body (optional)
 */
export const sendEmailNotification = async (emailData) => {
  try {
    // Check if we're in production or development
    const isProduction = window.location.hostname !== 'localhost' &&
      !window.location.hostname.includes('127.0.0.1');

    if (isProduction) {
      // In production, call Cloud Function
      return await sendEmailViaCloudFunction(emailData);
    } else {
      // In development, log the email (for testing)
      console.log('📧 Email Notification (Dev Mode):', {
        to: emailData.to,
        subject: emailData.subject,
        htmlBody: emailData.htmlBody
      });

      // You can also use a service like EmailJS for development testing
      // return await sendEmailViaEmailJS(emailData);

      return { success: true, message: 'Email logged (dev mode)' };
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
    throw error;
  }
};

/**
 * Send email via Cloud Function (production)
 */
const sendEmailViaCloudFunction = async (emailData) => {
  try {
    // Use Firebase Functions SDK
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../firebase');

    const sendEmail = httpsCallable(functions, 'sendEmailNotification');
    const result = await sendEmail(emailData);

    return result.data;
  } catch (error) {
    console.error('Error calling email Cloud Function:', error);
    throw error;
  }
};

/**
 * Generate HTML email template for notifications
 */
export const generateEmailTemplate = (notification, userEmail, userName) => {
  const { type, title, message, fileName, fileId, createdAt } = notification;

  // Get notification type styling
  const getTypeColor = (type) => {
    switch (type) {
      case 'approval':
        return { bg: '#10b981', icon: '✓' };
      case 'rejection':
        return { bg: '#ef4444', icon: '⚠' };
      case 'review_request':
        return { bg: '#3b82f6', icon: '📋' };
      case 'feedback':
        return { bg: '#8b5cf6', icon: '💬' };
      default:
        return { bg: '#6b7280', icon: '🔔' };
    }
  };

  // Escape HTML entities to prevent XSS in email templates
  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const typeStyle = getTypeColor(type);
  const appUrl = window.location.origin;
  const fileUrl = fileId ? `${appUrl}/view/${fileId}` : `${appUrl}/dashboard`;
  const date = createdAt?.toDate ? createdAt.toDate().toLocaleString() : new Date().toLocaleString();

  // Sanitize user-supplied values before HTML interpolation
  const safeTitle = escapeHtml(title);
  const safeUserName = escapeHtml(userName) || 'User';
  const safeFileName = escapeHtml(fileName);
  const safeMessage = escapeHtml(message);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${safeTitle}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, ${typeStyle.bg} 0%, ${typeStyle.bg}dd 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                    ${typeStyle.icon} ${safeTitle}
                  </h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    Hello ${safeUserName},
                  </p>
                  
                  <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                    ${safeMessage}
                  </p>
                  
                  ${safeFileName ? `
                    <div style="background-color: #f9fafb; border-left: 4px solid ${typeStyle.bg}; padding: 16px; margin: 20px 0; border-radius: 4px;">
                      <p style="margin: 0; color: #1f2937; font-size: 14px; font-weight: 600;">
                        📄 File: ${safeFileName}
                      </p>
                    </div>
                  ` : ''}
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${fileUrl}" 
                       style="display: inline-block; background-color: ${typeStyle.bg}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                      View in Dashboard
                    </a>
                  </div>
                  
                  <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 12px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                    This is an automated notification from the Exam Paper Management System.<br>
                    Sent on ${date}
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">
                    You're receiving this email because you have email notifications enabled.<br>
                    <a href="${appUrl}/settings" style="color: #3b82f6; text-decoration: none;">Manage email preferences</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * Generate plain text email version
 */
export const generateTextEmail = (notification, userName) => {
  const { title, message, fileName, fileId } = notification;
  const appUrl = window.location.origin;
  const fileUrl = fileId ? `${appUrl}/view/${fileId}` : `${appUrl}/dashboard`;

  return `
${title}

Hello ${userName || 'User'},

${message}

${fileName ? `File: ${fileName}` : ''}

View in Dashboard: ${fileUrl}

---
This is an automated notification from the Exam Paper Management System.
Manage email preferences: ${appUrl}/settings
  `.trim();
};
