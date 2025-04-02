import { promisify } from "util";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import nodemailer from "nodemailer";

const scryptAsync = promisify(scrypt);

// Email transporter for verification emails
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  // Check if stored password has the expected format
  if (!stored || !stored.includes(".")) {
    console.error("Invalid stored password format, missing salt separator");
    return false;
  }
  
  const [hashed, salt] = stored.split(".");
  
  // Validate both parts exist
  if (!hashed || !salt) {
    console.error("Invalid stored password format, missing hash or salt");
    return false;
  }
  
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/**
 * Generate a random verification token
 */
export function generateVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Get the verification token expiry date (24 hours from now)
 */
export function getVerificationTokenExpiry(): Date {
  const date = new Date();
  date.setHours(date.getHours() + 24); // Token expires in 24 hours
  return date;
}

/**
 * Send a verification email to the user
 */
export async function sendVerificationEmail(
  email: string, 
  username: string,
  token: string
): Promise<boolean> {
  // Generate the verification link
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  const verificationLink = `${baseUrl}/api/verify-email?token=${token}`;
  
  try {
    await transporter.sendMail({
      from: `"TechLearn" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your TechLearn account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to TechLearn!</h2>
          <p>Hello ${username},</p>
          <p>Thank you for creating an account on TechLearn. To complete your registration and gain full access to our courses, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">Verify Email Address</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p><a href="${verificationLink}">${verificationLink}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account on TechLearn, you can safely ignore this email.</p>
          <p>Best regards,<br>The TechLearn Team</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
}

/**
 * Send a password reset email to the user
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<boolean> {
  // Generate the reset link
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  const resetLink = `${baseUrl}/reset-password?token=${token}`;
  
  try {
    await transporter.sendMail({
      from: `"TechLearn" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your TechLearn Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your password for your TechLearn account.</p>
          <p>To reset your password, click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">Reset Password</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <p>Best regards,<br>The TechLearn Team</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
}

/**
 * Check if a verification token is valid
 */
export function isTokenExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}