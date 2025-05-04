import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  pgEnum,
  json,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ENUMS

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "ministry_manager",
  "province_manager",
  "hospital_manager",
  "lecturer_doctor",
  "participant_doctor",
  "guest",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "conference",
  "workshop",
  "seminar",
  "training",
  "symposium",
]);

export const eventLevelEnum = pgEnum("event_level", [
  "national",
  "provincial",
  "local",
  "hospital",
  "department",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "upcoming",
  "active",
  "completed",
  "cancelled",
]);

export const languageEnum = pgEnum("language", ["en", "fr", "ar"]);

export const registrationStatusEnum = pgEnum("registration_status", [
  "pending",
  "approved",
  "rejected",
]);

export const logActionEnum = pgEnum("log_action", [
  "create",
  "update",
  "delete",
  "login",
  "logout",
  "register",
  "upload",
  "download",
  "generate_certificate",
  "revoke_certificate",
  "verify_certificate",
]);

// TABLES

// Users & Authentication
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    email: text("email").notNull().unique(),
    fullName: text("full_name").notNull(),
    role: userRoleEnum("role").notNull().default("guest"),
    organization: text("organization"),
    position: text("position"),
    verified: boolean("verified").notNull().default(false),
    verificationToken: text("verification_token"),
    passwordResetToken: text("password_reset_token"),
    passwordResetExpires: timestamp("password_reset_expires"),
    preferredLanguage: languageEnum("preferred_language").default("en"),
    profileImage: text("profile_image"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      emailIdx: uniqueIndex("email_idx").on(table.email),
    };
  }
);

export const usersRelations = relations(users, ({ many }) => ({
  permissions: many(userPermissions),
  eventRegistrations: many(eventRegistrations),
  certificates: many(certificates),
  activityLogs: many(activityLogs),
}));

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const permissionsRelations = relations(permissions, ({ many }) => ({
  userPermissions: many(userPermissions),
}));

export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  permissionId: integer("permission_id")
    .notNull()
    .references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
  }),
  permission: one(permissions, {
    fields: [userPermissions.permissionId],
    references: [permissions.id],
  }),
}));

// Events
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventType: eventTypeEnum("event_type").notNull(),
  eventLevel: eventLevelEnum("event_level").notNull(),
  location: text("location").notNull(),
  address: text("address"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  registrationDeadline: timestamp("registration_deadline"),
  capacity: integer("capacity"),
  status: eventStatusEnum("status").notNull().default("draft"),
  coverImage: text("cover_image"),
  autoApproveRegistrations: boolean("auto_approve_registrations").default(false),
  createdById: integer("created_by_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventsRelations = relations(events, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [events.createdById],
    references: [users.id],
  }),
  eventSchedules: many(eventSchedules),
  eventRegistrations: many(eventRegistrations),
  eventDocuments: many(eventDocuments),
  eventSpeakers: many(eventSpeakers),
}));

export const eventSchedules = pgTable("event_schedules", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  speakerId: integer("speaker_id").references(() => eventSpeakers.id),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventSchedulesRelations = relations(eventSchedules, ({ one }) => ({
  event: one(events, {
    fields: [eventSchedules.eventId],
    references: [events.id],
  }),
  speaker: one(eventSpeakers, {
    fields: [eventSchedules.speakerId],
    references: [eventSpeakers.id],
  }),
}));

export const eventSpeakers = pgTable("event_speakers", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  title: text("title"),
  organization: text("organization"),
  bio: text("bio"),
  photo: text("photo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventSpeakersRelations = relations(eventSpeakers, ({ one, many }) => ({
  event: one(events, {
    fields: [eventSpeakers.eventId],
    references: [events.id],
  }),
  schedules: many(eventSchedules),
}));

export const eventRegistrations = pgTable("event_registrations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: registrationStatusEnum("status").notNull().default("pending"),
  registrationDate: timestamp("registration_date").defaultNow().notNull(),
  attendanceConfirmed: boolean("attendance_confirmed").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one, many }) => ({
  event: one(events, {
    fields: [eventRegistrations.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventRegistrations.userId],
    references: [users.id],
  }),
  certificates: many(certificates),
}));

// Document Library
export const eventDocuments = pgTable("event_documents", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedById: integer("uploaded_by_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventDocumentsRelations = relations(eventDocuments, ({ one }) => ({
  event: one(events, {
    fields: [eventDocuments.eventId],
    references: [events.id],
  }),
  uploadedBy: one(users, {
    fields: [eventDocuments.uploadedById],
    references: [users.id],
  }),
}));

// Certificates
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  registrationId: integer("registration_id")
    .notNull()
    .references(() => eventRegistrations.id, { onDelete: "cascade" }),
  certificateNumber: varchar("certificate_number", { length: 50 }).notNull().unique(),
  qrCode: text("qr_code").notNull(),
  issuedDate: timestamp("issued_date").defaultNow().notNull(),
  isRevoked: boolean("is_revoked").default(false),
  revokedReason: text("revoked_reason"),
  revokedDate: timestamp("revoked_date"),
  revokedById: integer("revoked_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const certificatesRelations = relations(certificates, ({ one }) => ({
  registration: one(eventRegistrations, {
    fields: [certificates.registrationId],
    references: [eventRegistrations.id],
  }),
  revokedBy: one(users, {
    fields: [certificates.revokedById],
    references: [users.id],
  }),
}));

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Activity Logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  action: logActionEnum("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: integer("resource_id"),
  details: json("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// SCHEMAS

// Users & Authentication
export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  email: (schema) => schema.email("Must provide a valid email"),
  password: (schema) => schema.min(8, "Password must be at least 8 characters"),
  fullName: (schema) => schema.min(2, "Full name must be at least 2 characters"),
})
.omit({ 
  id: true, 
  verified: true, 
  verificationToken: true, 
  passwordResetToken: true, 
  passwordResetExpires: true,
  active: true,
  createdAt: true,
  updatedAt: true 
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const updateUserSchema = createInsertSchema(users)
.omit({ 
  id: true, 
  password: true,
  createdAt: true,
  updatedAt: true 
});

// Events
export const insertEventSchema = createInsertSchema(events, {
  title: (schema) => schema.min(5, "Title must be at least 5 characters"),
  description: (schema) => schema.min(10, "Description must be at least 10 characters"),
})
.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const updateEventSchema = createInsertSchema(events)
.omit({ 
  id: true,
  createdById: true,
  createdAt: true,
  updatedAt: true 
});

// Event Registration
export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations)
.omit({ 
  id: true, 
  registrationDate: true,
  attendanceConfirmed: true,
  createdAt: true, 
  updatedAt: true 
});

// Event Schedule
export const insertEventScheduleSchema = createInsertSchema(eventSchedules, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
})
.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Event Speakers
export const insertEventSpeakerSchema = createInsertSchema(eventSpeakers, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
})
.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Event Documents
export const insertEventDocumentSchema = createInsertSchema(eventDocuments, {
  name: (schema) => schema.min(3, "Name must be at least 3 characters"),
})
.omit({ 
  id: true, 
  fileSize: true,
  createdAt: true, 
  updatedAt: true 
});

// Certificates
export const insertCertificateSchema = createInsertSchema(certificates)
.omit({ 
  id: true, 
  certificateNumber: true,
  qrCode: true,
  issuedDate: true,
  isRevoked: true,
  revokedReason: true,
  revokedDate: true,
  revokedById: true,
  createdAt: true, 
  updatedAt: true 
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = z.infer<typeof insertUserSchema>;
export type Event = typeof events.$inferSelect;
export type NewEvent = z.infer<typeof insertEventSchema>;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type NewEventRegistration = z.infer<typeof insertEventRegistrationSchema>;
export type EventSchedule = typeof eventSchedules.$inferSelect;
export type NewEventSchedule = z.infer<typeof insertEventScheduleSchema>;
export type EventSpeaker = typeof eventSpeakers.$inferSelect;
export type NewEventSpeaker = z.infer<typeof insertEventSpeakerSchema>;
export type EventDocument = typeof eventDocuments.$inferSelect;
export type NewEventDocument = z.infer<typeof insertEventDocumentSchema>;
export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = z.infer<typeof insertCertificateSchema>;
export type Notification = typeof notifications.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
