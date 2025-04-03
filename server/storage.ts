import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  courses, type Course, type InsertCourse,
  sections, type Section, type InsertSection,
  lessons, type Lesson, type InsertLesson,
  resources, type Resource, type InsertResource,
  enrollments, type Enrollment, type InsertEnrollment,
  progress, type Progress, type InsertProgress,
  payments, type Payment, type InsertPayment,
  forumTopics, type ForumTopic, type InsertForumTopic,
  forumComments, type ForumComment, type InsertForumComment,
  forumReactions, type ForumReaction, type InsertForumReaction,
  type ForumTopicWithUser, type ForumCommentWithUser
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);
type SessionStoreType = ReturnType<typeof createMemoryStore>;

// Define the interface for our storage system
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  updatePassword(id: number, hashedPassword: string): Promise<User>;
  updateResetToken(id: number, token: string, expiry: Date): Promise<User>;
  clearResetToken(id: number): Promise<User>;

  setVerificationToken(id: number, token: string, expiry: Date): Promise<User>;
  verifyUser(id: number): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<Category>): Promise<Category>;

  // Course operations
  getCourses(filter?: { featured?: boolean, published?: boolean, categoryId?: number }): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  getCourseBySlug(slug: string): Promise<Course | undefined>;
  getCoursesByCategory(categoryId: number): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course>;
  deleteCourse(id: number): Promise<void>;
  
  // Section operations
  getSectionsByCourse(courseId: number): Promise<Section[]>;
  getSection(id: number): Promise<Section | undefined>;
  createSection(section: InsertSection): Promise<Section>;
  updateSection(id: number, section: Partial<Section>): Promise<Section>;
  deleteSection(id: number): Promise<void>;
  
  // Lesson operations
  getLessonsBySection(sectionId: number): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  getLessonByVideoFilename(filename: string): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<Lesson>): Promise<Lesson>;
  deleteLesson(id: number): Promise<void>;
  
  // Resource operations
  getResourcesByCourse(courseId: number): Promise<Resource[]>;
  getResourcesByLesson(lessonId: number): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<Resource>): Promise<Resource>;
  deleteResource(id: number): Promise<void>;
  
  // Enrollment operations
  getEnrollmentsByUser(userId: number): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  getEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined>;
  getAllEnrollments(): Promise<Enrollment[]>;
  getPendingEnrollments(): Promise<Enrollment[]>;
  approveEnrollment(id: number, adminId: number): Promise<Enrollment>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment>;
  
  // Progress operations
  getProgressByUser(userId: number): Promise<Progress[]>;
  getProgressByUserAndLesson(userId: number, lessonId: number): Promise<Progress | undefined>;
  createProgress(progress: InsertProgress): Promise<Progress>;
  updateProgress(id: number, progress: Partial<Progress>): Promise<Progress>;
  
  // Payment operations
  getPaymentsByUser(userId: number): Promise<Payment[]>;
  getPaymentsByCourse(courseId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<Payment>): Promise<Payment>;
  
  // Forum topic operations
  getForumTopicsByCourse(courseId: number): Promise<ForumTopicWithUser[]>;
  getForumTopic(id: number): Promise<ForumTopic | undefined>;
  createForumTopic(topic: InsertForumTopic): Promise<ForumTopic>;
  updateForumTopic(id: number, topic: Partial<ForumTopic>): Promise<ForumTopic>;
  deleteForumTopic(id: number): Promise<void>;
  getForumTopicWithDetails(id: number, userId?: number): Promise<ForumTopicWithUser | undefined>;
  
  // Forum comment operations
  getForumCommentsByTopic(topicId: number): Promise<ForumCommentWithUser[]>;
  getForumComment(id: number): Promise<ForumComment | undefined>;
  createForumComment(comment: InsertForumComment): Promise<ForumComment>;
  updateForumComment(id: number, comment: Partial<ForumComment>): Promise<ForumComment>;
  deleteForumComment(id: number): Promise<void>;
  getCommentReplies(commentId: number): Promise<ForumCommentWithUser[]>;
  
  // Forum reaction operations
  createForumReaction(reaction: InsertForumReaction): Promise<ForumReaction>;
  deleteForumReaction(userId: number, topicId?: number, commentId?: number): Promise<void>;
  getReactionsByTopic(topicId: number): Promise<ForumReaction[]>;
  getReactionsByComment(commentId: number): Promise<ForumReaction[]>;
  getUserReaction(userId: number, topicId?: number, commentId?: number): Promise<ForumReaction | undefined>;
  
  // Session store for authentication
  sessionStore: any; // Using any to bypass type checking for session store
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private userStore: Map<number, User>;
  private categoryStore: Map<number, Category>;
  private courseStore: Map<number, Course>;
  private sectionStore: Map<number, Section>;
  private lessonStore: Map<number, Lesson>;
  private resourceStore: Map<number, Resource>;
  private enrollmentStore: Map<number, Enrollment>;
  private progressStore: Map<number, Progress>;
  private paymentStore: Map<number, Payment>;
  private forumTopicStore: Map<number, ForumTopic>;
  private forumCommentStore: Map<number, ForumComment>;
  private forumReactionStore: Map<number, ForumReaction>;
  sessionStore: any; // Using any to bypass type checking

  private userIdCounter: number;
  private categoryIdCounter: number;
  private courseIdCounter: number;
  private sectionIdCounter: number;
  private lessonIdCounter: number;
  private resourceIdCounter: number;
  private enrollmentIdCounter: number;
  private progressIdCounter: number;
  private paymentIdCounter: number;
  private forumTopicIdCounter: number;
  private forumCommentIdCounter: number;
  private forumReactionIdCounter: number;

  constructor() {
    this.userStore = new Map();
    this.categoryStore = new Map();
    this.courseStore = new Map();
    this.sectionStore = new Map();
    this.lessonStore = new Map();
    this.resourceStore = new Map();
    this.enrollmentStore = new Map();
    this.progressStore = new Map();
    this.paymentStore = new Map();
    this.forumTopicStore = new Map();
    this.forumCommentStore = new Map();
    this.forumReactionStore = new Map();
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.courseIdCounter = 1;
    this.sectionIdCounter = 1;
    this.lessonIdCounter = 1;
    this.resourceIdCounter = 1;
    this.enrollmentIdCounter = 1;
    this.progressIdCounter = 1;
    this.paymentIdCounter = 1;
    this.forumTopicIdCounter = 1;
    this.forumCommentIdCounter = 1;
    this.forumReactionIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });

    // Initialize with default admin user with pre-hashed password
    // This is equivalent to the password "admin123"
    const hashedPassword = "953e599285204eda9dcb2139eeb8273d8f0c125bbd0d8c63ddda6b9f6d6cbe95b4b93d32b8a75668b0046678f23696fd7874212a78e357ca17201eedfca62248.38a95e5d57bcb9e7ac0732b4ecb21f18";
    
    this.createUser({
      username: "admin",
      password: hashedPassword,
      email: "admin@techlearn.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      resetToken: null,
      resetTokenExpiry: null,
      isVerified: true
    }).then(() => {
      console.log("Default admin user created");
    });

    // Initialize with categories
    const categories = [
      {
        name: "Ethical Hacking",
        description: "Learn cybersecurity fundamentals, penetration testing, and ethical hacking techniques.",
        slug: "ethical-hacking",
        iconName: "Lock",
        iconColor: "text-primary",
        bgColor: "bg-blue-100",
        textColor: "text-primary"
      },
      {
        name: "Programming",
        description: "Master popular programming languages like Python, JavaScript, Java, and more.",
        slug: "programming",
        iconName: "Code",
        iconColor: "text-secondary",
        bgColor: "bg-green-100",
        textColor: "text-secondary"
      },
      {
        name: "Excel with AI",
        description: "Learn how to leverage AI and automation in Excel for advanced data analysis.",
        slug: "excel-with-ai",
        iconName: "FileSpreadsheet",
        iconColor: "text-accent",
        bgColor: "bg-purple-100",
        textColor: "text-accent"
      },
      {
        name: "Digital Marketing",
        description: "Learn SEO, social media marketing, content strategy, and online advertising.",
        slug: "digital-marketing",
        iconName: "Megaphone",
        iconColor: "text-yellow-500",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-500"
      }
    ];

    Promise.all(categories.map(cat => this.createCategory(cat))).then(() => {
      console.log("Default categories created");
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.userStore.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.userStore.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.userStore.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.userStore.values()).find(
      (user) => user.resetToken === token
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
    this.userStore.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = this.userStore.get(id);
    if (!user) throw new Error(`User with id ${id} not found`);
    
    const updatedUser = { ...user, ...userData };
    this.userStore.set(id, updatedUser);
    return updatedUser;
  }

  async updatePassword(id: number, hashedPassword: string): Promise<User> {
    return this.updateUser(id, { password: hashedPassword });
  }

  async updateResetToken(id: number, token: string, expiry: Date): Promise<User> {
    return this.updateUser(id, { resetToken: token, resetTokenExpiry: expiry });
  }

  async clearResetToken(id: number): Promise<User> {
    return this.updateUser(id, { resetToken: undefined, resetTokenExpiry: undefined });
  }



  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.userStore.values()).find(
      (user) => user.verificationToken === token
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.userStore.values());
  }

  async setVerificationToken(id: number, token: string, expiry: Date): Promise<User> {
    return this.updateUser(id, { 
      verificationToken: token, 
      verificationExpiry: expiry 
    });
  }

  async verifyUser(id: number): Promise<User> {
    return this.updateUser(id, { 
      isVerified: true, 
      verificationToken: null, 
      verificationExpiry: null 
    });
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categoryStore.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categoryStore.get(id);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categoryStore.values()).find(
      (category) => category.slug === slug
    );
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const newCategory: Category = { ...category, id };
    this.categoryStore.set(id, newCategory);
    return newCategory;
  }

  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category> {
    const category = this.categoryStore.get(id);
    if (!category) throw new Error(`Category with id ${id} not found`);
    
    const updatedCategory = { ...category, ...categoryData };
    this.categoryStore.set(id, updatedCategory);
    return updatedCategory;
  }

  // Course operations
  async getCourses(filter?: { featured?: boolean, published?: boolean, categoryId?: number }): Promise<Course[]> {
    let courses = Array.from(this.courseStore.values());
    
    if (filter) {
      if (filter.featured !== undefined) {
        courses = courses.filter(course => course.isFeatured === filter.featured);
      }
      
      if (filter.published !== undefined) {
        courses = courses.filter(course => course.isPublished === filter.published);
      }
      
      if (filter.categoryId !== undefined) {
        courses = courses.filter(course => course.categoryId === filter.categoryId);
      }
    }
    
    return courses;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return this.courseStore.get(id);
  }

  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    return Array.from(this.courseStore.values()).find(
      (course) => course.slug === slug
    );
  }

  async getCoursesByCategory(categoryId: number): Promise<Course[]> {
    return Array.from(this.courseStore.values()).filter(
      (course) => course.categoryId === categoryId
    );
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const id = this.courseIdCounter++;
    const newCourse: Course = { ...course, id };
    this.courseStore.set(id, newCourse);
    return newCourse;
  }

  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course> {
    const course = this.courseStore.get(id);
    if (!course) throw new Error(`Course with id ${id} not found`);
    
    const updatedCourse = { ...course, ...courseData };
    this.courseStore.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<void> {
    this.courseStore.delete(id);
  }

  // Section operations
  async getSectionsByCourse(courseId: number): Promise<Section[]> {
    return Array.from(this.sectionStore.values())
      .filter(section => section.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  }

  async getSection(id: number): Promise<Section | undefined> {
    return this.sectionStore.get(id);
  }

  async createSection(section: InsertSection): Promise<Section> {
    const id = this.sectionIdCounter++;
    const newSection: Section = { ...section, id };
    this.sectionStore.set(id, newSection);
    return newSection;
  }

  async updateSection(id: number, sectionData: Partial<Section>): Promise<Section> {
    const section = this.sectionStore.get(id);
    if (!section) throw new Error(`Section with id ${id} not found`);
    
    const updatedSection = { ...section, ...sectionData };
    this.sectionStore.set(id, updatedSection);
    return updatedSection;
  }

  async deleteSection(id: number): Promise<void> {
    this.sectionStore.delete(id);
  }

  // Lesson operations
  async getLessonsBySection(sectionId: number): Promise<Lesson[]> {
    return Array.from(this.lessonStore.values())
      .filter(lesson => lesson.sectionId === sectionId)
      .sort((a, b) => a.order - b.order);
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    return this.lessonStore.get(id);
  }
  
  async getLessonByVideoFilename(filename: string): Promise<Lesson[]> {
    // Extract just the filename without path
    const justFilename = filename.split('/').pop() || filename;
    
    // Search for lessons with videoUrl containing this filename
    return Array.from(this.lessonStore.values())
      .filter(lesson => {
        if (!lesson.videoUrl) return false;
        // Extract just the filename from videoUrl
        const lessonVideoFilename = lesson.videoUrl.split('/').pop() || '';
        return lessonVideoFilename === justFilename;
      });
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const id = this.lessonIdCounter++;
    const newLesson: Lesson = { ...lesson, id };
    this.lessonStore.set(id, newLesson);
    return newLesson;
  }

  async updateLesson(id: number, lessonData: Partial<Lesson>): Promise<Lesson> {
    const lesson = this.lessonStore.get(id);
    if (!lesson) throw new Error(`Lesson with id ${id} not found`);
    
    const updatedLesson = { ...lesson, ...lessonData };
    this.lessonStore.set(id, updatedLesson);
    return updatedLesson;
  }

  async deleteLesson(id: number): Promise<void> {
    this.lessonStore.delete(id);
  }

  // Resource operations
  async getResourcesByCourse(courseId: number): Promise<Resource[]> {
    return Array.from(this.resourceStore.values())
      .filter(resource => resource.courseId === courseId);
  }

  async getResourcesByLesson(lessonId: number): Promise<Resource[]> {
    return Array.from(this.resourceStore.values())
      .filter(resource => resource.lessonId === lessonId);
  }

  async getResource(id: number): Promise<Resource | undefined> {
    return this.resourceStore.get(id);
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const id = this.resourceIdCounter++;
    const newResource: Resource = { ...resource, id };
    this.resourceStore.set(id, newResource);
    
    // Update resource count for the course
    const course = this.courseStore.get(resource.courseId);
    if (course) {
      course.resourceCount = (course.resourceCount || 0) + 1;
      this.courseStore.set(course.id, course);
    }
    
    return newResource;
  }

  async updateResource(id: number, resourceData: Partial<Resource>): Promise<Resource> {
    const resource = this.resourceStore.get(id);
    if (!resource) throw new Error(`Resource with id ${id} not found`);
    
    const updatedResource = { ...resource, ...resourceData };
    this.resourceStore.set(id, updatedResource);
    return updatedResource;
  }

  async deleteResource(id: number): Promise<void> {
    const resource = this.resourceStore.get(id);
    if (resource) {
      // Update resource count for the course
      const course = this.courseStore.get(resource.courseId);
      if (course && course.resourceCount > 0) {
        course.resourceCount -= 1;
        this.courseStore.set(course.id, course);
      }
      
      this.resourceStore.delete(id);
    }
  }

  // Enrollment operations
  async getEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollmentStore.values())
      .filter(enrollment => enrollment.userId === userId);
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollmentStore.values())
      .filter(enrollment => enrollment.courseId === courseId);
  }

  async getEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined> {
    return Array.from(this.enrollmentStore.values()).find(
      enrollment => enrollment.userId === userId && enrollment.courseId === courseId
    );
  }
  
  async getAllEnrollments(): Promise<Enrollment[]> {
    return Array.from(this.enrollmentStore.values());
  }
  
  async getPendingEnrollments(): Promise<Enrollment[]> {
    return Array.from(this.enrollmentStore.values())
      .filter(enrollment => enrollment.status === "pending");
  }
  
  async approveEnrollment(id: number, adminId: number): Promise<Enrollment> {
    const enrollment = this.enrollmentStore.get(id);
    if (!enrollment) throw new Error(`Enrollment with id ${id} not found`);
    
    const updatedEnrollment = { 
      ...enrollment,
      status: "active",
      approvedBy: adminId,
      approvedAt: new Date()
    };
    this.enrollmentStore.set(id, updatedEnrollment);
    return updatedEnrollment;
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.enrollmentIdCounter++;
    const newEnrollment: Enrollment = { 
      ...enrollment, 
      id, 
      enrollmentDate: new Date()
    };
    this.enrollmentStore.set(id, newEnrollment);
    return newEnrollment;
  }

  async updateEnrollment(id: number, enrollmentData: Partial<Enrollment>): Promise<Enrollment> {
    const enrollment = this.enrollmentStore.get(id);
    if (!enrollment) throw new Error(`Enrollment with id ${id} not found`);
    
    const updatedEnrollment = { ...enrollment, ...enrollmentData };
    this.enrollmentStore.set(id, updatedEnrollment);
    return updatedEnrollment;
  }

  // Progress operations
  async getProgressByUser(userId: number): Promise<Progress[]> {
    return Array.from(this.progressStore.values())
      .filter(progress => progress.userId === userId);
  }

  async getProgressByUserAndLesson(userId: number, lessonId: number): Promise<Progress | undefined> {
    return Array.from(this.progressStore.values()).find(
      progress => progress.userId === userId && progress.lessonId === lessonId
    );
  }

  async createProgress(progress: InsertProgress): Promise<Progress> {
    const id = this.progressIdCounter++;
    const newProgress: Progress = { ...progress, id, lastWatched: new Date() };
    this.progressStore.set(id, newProgress);
    return newProgress;
  }

  async updateProgress(id: number, progressData: Partial<Progress>): Promise<Progress> {
    const progress = this.progressStore.get(id);
    if (!progress) throw new Error(`Progress with id ${id} not found`);
    
    const updatedProgress = { 
      ...progress, 
      ...progressData,
      lastWatched: new Date()
    };
    this.progressStore.set(id, updatedProgress);
    return updatedProgress;
  }

  // Payment operations
  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return Array.from(this.paymentStore.values())
      .filter(payment => payment.userId === userId);
  }

  async getPaymentsByCourse(courseId: number): Promise<Payment[]> {
    return Array.from(this.paymentStore.values())
      .filter(payment => payment.courseId === courseId);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = this.paymentIdCounter++;
    const newPayment: Payment = { 
      ...payment, 
      id, 
      createdAt: new Date(), 
      currency: payment.currency || "inr",
      paymentMethod: payment.paymentMethod || "upi"
    };
    this.paymentStore.set(id, newPayment);
    return newPayment;
  }

  async updatePayment(id: number, paymentData: Partial<Payment>): Promise<Payment> {
    const payment = this.paymentStore.get(id);
    if (!payment) throw new Error(`Payment with id ${id} not found`);
    
    const updatedPayment = { ...payment, ...paymentData };
    this.paymentStore.set(id, updatedPayment);
    return updatedPayment;
  }

  // Forum topic operations
  async getForumTopicsByCourse(courseId: number): Promise<ForumTopicWithUser[]> {
    const topics = Array.from(this.forumTopicStore.values())
      .filter(topic => topic.courseId === courseId)
      .sort((a, b) => {
        // Sort by pinned first, then by most recent
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    return Promise.all(topics.map(async topic => {
      const user = await this.getUser(topic.userId);
      if (!user) throw new Error(`User with id ${topic.userId} not found`);

      // Get comment count
      const comments = Array.from(this.forumCommentStore.values())
        .filter(comment => comment.topicId === topic.id);
      
      // Get last comment
      const lastComment = comments.length > 0 
        ? comments.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0]
        : null;
      
      // Get reactions
      const reactions = Array.from(this.forumReactionStore.values())
        .filter(reaction => reaction.topicId === topic.id);
      
      const likes = reactions.filter(r => r.reactionType === "like").length;

      return {
        ...topic,
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        commentCount: comments.length,
        lastComment: lastComment ? {
          id: lastComment.id,
          createdAt: lastComment.createdAt,
          user: {
            id: lastComment.userId,
            username: (await this.getUser(lastComment.userId))?.username || "Unknown"
          }
        } : null,
        reactions: {
          likes,
          userReaction: null // This will be populated when a specific userId is provided
        }
      };
    }));
  }

  async getForumTopic(id: number): Promise<ForumTopic | undefined> {
    return this.forumTopicStore.get(id);
  }

  async createForumTopic(topic: InsertForumTopic): Promise<ForumTopic> {
    const id = this.forumTopicIdCounter++;
    const newTopic: ForumTopic = { 
      ...topic, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: topic.isPinned || false
    };
    this.forumTopicStore.set(id, newTopic);
    return newTopic;
  }

  async updateForumTopic(id: number, topicData: Partial<ForumTopic>): Promise<ForumTopic> {
    const topic = this.forumTopicStore.get(id);
    if (!topic) throw new Error(`Forum topic with id ${id} not found`);
    
    const updatedTopic = { 
      ...topic, 
      ...topicData,
      updatedAt: new Date()
    };
    this.forumTopicStore.set(id, updatedTopic);
    return updatedTopic;
  }

  async deleteForumTopic(id: number): Promise<void> {
    // Delete all comments associated with the topic
    const commentsToDelete = Array.from(this.forumCommentStore.values())
      .filter(comment => comment.topicId === id);
    
    for (const comment of commentsToDelete) {
      // Delete all reactions to this comment
      const reactionsToDelete = Array.from(this.forumReactionStore.values())
        .filter(reaction => reaction.commentId === comment.id);
      
      for (const reaction of reactionsToDelete) {
        this.forumReactionStore.delete(reaction.id);
      }
      
      this.forumCommentStore.delete(comment.id);
    }
    
    // Delete all reactions to the topic
    const reactionsToDelete = Array.from(this.forumReactionStore.values())
      .filter(reaction => reaction.topicId === id);
    
    for (const reaction of reactionsToDelete) {
      this.forumReactionStore.delete(reaction.id);
    }
    
    // Finally delete the topic
    this.forumTopicStore.delete(id);
  }

  async getForumTopicWithDetails(id: number, userId?: number): Promise<ForumTopicWithUser | undefined> {
    const topic = this.forumTopicStore.get(id);
    if (!topic) return undefined;

    const user = await this.getUser(topic.userId);
    if (!user) throw new Error(`User with id ${topic.userId} not found`);

    // Get comment count
    const comments = Array.from(this.forumCommentStore.values())
      .filter(comment => comment.topicId === topic.id);
    
    // Get last comment
    const lastComment = comments.length > 0 
      ? comments.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
      : null;
    
    // Get reactions
    const reactions = Array.from(this.forumReactionStore.values())
      .filter(reaction => reaction.topicId === topic.id);
    
    const likes = reactions.filter(r => r.reactionType === "like").length;
    
    // Get user's reaction if userId is provided
    let userReaction = null;
    if (userId) {
      const reactionByUser = reactions.find(r => r.userId === userId);
      if (reactionByUser) {
        userReaction = reactionByUser.reactionType;
      }
    }

    return {
      ...topic,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      commentCount: comments.length,
      lastComment: lastComment ? {
        id: lastComment.id,
        createdAt: lastComment.createdAt,
        user: {
          id: lastComment.userId,
          username: (await this.getUser(lastComment.userId))?.username || "Unknown"
        }
      } : null,
      reactions: {
        likes,
        userReaction
      }
    };
  }

  // Forum comment operations
  async getForumCommentsByTopic(topicId: number): Promise<ForumCommentWithUser[]> {
    // Get all top-level comments (parentId is null)
    const comments = Array.from(this.forumCommentStore.values())
      .filter(comment => comment.topicId === topicId && !comment.parentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return Promise.all(comments.map(async comment => this.enrichCommentWithUserAndReplies(comment)));
  }

  private async enrichCommentWithUserAndReplies(comment: ForumComment): Promise<ForumCommentWithUser> {
    const user = await this.getUser(comment.userId);
    if (!user) throw new Error(`User with id ${comment.userId} not found`);

    // Get reactions
    const reactions = Array.from(this.forumReactionStore.values())
      .filter(reaction => reaction.commentId === comment.id);
    
    const likes = reactions.filter(r => r.reactionType === "like").length;

    // Get replies
    const replies = Array.from(this.forumCommentStore.values())
      .filter(c => c.parentId === comment.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    const repliesWithUser = await Promise.all(
      replies.map(reply => this.enrichCommentWithUserAndReplies(reply))
    );

    return {
      ...comment,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      replies: repliesWithUser,
      reactions: {
        likes,
        userReaction: null // This will be populated when a specific userId is provided
      }
    };
  }

  async getForumComment(id: number): Promise<ForumComment | undefined> {
    return this.forumCommentStore.get(id);
  }

  async createForumComment(comment: InsertForumComment): Promise<ForumComment> {
    const id = this.forumCommentIdCounter++;
    const newComment: ForumComment = { 
      ...comment, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.forumCommentStore.set(id, newComment);
    
    // Update the topic's updatedAt timestamp
    if (comment.topicId) {
      const topic = this.forumTopicStore.get(comment.topicId);
      if (topic) {
        topic.updatedAt = new Date();
        this.forumTopicStore.set(topic.id, topic);
      }
    }
    
    return newComment;
  }

  async updateForumComment(id: number, commentData: Partial<ForumComment>): Promise<ForumComment> {
    const comment = this.forumCommentStore.get(id);
    if (!comment) throw new Error(`Forum comment with id ${id} not found`);
    
    const updatedComment = { 
      ...comment, 
      ...commentData,
      updatedAt: new Date()
    };
    this.forumCommentStore.set(id, updatedComment);
    return updatedComment;
  }

  async deleteForumComment(id: number): Promise<void> {
    const comment = this.forumCommentStore.get(id);
    if (!comment) return;
    
    // First, delete all replies
    const replies = Array.from(this.forumCommentStore.values())
      .filter(c => c.parentId === id);
    
    for (const reply of replies) {
      await this.deleteForumComment(reply.id);
    }
    
    // Delete all reactions to this comment
    const reactions = Array.from(this.forumReactionStore.values())
      .filter(reaction => reaction.commentId === id);
    
    for (const reaction of reactions) {
      this.forumReactionStore.delete(reaction.id);
    }
    
    // Finally, delete the comment
    this.forumCommentStore.delete(id);
  }

  async getCommentReplies(commentId: number): Promise<ForumCommentWithUser[]> {
    const replies = Array.from(this.forumCommentStore.values())
      .filter(comment => comment.parentId === commentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return Promise.all(replies.map(async reply => this.enrichCommentWithUserAndReplies(reply)));
  }

  // Forum reaction operations
  async createForumReaction(reaction: InsertForumReaction): Promise<ForumReaction> {
    // First, delete any existing reaction by this user to the same topic/comment
    await this.deleteForumReaction(
      reaction.userId, 
      reaction.topicId, 
      reaction.commentId
    );
    
    const id = this.forumReactionIdCounter++;
    const newReaction: ForumReaction = { ...reaction, id };
    this.forumReactionStore.set(id, newReaction);
    return newReaction;
  }

  async deleteForumReaction(userId: number, topicId?: number, commentId?: number): Promise<void> {
    const reactions = Array.from(this.forumReactionStore.values())
      .filter(reaction => 
        reaction.userId === userId && 
        (topicId ? reaction.topicId === topicId : true) &&
        (commentId ? reaction.commentId === commentId : true)
      );
    
    for (const reaction of reactions) {
      this.forumReactionStore.delete(reaction.id);
    }
  }

  async getReactionsByTopic(topicId: number): Promise<ForumReaction[]> {
    return Array.from(this.forumReactionStore.values())
      .filter(reaction => reaction.topicId === topicId);
  }

  async getReactionsByComment(commentId: number): Promise<ForumReaction[]> {
    return Array.from(this.forumReactionStore.values())
      .filter(reaction => reaction.commentId === commentId);
  }

  async getUserReaction(userId: number, topicId?: number, commentId?: number): Promise<ForumReaction | undefined> {
    return Array.from(this.forumReactionStore.values())
      .find(reaction => 
        reaction.userId === userId && 
        (topicId ? reaction.topicId === topicId : true) &&
        (commentId ? reaction.commentId === commentId : true)
      );
  }
}

export const storage = new MemStorage();
