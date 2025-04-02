import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Create upload directories if they don't exist
const uploadsDir = path.join(process.cwd(), "uploads");
const videosDir = path.join(uploadsDir, "videos");
const resourcesDir = path.join(uploadsDir, "resources");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir);
if (!fs.existsSync(resourcesDir)) fs.mkdirSync(resourcesDir);

// Configure multer storage
const storage_multer = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "video") {
      cb(null, videosDir);
    } else {
      cb(null, resourcesDir);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + uuidv4();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 1024 * 1024 * 100 } // 100MB limit
});

// Helper function to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
};

// Helper function to check if user is admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Serve uploaded files
  app.use('/uploads', isAuthenticated, express.static(uploadsDir));

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Course routes
  app.get("/api/courses", async (req, res) => {
    try {
      const { featured, categoryId } = req.query;
      const filter: any = { published: true };
      
      if (featured === "true") {
        filter.featured = true;
      }
      
      if (categoryId) {
        filter.categoryId = parseInt(categoryId as string);
      }
      
      const courses = await storage.getCourses(filter);
      
      // Fetch categories for each course
      const coursesWithCategory = await Promise.all(
        courses.map(async (course) => {
          const category = await storage.getCategory(course.categoryId);
          return { ...course, category };
        })
      );
      
      res.json(coursesWithCategory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:slug", async (req, res) => {
    try {
      const course = await storage.getCourseBySlug(req.params.slug);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const category = await storage.getCategory(course.categoryId);
      const sections = await storage.getSectionsByCourse(course.id);
      
      // For each section, get lessons
      const sectionsWithLessons = await Promise.all(
        sections.map(async (section) => {
          const lessons = await storage.getLessonsBySection(section.id);
          return { ...section, lessons };
        })
      );
      
      // Get resources for the course
      const resources = await storage.getResourcesByCourse(course.id);
      
      res.json({
        ...course,
        category,
        sections: sectionsWithLessons,
        resources
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  // Lesson routes
  app.get("/api/lessons/:id", isAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const lesson = await storage.getLesson(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      // Check if user has access to this lesson
      const section = await storage.getSection(lesson.sectionId);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }
      
      const course = await storage.getCourse(section.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // If lesson is a preview, allow access
      if (lesson.isPreview) {
        return res.json(lesson);
      }
      
      // Check if user is enrolled in the course
      const enrollment = await storage.getEnrollment(req.user.id, course.id);
      if (!enrollment && req.user.role !== "admin") {
        return res.status(403).json({ message: "You are not enrolled in this course" });
      }
      
      // Get resources for this lesson
      const resources = await storage.getResourcesByLesson(lessonId);
      
      // Get or create progress record
      let progress = await storage.getProgressByUserAndLesson(req.user.id, lessonId);
      if (!progress) {
        progress = await storage.createProgress({
          userId: req.user.id,
          lessonId: lessonId,
          completed: false,
          watchTimeSeconds: 0
        });
      }
      
      res.json({
        ...lesson,
        resources,
        progress
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lesson" });
    }
  });

  // Update lesson progress
  app.post("/api/lessons/:id/progress", isAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const { completed, watchTimeSeconds } = req.body;
      
      let progress = await storage.getProgressByUserAndLesson(req.user.id, lessonId);
      
      if (progress) {
        progress = await storage.updateProgress(progress.id, {
          completed: completed ?? progress.completed,
          watchTimeSeconds: watchTimeSeconds ?? progress.watchTimeSeconds
        });
      } else {
        progress = await storage.createProgress({
          userId: req.user.id,
          lessonId: lessonId,
          completed: completed ?? false,
          watchTimeSeconds: watchTimeSeconds ?? 0
        });
      }
      
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Resource routes
  app.get("/api/resources/:id", isAuthenticated, async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      const resource = await storage.getResource(resourceId);
      
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // If the resource is attached to a lesson, check lesson access
      if (resource.lessonId) {
        const lesson = await storage.getLesson(resource.lessonId);
        if (!lesson) {
          return res.status(404).json({ message: "Lesson not found" });
        }
        
        const section = await storage.getSection(lesson.sectionId);
        if (!section) {
          return res.status(404).json({ message: "Section not found" });
        }
        
        const course = await storage.getCourse(section.courseId);
        if (!course) {
          return res.status(404).json({ message: "Course not found" });
        }
        
        // If lesson is a preview, allow access
        if (!lesson.isPreview) {
          // Check if user is enrolled in the course
          const enrollment = await storage.getEnrollment(req.user.id, course.id);
          if (!enrollment && req.user.role !== "admin") {
            return res.status(403).json({ message: "You are not enrolled in this course" });
          }
        }
      } else {
        // Check if user is enrolled in the course
        const enrollment = await storage.getEnrollment(req.user.id, resource.courseId);
        if (!enrollment && req.user.role !== "admin") {
          return res.status(403).json({ message: "You are not enrolled in this course" });
        }
      }
      
      res.json(resource);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resource" });
    }
  });

  // Enrollment routes
  app.get("/api/enrollments", isAuthenticated, async (req, res) => {
    try {
      const enrollments = await storage.getEnrollmentsByUser(req.user.id);
      
      // Get course details for each enrollment
      const enrolledCourses = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = await storage.getCourse(enrollment.courseId);
          const category = course ? await storage.getCategory(course.categoryId) : null;
          return {
            ...enrollment,
            course: course ? { ...course, category } : null
          };
        })
      );
      
      res.json(enrolledCourses.filter(item => item.course !== null));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  // Direct enrollment route without payment
  // Request enrollment with UPI payment reference
  app.post("/api/enroll", isAuthenticated, async (req, res) => {
    try {
      const { courseId, paymentReference, paymentMethod } = req.body;
      
      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }
      
      // Check if course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if user is already enrolled
      const existingEnrollment = await storage.getEnrollment(req.user.id, courseId);
      if (existingEnrollment) {
        return res.status(400).json({ message: "You are already enrolled in this course" });
      }
      
      // Create pending enrollment with payment reference
      const enrollment = await storage.createEnrollment({
        userId: req.user.id,
        courseId: courseId,
        status: 'pending',
        paymentReference: paymentReference || null,
        paymentMethod: paymentMethod || 'upi',
        enrollmentDate: new Date().toISOString()
      });
      
      res.status(201).json({
        ...enrollment,
        message: "Your enrollment request has been submitted and will be approved after payment verification."
      });
    } catch (error) {
      res.status(500).json({ message: "Error enrolling in course" });
    }
  });
  
  // Admin routes for enrollment management
  app.get("/api/admin/enrollments", isAdmin, async (req, res) => {
    try {
      const enrollments = await storage.getAllEnrollments();
      
      // Get user and course details for each enrollment
      const enrichedEnrollments = await Promise.all(
        enrollments.map(async (enrollment) => {
          const user = await storage.getUser(enrollment.userId);
          const course = await storage.getCourse(enrollment.courseId);
          return {
            ...enrollment,
            user: user ? { 
              id: user.id, 
              username: user.username, 
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName
            } : null,
            course: course ? { 
              id: course.id, 
              title: course.title,
              price: course.price
            } : null
          };
        })
      );
      
      res.json(enrichedEnrollments.filter(item => item.user !== null && item.course !== null));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });
  
  app.get("/api/admin/enrollments/pending", isAdmin, async (req, res) => {
    try {
      const pendingEnrollments = await storage.getPendingEnrollments();
      
      // Get user and course details for each enrollment
      const enrichedEnrollments = await Promise.all(
        pendingEnrollments.map(async (enrollment) => {
          const user = await storage.getUser(enrollment.userId);
          const course = await storage.getCourse(enrollment.courseId);
          return {
            ...enrollment,
            user: user ? { 
              id: user.id, 
              username: user.username, 
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName
            } : null,
            course: course ? { 
              id: course.id, 
              title: course.title,
              price: course.price
            } : null
          };
        })
      );
      
      res.json(enrichedEnrollments.filter(item => item.user !== null && item.course !== null));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending enrollments" });
    }
  });
  
  app.post("/api/admin/enrollments/:id/approve", isAdmin, async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      const approvedEnrollment = await storage.approveEnrollment(enrollmentId, req.user.id);
      
      const user = await storage.getUser(approvedEnrollment.userId);
      const course = await storage.getCourse(approvedEnrollment.courseId);
      
      res.json({
        ...approvedEnrollment,
        user: user ? { 
          id: user.id, 
          username: user.username, 
          email: user.email 
        } : null,
        course: course ? { 
          id: course.id, 
          title: course.title 
        } : null,
        message: "Enrollment successfully approved"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve enrollment" });
    }
  });

  // Admin routes
  app.get("/api/admin/courses", isAdmin, async (req, res) => {
    try {
      const courses = await storage.getCourses();
      
      // Add category info to each course
      const coursesWithCategory = await Promise.all(
        courses.map(async (course) => {
          const category = await storage.getCategory(course.categoryId);
          return { ...course, category };
        })
      );
      
      res.json(coursesWithCategory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Get a single course with full details for admin
  app.get("/api/admin/courses/:id", isAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Get category
      const category = await storage.getCategory(course.categoryId);
      
      // Get sections with nested lessons
      const sections = await storage.getSectionsByCourse(courseId);
      const sectionsWithLessons = await Promise.all(
        sections.map(async (section) => {
          const lessons = await storage.getLessonsBySection(section.id);
          return { ...section, lessons };
        })
      );
      
      // Get resources for this course
      const resources = await storage.getResourcesByCourse(courseId);
      
      // Return the complete course data
      res.json({
        ...course,
        category,
        sections: sectionsWithLessons,
        resources
      });
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course details" });
    }
  });

  app.post("/api/admin/courses", isAdmin, async (req, res) => {
    try {
      const course = await storage.createCourse(req.body);
      res.status(201).json(course);
    } catch (error) {
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put("/api/admin/courses/:id", isAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.updateCourse(courseId, req.body);
      res.json(course);
    } catch (error) {
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/admin/courses/:id", isAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      await storage.deleteCourse(courseId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  app.post("/api/admin/sections", isAdmin, async (req, res) => {
    try {
      const section = await storage.createSection(req.body);
      res.status(201).json(section);
    } catch (error) {
      res.status(500).json({ message: "Failed to create section" });
    }
  });

  app.put("/api/admin/sections/:id", isAdmin, async (req, res) => {
    try {
      const sectionId = parseInt(req.params.id);
      const section = await storage.updateSection(sectionId, req.body);
      res.json(section);
    } catch (error) {
      res.status(500).json({ message: "Failed to update section" });
    }
  });

  app.delete("/api/admin/sections/:id", isAdmin, async (req, res) => {
    try {
      const sectionId = parseInt(req.params.id);
      await storage.deleteSection(sectionId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete section" });
    }
  });

  app.post("/api/admin/lessons", isAdmin, async (req, res) => {
    try {
      const lesson = await storage.createLesson(req.body);
      res.status(201).json(lesson);
    } catch (error) {
      res.status(500).json({ message: "Failed to create lesson" });
    }
  });

  app.put("/api/admin/lessons/:id", isAdmin, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const lesson = await storage.updateLesson(lessonId, req.body);
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ message: "Failed to update lesson" });
    }
  });

  app.delete("/api/admin/lessons/:id", isAdmin, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      await storage.deleteLesson(lessonId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete lesson" });
    }
  });

  // Video upload
  app.post("/api/admin/upload-video", isAdmin, upload.single('video'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const lessonId = parseInt(req.body.lessonId || '0');
      
      // Extract duration from the request if provided
      // In a production app, you would determine video duration programmatically
      // using a library like ffmpeg or browser-calculated value passed in the request
      const duration = req.body.duration ? parseInt(req.body.duration) : null;
      
      const videoUrl = `/uploads/videos/${req.file.filename}`;
      
      let updatedLesson;
      if (lessonId > 0) {
        const lesson = await storage.getLesson(lessonId);
        
        if (!lesson) {
          return res.status(404).json({ message: "Lesson not found" });
        }
        
        updatedLesson = await storage.updateLesson(lessonId, { 
          videoUrl,
          duration: duration
        });
      }
      
      res.json({
        videoUrl,
        duration,
        ...(updatedLesson || {})
      });
    } catch (error) {
      console.error("Video upload error:", error);
      res.status(500).json({ message: "Failed to upload video" });
    }
  });

  // Resource upload
  app.post("/api/admin/upload-resource", isAdmin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const { title, description, courseId, lessonId } = req.body;
      
      if (!title || !courseId) {
        return res.status(400).json({ message: "Title and course ID are required" });
      }
      
      const fileUrl = `/uploads/resources/${req.file.filename}`;
      const fileType = req.file.mimetype;
      const fileSize = req.file.size;
      
      const resource = await storage.createResource({
        title,
        description,
        courseId: parseInt(courseId),
        lessonId: lessonId ? parseInt(lessonId) : undefined,
        fileUrl,
        fileType,
        fileSize
      });
      
      res.status(201).json(resource);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload resource" });
    }
  });

  app.delete("/api/admin/resources/:id", isAdmin, async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      
      const resource = await storage.getResource(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Delete the file
      const filePath = path.join(process.cwd(), resource.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      await storage.deleteResource(resourceId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete resource" });
    }
  });

  // Dashboard analytics
  app.get("/api/admin/dashboard", isAdmin, async (req, res) => {
    try {
      const courses = await storage.getCourses();
      const enrollments = Array.from((await Promise.all(courses.map(course => 
        storage.getEnrollmentsByCourse(course.id)
      ))).flat());
      
      const totalStudents = new Set(enrollments.map(e => e.userId)).size;
      const totalCourses = courses.length;
      const totalEnrollments = enrollments.length;
      
      // Get recent enrollments
      const recentEnrollments = enrollments
        .sort((a, b) => new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime())
        .slice(0, 5);
      
      // Get enrolled students detail
      const recentEnrollmentsWithDetails = await Promise.all(
        recentEnrollments.map(async (enrollment) => {
          const user = await storage.getUser(enrollment.userId);
          const course = await storage.getCourse(enrollment.courseId);
          return {
            ...enrollment,
            user: user ? {
              id: user.id,
              username: user.username,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName
            } : null,
            course: course ? {
              id: course.id,
              title: course.title,
              slug: course.slug
            } : null
          };
        })
      );
      
      res.json({
        totalStudents,
        totalCourses,
        totalEnrollments,
        recentEnrollments: recentEnrollmentsWithDetails
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
