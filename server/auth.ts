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
      // Only check for email uniqueness since username doesn't need to be unique
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Create the user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        isVerified: false,
      });

      // Generate and set verification token
      const verificationToken = generateVerificationToken();
      const tokenExpiry = getVerificationTokenExpiry();
      
      await storage.setVerificationToken(user.id, verificationToken, tokenExpiry);

      // Send verification email
      const emailSent = await sendVerificationEmail(
        user.email,
        user.username,
        verificationToken
      );

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
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }

      const user = await storage.getUserByVerificationToken(token as string);
      
      if (!user) {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      if (!user.verificationExpiry || isTokenExpired(new Date(user.verificationExpiry))) {
        return res.status(400).json({ message: "Verification token has expired" });
      }

      await storage.verifyUser(user.id);
      
      // If user is logged in, update their session
      if (req.isAuthenticated() && req.user.id === user.id) {
        const updatedUser = await storage.getUser(user.id);
        if (updatedUser) {
          req.user = updatedUser;
        }
      }

      // Redirect to the frontend verification success page
      res.redirect('/verification-success');
    } catch (error) {
      next(error);
    }
  });

  // Resend verification email
  app.post("/api/resend-verification", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user;
      
      if (user.isVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate and set new verification token
      const verificationToken = generateVerificationToken();
      const tokenExpiry = getVerificationTokenExpiry();
      
      await storage.setVerificationToken(user.id, verificationToken, tokenExpiry);

      // Send verification email
      const emailSent = await sendVerificationEmail(
        user.email,
        user.username,
        verificationToken
      );

      if (emailSent) {
        res.status(200).json({ message: "Verification email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send verification email" });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Password reset request route
  app.post("/api/forgot-password", async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find the user by email
      const user = await storage.getUserByEmail(email);
      
      // For security, don't reveal if the email exists or not
      if (!user) {
        return res.status(200).json({ 
          message: "If your email is registered, you will receive a reset link" 
        });
      }
      
      // Generate a reset token
      const resetToken = generateVerificationToken();
      const tokenExpiry = getVerificationTokenExpiry();
      
      // Save the reset token
      await storage.setPasswordResetToken(user.id, resetToken, tokenExpiry);
      
      // Send the reset email
      const emailSent = await sendPasswordResetEmail(
        user.email,
        resetToken
      );
      
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
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }
      
      // Find user by reset token
      const user = await storage.getUserByResetToken(token);
      
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Check if token is expired
      if (!user.resetTokenExpiry || isTokenExpired(new Date(user.resetTokenExpiry))) {
        return res.status(400).json({ message: "Reset token has expired" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(password);
      
      // Update the password and clear the reset token
      await storage.updatePasswordAndClearResetToken(user.id, hashedPassword);
      
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
