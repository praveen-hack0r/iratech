import { promisify } from "util";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import nodemailer from "nodemailer";

const scryptAsync = promisify(scrypt);

// Check if email environment variables are set
const hasEmailCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;

console.log("Email credentials available:", hasEmailCredentials);
if (hasEmailCredentials) {
  console.log("Email configuration:", {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE,
    user: process.env.EMAIL_USER?.substring(0, 3) + "..." // Log only first few chars for security
  });
}

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

export async function hashPassword(password: string, providedSalt?: string) {
  const salt = providedSalt || randomBytes(16).toString("hex");
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
  // Find the most appropriate base URL
  let baseUrl = process.env.BASE_URL;
  
  // For Replit deployments, use the Replit domain
  if (!baseUrl) {
    if (process.env.REPL_ID && process.env.REPL_OWNER) {
      // Format: https://repl-id-00-owner.repl.co
      baseUrl = `https://${process.env.REPL_ID}-00-${process.env.REPL_OWNER}.repl.co`;
      console.log("Using Replit deployment URL:", baseUrl);
    } else {
      baseUrl = "http://localhost:5000";
      console.log("Using localhost development URL:", baseUrl);
    }
  }
  
  const verificationLink = `${baseUrl}/api/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  
  // Create email content
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4F46E5; margin-bottom: 5px;">Welcome to IraTech!</h1>
        <p style="color: #6b7280; font-size: 16px;">Your Learning Journey Begins Now</p>
      </div>
      
      <p style="font-size: 16px; line-height: 1.6;">Hello ${username},</p>
      
      <p style="font-size: 16px; line-height: 1.6;">Thank you for creating an account on IraTech. To complete your registration and gain full access to our premium courses, please verify your email address using one of the methods below:</p>
      
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h2 style="color: #4F46E5; font-size: 18px; margin-top: 0;">Method 1: One-Click Verification</h2>
        <p style="margin-bottom: 20px;">Simply click the button below to instantly verify your email:</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${verificationLink}" style="background-color: #4F46E5; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Verify My Email</a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="background-color: #ffffff; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 14px;">
          <a href="${verificationLink}" style="color: #4F46E5; text-decoration: none;">${verificationLink}</a>
        </p>
      </div>
      
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h2 style="color: #4F46E5; font-size: 18px; margin-top: 0;">Method 2: Manual Verification</h2>
        <p style="margin-bottom: 15px;">If the link above doesn't work, you can manually verify your account:</p>
        
        <ol style="margin-left: 20px; line-height: 1.8;">
          <li>Go to the <a href="${baseUrl}/auth" style="color: #4F46E5; font-weight: bold;">IraTech login page</a></li>
          <li>Click on the "Verify Email" tab</li>
          <li>Enter your email address: <strong>${email}</strong></li>
          <li>Enter your verification token: <strong style="background-color: #ffffff; padding: 5px; border-radius: 4px; font-family: monospace;">${token}</strong></li>
          <li>Click "Verify Email" to complete the process</li>
        </ol>
      </div>
      
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 15px;"><strong>Important:</strong> This verification link and token will expire in 24 hours.</p>
      </div>
      
      <p style="font-size: 16px; line-height: 1.6; color: #374151;">If you didn't create an account on IraTech, you can safely ignore this email.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 16px; color: #374151;">Best regards,<br><strong>The IraTech Team</strong></p>
      </div>
    </div>
  `;
  
  try {
    if (!hasEmailCredentials) {
      // Development mode - log email info to console and return true
      console.log("\n================ VERIFICATION EMAIL ================");
      console.log(`TO: ${email}`);
      console.log(`SUBJECT: Verify your IraTech account`);
      console.log(`VERIFICATION LINK: ${verificationLink}`);
      console.log(`TOKEN: ${token}`);
      console.log("====================================================\n");
      return true;
    }
    
    console.log(`Attempting to send verification email to ${email}...`);
    
    // Production mode - send actual email
    const info = await transporter.sendMail({
      from: `"IraTech" <${process.env.EMAIL_USER || 'noreply@iratech.com'}>`,
      to: email,
      subject: "Verify your IraTech account",
      html: emailContent,
    });
    
    console.log("Verification email sent successfully");
    console.log("Message ID:", info.messageId);
    console.log("Email response:", info.response);
    
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      // Check for common SMTP errors
      if (error.message.includes("ECONNREFUSED")) {
        console.error("Connection refused. Please check if the SMTP server is accessible.");
      } else if (error.message.includes("ETIMEDOUT")) {
        console.error("Connection timed out. Please check your network settings.");
      } else if (error.message.includes("EAUTH")) {
        console.error("Authentication failed. Please check your email credentials.");
      }
    }
    
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
  // Find the most appropriate base URL
  let baseUrl = process.env.BASE_URL;
  
  // For Replit deployments, use the Replit domain
  if (!baseUrl) {
    if (process.env.REPL_ID && process.env.REPL_OWNER) {
      // Format: https://repl-id-00-owner.repl.co
      baseUrl = `https://${process.env.REPL_ID}-00-${process.env.REPL_OWNER}.repl.co`;
      console.log("Using Replit deployment URL for password reset:", baseUrl);
    } else {
      baseUrl = "http://localhost:5000";
      console.log("Using localhost development URL for password reset:", baseUrl);
    }
  }
  
  const resetLink = `${baseUrl}/reset-password?token=${token}`;
  
  // Create email content
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4F46E5; margin-bottom: 5px;">Password Reset Request</h1>
        <p style="color: #6b7280; font-size: 16px;">IraTech Account Security</p>
      </div>
      
      <p style="font-size: 16px; line-height: 1.6;">Hello,</p>
      
      <p style="font-size: 16px; line-height: 1.6;">We received a request to reset the password for your IraTech account associated with this email address (${email}). Follow the instructions below to reset your password:</p>
      
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h2 style="color: #4F46E5; font-size: 18px; margin-top: 0;">Reset Your Password</h2>
        <p style="margin-bottom: 20px;">Click the button below to create a new secure password:</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Reset My Password</a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="background-color: #ffffff; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 14px;">
          <a href="${resetLink}" style="color: #4F46E5; text-decoration: none;">${resetLink}</a>
        </p>
      </div>
      
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 15px;"><strong>Important:</strong> This password reset link will expire in 24 hours for security reasons.</p>
      </div>
      
      <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 15px;"><strong>Security Note:</strong> If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 16px; color: #374151;">Best regards,<br><strong>The IraTech Team</strong></p>
      </div>
    </div>
  `;
  
  try {
    if (!hasEmailCredentials) {
      // Development mode - log email info to console and return true
      console.log("\n================ PASSWORD RESET EMAIL ================");
      console.log(`TO: ${email}`);
      console.log(`SUBJECT: Reset Your IraTech Password`);
      console.log(`RESET LINK: ${resetLink}`);
      console.log(`TOKEN: ${token}`);
      console.log("=======================================================\n");
      return true;
    }
    
    console.log(`Attempting to send password reset email to ${email}...`);
    
    // Production mode - send actual email
    const info = await transporter.sendMail({
      from: `"IraTech" <${process.env.EMAIL_USER || 'noreply@iratech.com'}>`,
      to: email,
      subject: "Reset Your IraTech Password",
      html: emailContent,
    });
    
    console.log("Password reset email sent successfully");
    console.log("Message ID:", info.messageId);
    console.log("Email response:", info.response);
    
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      // Check for common SMTP errors
      if (error.message.includes("ECONNREFUSED")) {
        console.error("Connection refused. Please check if the SMTP server is accessible.");
      } else if (error.message.includes("ETIMEDOUT")) {
        console.error("Connection timed out. Please check your network settings.");
      } else if (error.message.includes("EAUTH")) {
        console.error("Authentication failed. Please check your email credentials.");
      }
    }
    
    return false;
  }
}

/**
 * Check if a verification token is valid
 */
export function isTokenExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}