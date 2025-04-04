import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import createMemoryStore from "memorystore";
import { 
  hashPassword, 
  comparePasswords, 
  generateVerificationToken, 
  getVerificationTokenExpiry, 
  sendVerificationEmail,
  sendPasswordResetEmail,
  isTokenExpired
} from "./auth-utils";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "techlearn-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          console.log(`Attempting login for email: ${email}`);
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            console.log(`User not found for email: ${email}`);
            return done(null, false);
          }
          
          console.log(`Found user: ${user.email}, checking password...`);
          const isValidPassword = await comparePasswords(password, user.password);
          console.log(`Password comparison result: ${isValidPassword}`);
          
          if (!isValidPassword) {
            return done(null, false);
          } else {
            return done(null, user);
          }
        } catch (error) {
          console.error("Login error:", error);
          return done(error);
        }
      }
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register new user
  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration attempt with email:", req.body.email);
      
      // Only check for email uniqueness since username doesn't need to be unique
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        console.log("Registration failed: Email already in use");
        return res.status(400).json({ message: "Email already in use" });
      }

      console.log("Creating new user account...");
      
      // Create the user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        isVerified: false,
      });
      
      console.log("User created with ID:", user.id);

      // Generate and set verification token
      const verificationToken = generateVerificationToken();
      const tokenExpiry = getVerificationTokenExpiry();
      
      console.log("Generated verification token for user ID:", user.id);
      console.log("Token expiry:", tokenExpiry);
      
      await storage.setVerificationToken(user.id, verificationToken, tokenExpiry);
      console.log("Verification token stored in database");

      // Send verification email
      console.log("Sending verification email to:", user.email);
      const emailSent = await sendVerificationEmail(
        user.email,
        user.username,
        verificationToken
      );
      
      console.log("Verification email sending result:", emailSent ? "Success" : "Failed");

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          ...user,
          verificationEmailSent: emailSent
        });
      });
    } catch (error) {
      next(error);
    }
  });

  // Login user
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(400).json({ message: "Invalid email or password" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  // Logout user
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  
  // Update user profile
  app.put("/api/profile", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const { firstName, lastName, email, phoneNumber } = req.body;
      
      // Validate if the updated email already exists (if email is being changed)
      if (email !== req.user.email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }
      
      // Update the user profile
      const updatedUser = await storage.updateUser(req.user.id, {
        firstName,
        lastName,
        email,
        phoneNumber
      });
      
      // Update session user
      req.login(updatedUser, (err) => {
        if (err) return next(err);
        res.json(updatedUser);
      });
    } catch (error) {
      next(error);
    }
  });

  // This section was removed as it was a duplicate of the more complete implementation below

  // Email Verification
  app.get("/api/verify-email", async (req, res, next) => {
    try {
      console.log("Email verification request received");
      console.log("Full URL:", req.protocol + '://' + req.get('host') + req.originalUrl);
      const { token } = req.query;
      
      console.log("Verification token:", token);
      
      if (!token) {
        console.log("Verification failed: No token provided");
        return res.status(400).json({ message: "Verification token is required" });
      }

      console.log("Looking up user by verification token...");
      const user = await storage.getUserByVerificationToken(token as string);
      
      if (!user) {
        console.log("Verification failed: Invalid token, no matching user found");
        return res.status(400).json({ message: "Invalid verification token" });
      }

      console.log("User found for verification:", user.id, user.email);
      
      if (!user.verificationExpiry) {
        console.log("Verification failed: No expiry date for token");
        return res.status(400).json({ message: "Invalid verification token" });
      }
      
      const expiry = new Date(user.verificationExpiry);
      const expired = isTokenExpired(expiry);
      
      console.log("Token expiry:", expiry);
      console.log("Token expired:", expired);
      
      if (expired) {
        console.log("Verification failed: Token has expired");
        return res.status(400).json({ message: "Verification token has expired" });
      }

      console.log("Verifying user account...");
      await storage.verifyUser(user.id);
      console.log("User verified successfully");
      
      // If user is logged in, update their session
      if (req.isAuthenticated() && req.user.id === user.id) {
        console.log("Updating user session with verified status");
        const updatedUser = await storage.getUser(user.id);
        if (updatedUser) {
          req.user = updatedUser;
        }
      }

      // Directly show success message rather than redirecting
      console.log("Showing verification success page");
      
      // Send a complete HTML response with inline styles
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verified - IraTech</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 40px; 
              line-height: 1.6; 
              background-color: #f9fafb;
              color: #111827;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            h1 { 
              color: #4F46E5; 
              margin-bottom: 20px;
            }
            .success-icon { 
              font-size: 64px; 
              color: #10B981; 
              margin-bottom: 20px; 
            }
            .message { 
              margin-bottom: 30px; 
            }
            .button { 
              display: inline-block; 
              background-color: #4F46E5; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 4px; 
              font-weight: bold;
              margin: 10px;
              transition: background-color 0.3s ease;
            }
            .button:hover {
              background-color: #4338ca;
            }
            .secondary-button {
              display: inline-block; 
              background-color: #e5e7eb;
              color: #374151; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 4px; 
              font-weight: bold;
              margin: 10px;
              transition: background-color 0.3s ease;
            }
            .secondary-button:hover {
              background-color: #d1d5db;
            }
            .actions {
              margin-top: 20px;
            }
            .highlight {
              color: #4F46E5;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✓</div>
            <h1>Email Successfully Verified!</h1>
            <div class="message">
              <p>Thank you for verifying your email address. Your IraTech account is now fully activated!</p>
              <p>You now have access to all our premium learning resources, including:</p>
              <p>
                <span class="highlight">Hacking tutorials</span> • 
                <span class="highlight">Coding courses</span> • 
                <span class="highlight">Excel with AI</span> • 
                <span class="highlight">Digital Marketing</span>
              </p>
              <p>Start your learning journey today and unlock your full potential!</p>
            </div>
            <div class="actions">
              <a href="https://${process.env.REPL_ID}-00-${process.env.REPL_OWNER}.repl.co/" class="button">Go to Homepage</a>
              <a href="https://${process.env.REPL_ID}-00-${process.env.REPL_OWNER}.repl.co/courses" class="secondary-button">Browse Courses</a>
            </div>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Error during email verification:", error);
      next(error);
    }
  });

  // Resend verification email
  app.post("/api/resend-verification", async (req, res, next) => {
    try {
      console.log("Resend verification email request received");
      
      if (!req.isAuthenticated()) {
        console.log("Resend failed: User not authenticated");
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user;
      console.log("User requesting verification resend:", user.id, user.email);
      
      if (user.isVerified) {
        console.log("Resend failed: Email already verified");
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate and set new verification token
      const verificationToken = generateVerificationToken();
      const tokenExpiry = getVerificationTokenExpiry();
      
      console.log("Generated new verification token");
      console.log("Token expiry:", tokenExpiry);
      
      await storage.setVerificationToken(user.id, verificationToken, tokenExpiry);
      console.log("Verification token stored in database");

      // Send verification email
      console.log("Sending verification email to:", user.email);
      const emailSent = await sendVerificationEmail(
        user.email,
        user.username,
        verificationToken
      );
      
      console.log("Verification email sending result:", emailSent ? "Success" : "Failed");

      if (emailSent) {
        res.status(200).json({ message: "Verification email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send verification email" });
      }
    } catch (error) {
      console.error("Error in resend verification:", error);
      next(error);
    }
  });
  
  // Password reset request route
  app.post("/api/forgot-password", async (req, res, next) => {
    try {
      console.log("Password reset request received");
      const { email } = req.body;
      
      console.log("Email provided for password reset:", email);
      
      if (!email) {
        console.log("Password reset failed: No email provided");
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find the user by email
      console.log("Looking up user by email...");
      const user = await storage.getUserByEmail(email);
      
      // For security, don't reveal if the email exists or not
      if (!user) {
        console.log("Password reset: User not found for email", email);
        return res.status(200).json({ 
          message: "If your email is registered, you will receive a reset link" 
        });
      }
      
      console.log("User found for password reset:", user.id);
      
      // Generate a reset token
      const resetToken = generateVerificationToken();
      const tokenExpiry = getVerificationTokenExpiry();
      
      console.log("Generated password reset token");
      console.log("Token expiry:", tokenExpiry);
      
      // Save the reset token
      console.log("Storing password reset token in database");
      await storage.setPasswordResetToken(user.id, resetToken, tokenExpiry);
      
      // Send the reset email
      console.log("Sending password reset email to:", user.email);
      const emailSent = await sendPasswordResetEmail(
        user.email,
        resetToken
      );
      
      console.log("Password reset email sending result:", emailSent ? "Success" : "Failed");
      
      if (!emailSent) {
        console.error("Failed to send password reset email");
      }
      
      // Always return success for security reasons
      res.status(200).json({ 
        message: "If your email is registered, you will receive a reset link" 
      });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Reset password route
  app.post("/api/reset-password", async (req, res, next) => {
    try {
      console.log("Password reset submission received");
      const { token, password } = req.body;
      
      console.log("Reset token provided:", token ? "Yes" : "No");
      console.log("New password provided:", password ? "Yes" : "No");
      
      if (!token || !password) {
        console.log("Password reset failed: Missing token or password");
        return res.status(400).json({ message: "Token and password are required" });
      }
      
      // Find user by reset token
      console.log("Looking up user by reset token...");
      const user = await storage.getUserByResetToken(token);
      
      if (!user) {
        console.log("Password reset failed: Invalid token, no matching user found");
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      console.log("User found for password reset:", user.id, user.email);
      
      // Check if token is expired
      if (!user.resetTokenExpiry) {
        console.log("Password reset failed: No expiry date for token");
        return res.status(400).json({ message: "Invalid reset token" });
      }
      
      const expiry = new Date(user.resetTokenExpiry);
      const expired = isTokenExpired(expiry);
      
      console.log("Token expiry:", expiry);
      console.log("Token expired:", expired);
      
      if (expired) {
        console.log("Password reset failed: Token has expired");
        return res.status(400).json({ message: "Reset token has expired" });
      }
      
      // Hash the new password
      console.log("Hashing new password...");
      const hashedPassword = await hashPassword(password);
      
      // Update the password and clear the reset token
      console.log("Updating password and clearing reset token...");
      await storage.updatePasswordAndClearResetToken(user.id, hashedPassword);
      
      console.log("Password reset successful for user:", user.id);
      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Error in reset password:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  // Check authentication for admin routes
  app.use('/api/admin/*', (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  });
}
