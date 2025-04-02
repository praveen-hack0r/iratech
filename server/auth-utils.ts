import { promisify } from "util";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import nodemailer from "nodemailer";

const scryptAsync = promisify(scrypt);

// Check if email environment variables are set
const hasEmailCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;

// Email transporter for verification emails
const transporter = hasEmailCredentials 
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
  : nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.password',
      },
    });

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  console.log("-------- comparePasswords debug --------");
  console.log("Supplied password length:", supplied.length);
  console.log("Stored password format:", stored);
  
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
  
  console.log("Hash length:", hashed.length);
  console.log("Salt:", salt);
  
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  
  // For debugging, show the supplied password hash
  console.log("Calculated hash from supplied password:", suppliedBuf.toString("hex"));
  console.log("Stored hash:", hashed);
  
  const result = timingSafeEqual(hashedBuf, suppliedBuf);
  console.log("Password comparison result:", result);
  console.log("--------------------------------------");
  
  return result;
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
  // Use Replit domain in development if available
  const replitDomain = process.env.REPL_SLUG && process.env.REPL_OWNER 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : null;
  const baseUrl = process.env.BASE_URL || replitDomain || "http://localhost:5000";
  const verificationLink = `${baseUrl}/api/verify-email?token=${token}`;
  
  // Create email content
  const emailContent = `
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
  `;
  
  try {
    if (!hasEmailCredentials) {
      // Development mode - log email info to console and return true
      console.log("\n================ VERIFICATION EMAIL ================");
      console.log(`TO: ${email}`);
      console.log(`SUBJECT: Verify your TechLearn account`);
      console.log(`VERIFICATION LINK: ${verificationLink}`);
      console.log(`TOKEN: ${token}`);
      console.log("====================================================\n");
      return true;
    }
    
    // Production mode - send actual email
    await transporter.sendMail({
      from: `"TechLearn" <${process.env.EMAIL_USER || 'noreply@techlearn.com'}>`,
      to: email,
      subject: "Verify your TechLearn account",
      html: emailContent,
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
  // Use Replit domain in development if available
  const replitDomain = process.env.REPL_SLUG && process.env.REPL_OWNER 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : null;
  const baseUrl = process.env.BASE_URL || replitDomain || "http://localhost:5000";
  const resetLink = `${baseUrl}/reset-password?token=${token}`;
  
  // Create email content
  const emailContent = `
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
  `;
  
  try {
    if (!hasEmailCredentials) {
      // Development mode - log email info to console and return true
      console.log("\n================ PASSWORD RESET EMAIL ================");
      console.log(`TO: ${email}`);
      console.log(`SUBJECT: Reset Your TechLearn Password`);
      console.log(`RESET LINK: ${resetLink}`);
      console.log(`TOKEN: ${token}`);
      console.log("=======================================================\n");
      return true;
    }
    
    // Production mode - send actual email
    await transporter.sendMail({
      from: `"TechLearn" <${process.env.EMAIL_USER || 'noreply@techlearn.com'}>`,
      to: email,
      subject: "Reset Your TechLearn Password",
      html: emailContent,
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