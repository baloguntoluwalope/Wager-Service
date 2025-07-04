import transporter  from '../config/nodemailerConfig.js';

async function sendEmail(to,subject,text,html) {
  
  const mailOptions = {
    from: process.env.EMAILFROM, 
    to: to,
    subject: subject,
    text:text,
    html:html,
      };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: {info.messageId}`);
    return info; 
  } catch (error) {
    console.error(`Error sending welcome email to ${to}:`,  error);
    return false; // Indicate failure
  }
}

export {
  sendEmail,
};