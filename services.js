import { transporter } from '../config/nodemailerConfig.js'; // Use named import and add .js extension

/**
 * Sends a welcome email to a newly registered user.
 * @param {string} recipientEmail - The email address of the new user.
 * @param {string} username - The username or name of the new user.
 * @returns {Promise<boolean>} - True if email sent successfully, false otherwise.
 */
async function sendWelcomeEmail(recipientEmail, username) {
  // Ensure process.env.APP_BASE_URL is loaded (usually in your main entry file)
  // Ensure process.env.SMTP_USER is loaded
  const mailOptions = {
    from: `"Your Awesome App" <${process.env.SMTP_USER}>`, // Sender address, often your support email
    to: recipientEmail, // List of recipients
    subject: 'Welcome to Our Awesome App! 🎉', // Subject line
    // HTML body for rich email content
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0056b3;">Welcome, ${username}!</h2>
        <p>Thank you for registering on Our Awesome App. We're thrilled to have you onboard!</p>
        <p>You can now log in and start exploring all the amazing features:</p>
        <p style="text-align: center; margin: 20px 0;">
          <a href="${process.env.APP_BASE_URL}/login" style="display: inline-block; padding: 12px 25px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Log In to Your Account
          </a>
        </p>
        <p>If you have any questions or need assistance, please don't hesitate to reply to this email.</p>
        <p>Best regards,<br>The Awesome App Team</p>
      </div>
    `,
    // Plain text body for email clients that don't display HTML
    text: `
      Welcome, ${username}!

      Thank you for registering on Our Awesome App. We're thrilled to have you onboard!

      You can now log in and start exploring:
      ${process.env.APP_BASE_URL}/login

      If you have any questions or need assistance, please don't hesitate to reply to this email.

      Best regards,
      The Awesome App Team
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent: %s', info.messageId);
    // You can use nodemailer.getTestMessageUrl(info) if using Ethereal.email for testing
    // console.log('Preview URL (Ethereal): %s', nodemailer.getTestMessageUrl(info));
    return true; // Indicate success
  } catch (error) {
    console.error('Error sending welcome email to %s:', recipientEmail, error);
    return false; // Indicate failure
  }
}

// You can add more email sending functions here, e.g.:
// async function sendPasswordResetEmail(...) { ... }
// async function sendOrderConfirmationEmail(...) { ... }

// Corrected export for ES Modules
export {
  sendWelcomeEmail,
};