import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAILFROM,
    pass: process.env.EMAILPASSWORD,
  },
  // Optional: for debugging, set to true to see more logs
  // debug: true,
  // logger: true
});

// Verify connection configuration (optional, but good for debugging)
transporter.verify(function (error, success) {
  if (error) {
    console.error(`Nodemailer transporter verification failed:`, error);
  } else {
    console.log(`Nodemailer transporter is ready to send messages!`);
  }
});

export default transporter;