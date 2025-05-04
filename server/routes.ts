import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateJWT, checkPermission } from "./middleware/auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { generateCertificate } from "./utils/certificate";
import { sendEmail } from "./utils/emailer";
import * as schema from "@shared/schema";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

const upload = multer({
  storage: storage_config,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Allow documents, images, and presentations
    const allowedMimeTypes = [
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      // Images
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/svg+xml",
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only documents, presentations, and images are allowed."));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix
  const apiPrefix = "/api";
  
  // Define server
  const httpServer = createServer(app);
  
  // Middleware to handle API errors
  app.use(`${apiPrefix}/*`, (err: any, req: Request, res: Response, next: any) => {
    console.error(err.stack);
    res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  });

  // Authentication routes
  app.post(`${apiPrefix}/auth/register`, async (req, res) => {
    try {
      const userData = schema.insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      const { user, verificationToken } = await storage.createUser(userData);
      
      // Send verification email
      const verificationUrl = `${req.protocol}://${req.get("host")}${apiPrefix}/auth/verify/${verificationToken}`;
      await sendEmail({
        to: userData.email,
        subject: "Verify your MedEvents account",
        html: `
          <h1>Welcome to MedEvents!</h1>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}">Verify Email</a>
        `,
      });
      
      // Log the activity
      await storage.logActivity(
        user.id,
        "register",
        { email: user.email },
        "user",
        user.id,
        req.ip,
        req.headers["user-agent"]
      );
      
      res.status(201).json({
        message: "User registered successfully. Please check your email for verification.",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  app.get(`${apiPrefix}/auth/verify/:token`, async (req, res) => {
    try {
      const { token } = req.params;
      const user = await storage.verifyUser(token);
      
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }
      
      // Log the activity
      await storage.logActivity(
        user.id,
        "update",
        { verified: true },
        "user",
        user.id,
        req.ip,
        req.headers["user-agent"]
      );
      
      // Redirect to login page
      res.redirect(`/?verified=true`);
    } catch (error) {
      console.error("Error verifying user:", error);
      res.status(500).json({ message: "Failed to verify user" });
    }
  });
  
  app.post(`${apiPrefix}/auth/login`, async (req, res) => {
    try {
      const loginData = schema.loginSchema.parse(req.body);
      const user = await storage.authenticateUser(loginData.email, loginData.password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      if (!user.verified) {
        return res.status(403).json({ message: "Please verify your email before logging in" });
      }
      
      // Get user permissions
      const permissions = await storage.getUserPermissions(user.id);
      const permissionNames = permissions.map(p => p.name);
      
      // Create JWT token
      const jwt = require("jsonwebtoken");
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          permissions: permissionNames,
        },
        process.env.JWT_SECRET || "your_jwt_secret",
        { expiresIn: "1d" }
      );
      
      // Log the activity
      await storage.logActivity(
        user.id,
        "login",
        { email: user.email },
        "user",
        user.id,
        req.ip,
        req.headers["user-agent"]
      );
      
      res.json({
        message: "Logged in successfully",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          preferredLanguage: user.preferredLanguage,
          profileImage: user.profileImage,
          permissions: permissionNames,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Failed to log in" });
    }
  });
  
  app.post(`${apiPrefix}/auth/forgot-password`, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const token = await storage.createPasswordResetToken(email);
      
      if (!token) {
        // Don't reveal that the email doesn't exist
        return res.status(200).json({
          message: "If a user with that email exists, a password reset link has been sent",
        });
      }
      
      // Send password reset email
      const resetUrl = `${req.protocol}://${req.get("host")}/reset-password/${token}`;
      await sendEmail({
        to: email,
        subject: "Reset your MedEvents password",
        html: `
          <h1>Password Reset Request</h1>
          <p>Please click the link below to reset your password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link will expire in 10 minutes.</p>
        `,
      });
      
      res.status(200).json({
        message: "If a user with that email exists, a password reset link has been sent",
      });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });
  
  app.post(`${apiPrefix}/auth/reset-password/:token`, async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      if (!password || password.length < 8) {
        return res.status(400).json({
          message: "Password must be at least 8 characters long",
        });
      }
      
      const user = await storage.resetPassword(token, password);
      
      if (!user) {
        return res.status(400).json({
          message: "Invalid or expired password reset token",
        });
      }
      
      // Log the activity
      await storage.logActivity(
        user.id,
        "update",
        { passwordReset: true },
        "user",
        user.id,
        req.ip,
        req.headers["user-agent"]
      );
      
      res.status(200).json({
        message: "Password has been reset successfully",
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  
  // User routes
  app.get(`${apiPrefix}/users`, authenticateJWT, checkPermission("user:read"), async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      
      const result = await storage.getAllUsers(page, limit, search);
      res.json(result);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });
  
  app.get(`${apiPrefix}/users/:id`, authenticateJWT, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user is requesting their own profile or has permission
      if (req.user.id !== userId && !req.user.permissions.includes("user:read")) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  
  app.put(`${apiPrefix}/users/:id`, authenticateJWT, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user is updating their own profile or has permission
      if (req.user.id !== userId && !req.user.permissions.includes("user:update")) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      // Only allow role updates if user has role:manage permission
      if (req.body.role && req.user.id !== userId && !req.user.permissions.includes("role:manage")) {
        return res.status(403).json({ message: "Permission denied for role update" });
      }
      
      const userData = req.body;
      const updatedUser = await storage.updateUser(userId, userData);
      
      // Log the activity
      await storage.logActivity(
        req.user.id,
        "update",
        { updated: true },
        "user",
        userId,
        req.ip,
        req.headers["user-agent"]
      );
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Permissions routes
  app.get(`${apiPrefix}/permissions`, authenticateJWT, checkPermission("role:manage"), async (req, res) => {
    try {
      const permissions = await storage.getAllPermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Error getting permissions:", error);
      res.status(500).json({ message: "Failed to get permissions" });
    }
  });
  
  app.get(`${apiPrefix}/users/:id/permissions`, authenticateJWT, checkPermission("role:manage"), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const permissions = await storage.getUserPermissions(userId);
      res.json(permissions);
    } catch (error) {
      console.error("Error getting user permissions:", error);
      res.status(500).json({ message: "Failed to get user permissions" });
    }
  });
  
  app.put(`${apiPrefix}/users/:id/permissions`, authenticateJWT, checkPermission("role:manage"), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { permissionIds } = req.body;
      
      if (!Array.isArray(permissionIds)) {
        return res.status(400).json({ message: "permissionIds must be an array" });
      }
      
      const permissions = await storage.updateUserPermissions(userId, permissionIds);
      
      // Log the activity
      await storage.logActivity(
        req.user.id,
        "update",
        { permissionIds },
        "user_permissions",
        userId,
        req.ip,
        req.headers["user-agent"]
      );
      
      res.json(permissions);
    } catch (error) {
      console.error("Error updating user permissions:", error);
      res.status(500).json({ message: "Failed to update user permissions" });
    }
  });
  
  // Event routes
  app.get(`${apiPrefix}/events`, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      
      const filters = {
        type: req.query.type as string,
        status: req.query.status as string,
        location: req.query.location as string,
        level: req.query.level as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      
      const result = await storage.getAllEvents(page, limit, search, filters);
      res.json(result);
    } catch (error) {
      console.error("Error getting events:", error);
      res.status(500).json({ message: "Failed to get events" });
    }
  });
  
  app.get(`${apiPrefix}/events/:id`, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEventById(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error getting event:", error);
      res.status(500).json({ message: "Failed to get event" });
    }
  });
  
  app.post(`${apiPrefix}/events`, authenticateJWT, checkPermission("event:create"), async (req, res) => {
    try {
      const eventData = schema.insertEventSchema.parse({
        ...req.body,
        createdById: req.user.id,
      });
      
      const event = await storage.createEvent(eventData);
      
      // Log the activity
      await storage.logActivity(
        req.user.id,
        "create",
        { title: event.title },
        "event",
        event.id,
        req.ip,
        req.headers["user-agent"]
      );
      
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });
  
  app.put(`${apiPrefix}/events/:id`, authenticateJWT, checkPermission("event:update"), async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const eventData = req.body;
      
      // Check if event exists
      const existingEvent = await storage.getEventById(eventId);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Only allow update if user is the creator or has special permissions
      if (
        existingEvent.createdById !== req.user.id &&
        !["super_admin", "ministry_manager"].includes(req.user.role)
      ) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      // If status is changed to "published", check for publish permission
      if (
        eventData.status === "active" &&
        existingEvent.status !== "active" &&
        !req.user.permissions.includes("event:publish")
      ) {
        return res.status(403).json({ message: "Permission denied for publishing events" });
      }
      
      const updatedEvent = await storage.updateEvent(eventId, eventData);
      
      // Log the activity
      await storage.logActivity(
        req.user.id,
        "update",
        { title: updatedEvent.title, status: updatedEvent.status },
        "event",
        eventId,
        req.ip,
        req.headers["user-agent"]
      );
      
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });
  
  app.delete(`${apiPrefix}/events/:id`, authenticateJWT, checkPermission("event:delete"), async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      
      // Check if event exists
      const existingEvent = await storage.getEventById(eventId);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Only allow deletion if user is the creator or has special permissions
      if (
        existingEvent.createdById !== req.user.id &&
        !["super_admin", "ministry_manager"].includes(req.user.role)
      ) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const deletedEvent = await storage.deleteEvent(eventId);
      
      // Log the activity
      await storage.logActivity(
        req.user.id,
        "delete",
        { title: deletedEvent.title },
        "event",
        eventId,
        req.ip,
        req.headers["user-agent"]
      );
      
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });
  
  // Event Registration routes
  app.post(`${apiPrefix}/events/:id/register`, authenticateJWT, checkPermission("event:register"), async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const registrationData = {
        eventId,
        userId,
        ...req.body,
      };
      
      const registration = await storage.registerForEvent(registrationData);
      
      // Log the activity
      await storage.logActivity(
        req.user.id,
        "create",
        { eventId, status: registration.status },
        "event_registration",
        registration.id,
        req.ip,
        req.headers["user-agent"]
      );
      
      // If registration status is approved, create notification for user
      if (registration.status === "approved") {
        const event = await storage.getEventById(eventId);
        await storage.createNotification(
          userId,
          "Registration Approved",
          `Your registration for ${event?.title} has been approved.`,
          `/events/${eventId}`
        );
      }
      
      res.status(201).json(registration);
    } catch (error) {
      console.error("Error registering for event:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to register for event" });
    }
  });
  
  app.get(`${apiPrefix}/events/:id/registrations`, authenticateJWT, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      const status = (req.query.status as string) || "";
      
      // Check if user has permission or is the event creator
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      if (
        event.createdById !== req.user.id &&
        !req.user.permissions.includes("event:approve") &&
        !["super_admin", "ministry_manager", "province_manager"].includes(req.user.role)
      ) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const result = await storage.getEventRegistrations(eventId, page, limit, search, status);
      res.json(result);
    } catch (error) {
      console.error("Error getting event registrations:", error);
      res.status(500).json({ message: "Failed to get event registrations" });
    }
  });
  
  app.put(`${apiPrefix}/registrations/:id/status`, authenticateJWT, checkPermission("event:approve"), async (req, res) => {
    try {
      const registrationId = parseInt(req.params.id);
      const { status, notes } = req.body;
      
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedRegistration = await storage.updateRegistrationStatus(
        registrationId,
        status as "approved" | "rejected",
        notes
      );
      
      // Log the activity
      await storage.logActivity(
        req.user.id,
        "update",
        { status, notes },
        "event_registration",
        registrationId,
        req.ip,
        req.headers["user-agent"]
      );
      
      // Create notification for user
      const event = await storage.getEventById(updatedRegistration.eventId);
      await storage.createNotification(
        updatedRegistration.userId,
        `Registration ${status === "approved" ? "Approved" : "Rejected"}`,
        `Your registration for ${event?.title} has been ${status === "approved" ? "approved" : "rejected"}.`,
        `/events/${updatedRegistration.eventId}`
      );
      
      res.json(updatedRegistration);
    } catch (error) {
      console.error("Error updating registration status:", error);
      res.status(500).json({ message: "Failed to update registration status" });
    }
  });
  
  app.put(`${apiPrefix}/registrations/:id/confirm-attendance`, authenticateJWT, checkPermission("event:approve"), async (req, res) => {
    try {
      const registrationId = parseInt(req.params.id);
      
      const updatedRegistration = await storage.confirmAttendance(registrationId);
      
      // Log the activity
      await storage.logActivity(
        req.user.id,
        "update",
        { attendanceConfirmed: true },
        "event_registration",
        registrationId,
        req.ip,
        req.headers["user-agent"]
      );
      
      res.json(updatedRegistration);
    } catch (error) {
      console.error("Error confirming attendance:", error);
      res.status(500).json({ message: "Failed to confirm attendance" });
    }
  });
  
  // Event Schedule routes
  app.post(`${apiPrefix}/events/:id/schedules`, authenticateJWT, checkPermission("event:update"), async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      
      // Check if event exists and user has permission
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      if (
        event.createdById !== req.user.id &&
        !["super_admin", "ministry_manager"].includes(req.user.role)
      ) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const scheduleData = {
        ...req.body,
        eventId,
      };
      
      const schedule = await storage.addEventSchedule(scheduleData);
      
      // Log the activity
      await storage.logActivity(
        req.user.id,
        "create",
        { title: schedule.title },
        "event_schedule",
        schedule.id,
        req.ip,
        req.headers["user-agent"]
      );
      
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Error adding event schedule:", error);
      res.status(500).json({ message: "Failed to add event schedule" });
    }
  });
  
  app.put(`${apiPrefix}/schedules/:id`, authenticateJWT, checkPermission("event:update"), async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const scheduleData = req.body;
      
      const updatedSchedule = await storage.updateEventSchedule(scheduleId, scheduleData);
      
      // Log the activity
      await storage.logActivity(
        req.user.id,
        "update",
        { title: updatedSchedule.title },
        "event_schedule",
        scheduleId,
        req.ip,
        req.headers["user-agent"]
      );
      
      res.json(updatedSchedule);
    } catch (error) {
      console.error("Error updating event schedule:", error);
      res.status(500).json({ message: "Failed to update event schedule" });
    }
  });
  
  app.delete(`${apiPrefix}/schedules/:id`, authenticateJWT, checkPermission("event:update"), async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      
      const deletedSchedule = await storage.deleteEventSchedule(scheduleId);
      
      // Log the activity
      await storage.logActivity(
        req.user.id,
        "delete",
        { title: deletedSchedule.title },
        "event_schedule",
        scheduleId,
        req.ip,
        req.headers["user-agent"]
      );
      
      res.json({ message: "Event schedule deleted successfully" });
    } catch (error) {
      console.error("Error deleting event schedule:", error);
      res.status(500).json({ message: "Failed to delete event schedule" });
    }
  });
  
  // Event Speakers routes
  app.post(`${apiPrefix}/events/:id/speakers`, authenticateJWT, checkPermission("event:update"), async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      
      // Check if event exists and user has permission
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      if (
        event.createdById !== req.user.id &&
        !["super_admin", "ministry_manager"].includes(req.user.role)
      ) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const speakerData = {
        ...req.body,
        eventId,
      };
      
      const speaker = await storage.addEventSpeaker(speakerData);
      
      // Log the activity
      await storage.logActivity(
        req.user.id,
        "create",
        { name: speaker.name },
        "event_speaker",
        speaker.id,
        req.ip,
        req.headers["user-agent"]
      );
      
      res.status(201).json(speaker);
    } catch (error) {
      console.error("Error adding event speaker:", error);
      res.status(500).json({ message: "Failed to add event speaker" });
    }
  });
  
  app.put(`${apiPrefix}/speakers/:id`, authenticateJWT, checkPermission("event:update"), async (req, res) => {
    try {
      const speakerId = parseInt(req.params.id);
      const speakerData = req.body;
      
      const updatedSpeaker = await storage.updateEventSpeaker(speakerId, speakerData);
      
      // Log the activity
      await storage.logActivity(
        req.user.id,
        "update",
        { name: updatedSpeaker.name },
        "event_speaker",
        speakerId,
        req.ip,
        req.headers["user-agent"]
      );
      
      res.json(updatedSpeaker);
    } catch (error) {
      console.error("Error updating event speaker:", error);
      res.status(500).json({ message: "Failed to update event speaker" });
    }
  });
  
  app.delete(`${apiPrefix}/speakers/:id`, authenticateJWT, checkPermission("event:update"), async (req, res) => {
    try {
      const speakerId = parseInt(req.params.id);
      
      const deletedSpeaker = await storage.deleteEventSpeaker(speakerId);
      
      // Log the activity
      await storage.logActivity(
        req.user.id,
        "delete",
        { name: deletedSpeaker.name },
        "event_speaker",
        speakerId,
        req.ip,
        req.headers["user-agent"]
      );
      
      res.json({ message: "Event speaker deleted successfully" });
    } catch (error) {
      console.error("Error deleting event speaker:", error);
      res.status(500).json({ message: "Failed to delete event speaker" });
    }
  });
  
  // Event Documents routes
  app.post(
    `${apiPrefix}/events/:id/documents`,
    authenticateJWT,
    checkPermission("media:upload"),
    upload.single("file"),
    async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);
        const file = req.file;
        
        if (!file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        
        // Create file URL
        const fileUrl = `/uploads/${file.filename}`;
        
        const documentData = {
          eventId,
          name: req.body.name || file.originalname,
          description: req.body.description || "",
          fileUrl,
          fileType: file.mimetype,
          fileSize: file.size,
          uploadedById: req.user.id,
        };
        
        const document = await storage.addEventDocument(documentData);
        
        // Log the activity
        await storage.logActivity(
          req.user.id,
          "upload",
          { name: document.name, fileType: document.fileType },
          "event_document",
          document.id,
          req.ip,
          req.headers["user-agent"]
        );
        
        res.status(201).json(document);
      } catch (error) {
        console.error("Error uploading document:", error);
        res.status(500).json({ message: "Failed to upload document" });
      }
    }
  );
  
  app.get(`${apiPrefix}/events/:id/documents`, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      
      const documents = await storage.getEventDocuments(eventId);
      res.json(documents);
    } catch (error) {
      console.error("Error getting event documents:", error);
      res.status(500).json({ message: "Failed to get event documents" });
    }
  });
  
  app.delete(`${apiPrefix}/documents/:id`, authenticateJWT, checkPermission("media:delete"), async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      
      const deletedDocument = await storage.deleteEventDocument(documentId);
      
      // Delete file from filesystem
      if (deletedDocument.fileUrl) {
        const filePath = path.join(process.cwd(), deletedDocument.fileUrl.replace(/^\//, ""));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      // Log the activity
      await storage.logActivity(
        req.user.id,
        "delete",
        { name: deletedDocument.name },
        "event_document",
        documentId,
        req.ip,
        req.headers["user-agent"]
      );
      
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });
  
  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(uploadDir, path.basename(req.path));
    res.sendFile(filePath, err => {
      if (err) {
        next();
      }
    });
  });
  
  // Certificate routes
  app.post(`${apiPrefix}/registrations/:id/certificate`, authenticateJWT, checkPermission("certificate:generate"), async (req, res) => {
    try {
      const registrationId = parseInt(req.params.id);
      
      // Generate certificate number
      const certificateNumber = `CERT-${Date.now()}-${registrationId}`;
      
      // Generate QR code data - URL to certificate verification page
      const verificationUrl = `${req.protocol}://${req.get("host")}/certificates/verify/${certificateNumber}`;
      const qrCode = await generateCertificate(verificationUrl);
      
      const certificate = await storage.generateCertificate(
        registrationId,
        qrCode,
        certificateNumber
      );
      
      // Log the activity
      await storage.logActivity(
        req.user.id,
        "generate_certificate",
        { certificateNumber },
        "certificate",
        certificate.id,
        req.ip,
        req.headers["user-agent"]
      );
      
      res.status(201).json(certificate);
    } catch (error) {
      console.error("Error generating certificate:", error);
      res.status(500).json({ message: "Failed to generate certificate" });
    }
  });
  
  app.get(`${apiPrefix}/certificates`, authenticateJWT, checkPermission("certificate:read"), async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      const eventId = req.query.eventId ? parseInt(req.query.eventId as string) : undefined;
      const isRevoked = req.query.isRevoked === "true" ? true : 
                         req.query.isRevoked === "false" ? false : undefined;
      
      const result = await storage.getAllCertificates(page, limit, search, { 
        eventId, 
        isRevoked 
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error getting certificates:", error);
      res.status(500).json({ message: "Failed to get certificates" });
    }
  });
  
  app.get(`${apiPrefix}/certificates/:id`, authenticateJWT, checkPermission("certificate:read"), async (req, res) => {
    try {
      const certificateId = parseInt(req.params.id);
      
      const certificate = await storage.getCertificateById(certificateId);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      res.json(certificate);
    } catch (error) {
      console.error("Error getting certificate:", error);
      res.status(500).json({ message: "Failed to get certificate" });
    }
  });
  
  app.get(`${apiPrefix}/certificates/verify/:number`, async (req, res) => {
    try {
      const certificateNumber = req.params.number;
      
      const certificate = await storage.getCertificateByNumber(certificateNumber);
      
      if (!certificate) {
        return res.status(404).json({ 
          message: "Certificate not found",
          valid: false
        });
      }
      
      if (certificate.isRevoked) {
        return res.status(200).json({
          message: "Certificate has been revoked",
          valid: false,
          revoked: true,
          revokedReason: certificate.revokedReason,
          revokedDate: certificate.revokedDate,
        });
      }
      
      // Log the verification activity
      await storage.logActivity(
        certificate.registration.userId,
        "verify_certificate",
        { certificateNumber },
        "certificate",
        certificate.id,
        req.ip,
        req.headers["user-agent"]
      );
      
      res.json({
        message: "Certificate is valid",
        valid: true,
        certificate: {
          certificateNumber: certificate.certificateNumber,
          issuedDate: certificate.issuedDate,
          event: {
            title: certificate.registration.event.title,
            startDate: certificate.registration.event.startDate,
            endDate: certificate.registration.event.endDate,
          },
          user: {
            fullName: certificate.registration.user.fullName,
            organization: certificate.registration.user.organization,
            position: certificate.registration.user.position,
          },
        },
      });
    } catch (error) {
      console.error("Error verifying certificate:", error);
      res.status(500).json({ message: "Failed to verify certificate" });
    }
  });
  
  app.post(`${apiPrefix}/certificates/:id/revoke`, authenticateJWT, checkPermission("certificate:revoke"), async (req, res) => {
    try {
      const certificateId = parseInt(req.params.id);
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: "Revocation reason is required" });
      }
      
      const revokedCertificate = await storage.revokeCertificate(
        certificateId,
        req.user.id,
        reason
      );
      
      // Log the activity
      await storage.logActivity(
        req.user.id,
        "revoke_certificate",
        { certificateNumber: revokedCertificate.certificateNumber, reason },
        "certificate",
        certificateId,
        req.ip,
        req.headers["user-agent"]
      );
      
      res.json(revokedCertificate);
    } catch (error) {
      console.error("Error revoking certificate:", error);
      res.status(500).json({ message: "Failed to revoke certificate" });
    }
  });
  
  app.get(`${apiPrefix}/user/certificates`, authenticateJWT, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await storage.getUserCertificates(req.user.id, page, limit);
      res.json(result);
    } catch (error) {
      console.error("Error getting user certificates:", error);
      res.status(500).json({ message: "Failed to get user certificates" });
    }
  });
  
  // Notification routes
  app.get(`${apiPrefix}/notifications`, authenticateJWT, async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error getting notifications:", error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });
  
  app.put(`${apiPrefix}/notifications/:id/read`, authenticateJWT, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      
      const notification = await storage.markNotificationAsRead(notificationId);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  
  app.put(`${apiPrefix}/notifications/read-all`, authenticateJWT, async (req, res) => {
    try {
      const notifications = await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ message: "All notifications marked as read", count: notifications.length });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });
  
  // Activity logs routes
  app.get(`${apiPrefix}/logs`, authenticateJWT, checkPermission("log:view"), async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const filters = {
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        action: req.query.action as string,
        resourceType: req.query.resourceType as string,
        resourceId: req.query.resourceId ? parseInt(req.query.resourceId as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      
      const result = await storage.getActivityLogs(page, limit, filters);
      res.json(result);
    } catch (error) {
      console.error("Error getting activity logs:", error);
      res.status(500).json({ message: "Failed to get activity logs" });
    }
  });
  
  // Return the configured server
  return httpServer;
}
