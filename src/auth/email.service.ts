import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerification(email: string, token: string) {
    const link = `http://localhost:3000/auth/verify-email?token=${token}`;
    const mailOptions = {
      from: '"Orbit Marketplace" <no-reply@orbit.com>',
      subject: 'Verify your email address',
      to: email,
      html: `
        <h2>Welcome to Orbit Activity Marketplace!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${link}">${link}</a>
        <p>If you did not sign up, you can ignore this email.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}`,
        error.stack,
      );
      throw error;
    }
  }
}
