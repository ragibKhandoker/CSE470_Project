const nodemailer = require('nodemailer');

/**
 * Send email via Nodemailer (Gmail SMTP or Ethereal test inbox)
 */
const sendOtpEmail = async (toEmail, otpCode) => {
  let transporter;

  // Use configured SMTP credentials or fallback to Gmail / Ethereal
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER.trim(),
        pass: process.env.SMTP_PASS.replace(/\s+/g, '')
      }
    });
  } else {
    // Generate Ethereal test account if credentials aren't set
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  const mailOptions = {
    from: '"ShareMeal Security" <no-reply@sharemeal.org>',
    to: toEmail,
    subject: '🔑 Your 6-Digit Password Reset OTP - ShareMeal',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #ffffff; border-radius: 16px; border: 1px solid #f0e8e4; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; width: 48px; height: 48px; background-color: #ff6b4a; border-radius: 12px; line-height: 48px; font-size: 24px;">🍲</div>
          <h2 style="color: #2c2320; font-family: Georgia, serif; margin: 12px 0 4px;">ShareMeal Password Recovery</h2>
          <p style="color: #6b5d56; font-size: 14px; margin: 0;">Verification code requested for your account</p>
        </div>

        <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
          <p style="color: #9a3412; font-size: 13px; font-weight: 600; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px;">Your 6-Digit Verification Code</p>
          <div style="font-size: 32px; font-weight: 800; color: #ea580c; letter-spacing: 8px; font-family: monospace;">${otpCode}</div>
          <p style="color: #9a3412; font-size: 12px; margin: 10px 0 0;">Expires in 10 minutes. Do not share this code with anyone.</p>
        </div>

        <p style="color: #6b5d56; font-size: 13px; line-height: 1.5; margin: 0 0 20px;">
          If you did not request a password reset, please ignore this email or contact security support immediately.
        </p>

        <div style="border-top: 1px solid #f0e8e4; padding-top: 16px; text-align: center; font-size: 12px; color: #9ca3af;">
          &copy; ${new Date().getFullYear()} ShareMeal Food Donation Platform.
        </div>
      </div>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);

  if (previewUrl) {
    console.log(`\n==========================================`);
    console.log(`📩 REAL EMAIL SENT! Test Inbox Preview URL: ${previewUrl}`);
    console.log(`==========================================\n`);
  }

  return { info, previewUrl };
};

module.exports = { sendOtpEmail };
