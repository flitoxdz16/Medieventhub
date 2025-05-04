import { db } from "@db";
import * as schema from "@shared/schema";
import { eq, and, desc, sql, like, gte, lte, ne, isNull, isNotNull } from "drizzle-orm";
import { compare, genSalt, hash } from "bcrypt";
import crypto from "crypto";

// User related storage functions
export const storage = {
  // User functions
  async createUser(userData: schema.NewUser) {
    const salt = await genSalt(10);
    const hashedPassword = await hash(userData.password, salt);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    
    const [user] = await db.insert(schema.users).values({
      ...userData,
      password: hashedPassword,
      verificationToken,
    }).returning({
      id: schema.users.id,
      username: schema.users.username,
      email: schema.users.email,
      fullName: schema.users.fullName,
      role: schema.users.role,
      organization: schema.users.organization,
      position: schema.users.position,
      verified: schema.users.verified,
      preferredLanguage: schema.users.preferredLanguage,
      profileImage: schema.users.profileImage,
      active: schema.users.active,
      createdAt: schema.users.createdAt,
    });
    
    return { user, verificationToken };
  },
  
  async verifyUser(token: string) {
    const [user] = await db
      .update(schema.users)
      .set({ verified: true, verificationToken: null })
      .where(eq(schema.users.verificationToken, token))
      .returning();
    
    return user;
  },
  
  async authenticateUser(email: string, password: string) {
    const user = await db.query.users.findFirst({
      where: and(
        eq(schema.users.email, email),
        eq(schema.users.active, true)
      ),
    });
    
    if (!user) return null;
    
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) return null;
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organization: user.organization,
      position: user.position,
      verified: user.verified,
      preferredLanguage: user.preferredLanguage,
      profileImage: user.profileImage,
    };
  },
  
  async getUserById(id: number) {
    return await db.query.users.findFirst({
      where: eq(schema.users.id, id),
      columns: {
        password: false,
        verificationToken: false,
        passwordResetToken: false,
        passwordResetExpires: false,
      },
      with: {
        permissions: {
          with: {
            permission: true,
          },
        },
      },
    });
  },
  
  async getUserByEmail(email: string) {
    return await db.query.users.findFirst({
      where: eq(schema.users.email, email),
      columns: {
        password: false,
        verificationToken: false,
        passwordResetToken: false,
        passwordResetExpires: false,
      },
    });
  },
  
  async getAllUsers(page = 1, limit = 10, search = "") {
    const offset = (page - 1) * limit;
    
    let query = db.select({
      id: schema.users.id,
      username: schema.users.username,
      email: schema.users.email,
      fullName: schema.users.fullName,
      role: schema.users.role,
      organization: schema.users.organization,
      position: schema.users.position,
      verified: schema.users.verified,
      preferredLanguage: schema.users.preferredLanguage,
      profileImage: schema.users.profileImage,
      active: schema.users.active,
      createdAt: schema.users.createdAt,
    }).from(schema.users);
    
    if (search) {
      query = query.where(
        sql`(${schema.users.fullName} ILIKE ${`%${search}%`} OR 
             ${schema.users.email} ILIKE ${`%${search}%`} OR 
             ${schema.users.username} ILIKE ${`%${search}%`})`
      );
    }
    
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.users)
      .where(
        search
          ? sql`(${schema.users.fullName} ILIKE ${`%${search}%`} OR 
                 ${schema.users.email} ILIKE ${`%${search}%`} OR 
                 ${schema.users.username} ILIKE ${`%${search}%`})`
          : sql`1=1`
      );
    
    const totalCount = totalCountResult[0]?.count || 0;
    
    const users = await query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(schema.users.createdAt));
    
    return {
      users,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  },
  
  async updateUser(id: number, userData: Partial<schema.User>) {
    if (userData.password) {
      const salt = await genSalt(10);
      userData.password = await hash(userData.password, salt);
    }
    
    const [updatedUser] = await db
      .update(schema.users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning({
        id: schema.users.id,
        username: schema.users.username,
        email: schema.users.email,
        fullName: schema.users.fullName,
        role: schema.users.role,
        organization: schema.users.organization,
        position: schema.users.position,
        verified: schema.users.verified,
        preferredLanguage: schema.users.preferredLanguage,
        profileImage: schema.users.profileImage,
        active: schema.users.active,
      });
    
    return updatedUser;
  },
  
  async createPasswordResetToken(email: string) {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
    
    if (!user) return null;
    
    const resetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    
    const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await db
      .update(schema.users)
      .set({
        passwordResetToken,
        passwordResetExpires,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id));
    
    return resetToken;
  },
  
  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    
    const user = await db.query.users.findFirst({
      where: and(
        eq(schema.users.passwordResetToken, hashedToken),
        gte(schema.users.passwordResetExpires!, new Date())
      ),
    });
    
    if (!user) return null;
    
    const salt = await genSalt(10);
    const hashedPassword = await hash(newPassword, salt);
    
    const [updatedUser] = await db
      .update(schema.users)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id))
      .returning({
        id: schema.users.id,
        email: schema.users.email,
      });
    
    return updatedUser;
  },
  
  // Permissions functions
  async getAllPermissions() {
    return await db.query.permissions.findMany({
      orderBy: schema.permissions.name,
    });
  },
  
  async getUserPermissions(userId: number) {
    const userPermissions = await db.query.userPermissions.findMany({
      where: eq(schema.userPermissions.userId, userId),
      with: {
        permission: true,
      },
    });
    
    return userPermissions.map(up => up.permission);
  },
  
  async updateUserPermissions(userId: number, permissionIds: number[]) {
    // Delete existing permissions
    await db
      .delete(schema.userPermissions)
      .where(eq(schema.userPermissions.userId, userId));
    
    // Insert new permissions
    if (permissionIds.length > 0) {
      await db.insert(schema.userPermissions).values(
        permissionIds.map(permissionId => ({
          userId,
          permissionId,
        }))
      );
    }
    
    return await this.getUserPermissions(userId);
  },
  
  // Event functions
  async createEvent(eventData: schema.NewEvent) {
    const [event] = await db
      .insert(schema.events)
      .values(eventData)
      .returning();
    
    return event;
  },
  
  async getEventById(id: number) {
    return await db.query.events.findFirst({
      where: eq(schema.events.id, id),
      with: {
        createdBy: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            organization: true,
            position: true,
            profileImage: true,
          },
        },
        eventSchedules: {
          with: {
            speaker: true,
          },
          orderBy: [schema.eventSchedules.date, schema.eventSchedules.startTime],
        },
        eventSpeakers: true,
        eventDocuments: {
          with: {
            uploadedBy: {
              columns: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });
  },
  
  async getAllEvents(
    page = 1,
    limit = 10,
    search = "",
    filters: {
      type?: string,
      status?: string,
      location?: string,
      level?: string,
      startDate?: string,
      endDate?: string,
    } = {}
  ) {
    const offset = (page - 1) * limit;
    
    let query = db.select().from(schema.events);
    
    // Apply search
    if (search) {
      query = query.where(
        sql`(${schema.events.title} ILIKE ${`%${search}%`} OR 
             ${schema.events.description} ILIKE ${`%${search}%`} OR 
             ${schema.events.location} ILIKE ${`%${search}%`})`
      );
    }
    
    // Apply filters
    if (filters.type && filters.type !== "all") {
      query = query.where(eq(schema.events.eventType, filters.type as any));
    }
    
    if (filters.status && filters.status !== "all") {
      query = query.where(eq(schema.events.status, filters.status as any));
    }
    
    if (filters.location && filters.location !== "all") {
      query = query.where(like(schema.events.location, `%${filters.location}%`));
    }
    
    if (filters.level && filters.level !== "all") {
      query = query.where(eq(schema.events.eventLevel, filters.level as any));
    }
    
    if (filters.startDate) {
      query = query.where(gte(schema.events.startDate, new Date(filters.startDate)));
    }
    
    if (filters.endDate) {
      query = query.where(lte(schema.events.endDate, new Date(filters.endDate)));
    }
    
    // Count total matching events
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.events)
      .where(
        search
          ? sql`(${schema.events.title} ILIKE ${`%${search}%`} OR 
                 ${schema.events.description} ILIKE ${`%${search}%`} OR 
                 ${schema.events.location} ILIKE ${`%${search}%`})`
          : sql`1=1`
      );
    
    const totalCount = totalCountResult[0]?.count || 0;
    
    // Get events with pagination and ordering
    const events = await query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(schema.events.createdAt));
    
    // Get counts per event
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const registrationsCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.eventRegistrations)
          .where(eq(schema.eventRegistrations.eventId, event.id));
        
        return {
          ...event,
          participantsCount: registrationsCount[0]?.count || 0,
        };
      })
    );
    
    return {
      events: eventsWithCounts,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  },
  
  async updateEvent(id: number, eventData: Partial<schema.Event>) {
    const [updatedEvent] = await db
      .update(schema.events)
      .set({
        ...eventData,
        updatedAt: new Date(),
      })
      .where(eq(schema.events.id, id))
      .returning();
    
    return updatedEvent;
  },
  
  async deleteEvent(id: number) {
    const [deletedEvent] = await db
      .delete(schema.events)
      .where(eq(schema.events.id, id))
      .returning();
    
    return deletedEvent;
  },
  
  // Event Registration
  async registerForEvent(registrationData: schema.NewEventRegistration) {
    const event = await this.getEventById(registrationData.eventId);
    
    if (!event) {
      throw new Error("Event not found");
    }
    
    // Check if the user is already registered
    const existingRegistration = await db.query.eventRegistrations.findFirst({
      where: and(
        eq(schema.eventRegistrations.eventId, registrationData.eventId),
        eq(schema.eventRegistrations.userId, registrationData.userId)
      ),
    });
    
    if (existingRegistration) {
      throw new Error("User is already registered for this event");
    }
    
    // Check if the event has reached capacity
    const registrationsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.eventRegistrations)
      .where(
        and(
          eq(schema.eventRegistrations.eventId, registrationData.eventId),
          eq(schema.eventRegistrations.status, "approved")
        )
      );
    
    if (
      event.capacity &&
      registrationsCount[0]?.count >= event.capacity
    ) {
      throw new Error("Event has reached maximum capacity");
    }
    
    // Set status based on autoApproveRegistrations
    const status = event.autoApproveRegistrations ? "approved" : "pending";
    
    const [registration] = await db
      .insert(schema.eventRegistrations)
      .values({
        ...registrationData,
        status,
        registrationDate: new Date(),
      })
      .returning();
    
    return registration;
  },
  
  async getEventRegistrations(
    eventId: number,
    page = 1,
    limit = 10,
    search = "",
    status?: string
  ) {
    const offset = (page - 1) * limit;
    
    let query = db
      .select({
        id: schema.eventRegistrations.id,
        status: schema.eventRegistrations.status,
        registrationDate: schema.eventRegistrations.registrationDate,
        attendanceConfirmed: schema.eventRegistrations.attendanceConfirmed,
        notes: schema.eventRegistrations.notes,
        user: {
          id: schema.users.id,
          fullName: schema.users.fullName,
          email: schema.users.email,
          organization: schema.users.organization,
          position: schema.users.position,
          profileImage: schema.users.profileImage,
        },
      })
      .from(schema.eventRegistrations)
      .innerJoin(
        schema.users,
        eq(schema.eventRegistrations.userId, schema.users.id)
      )
      .where(eq(schema.eventRegistrations.eventId, eventId));
    
    if (status && status !== "all") {
      query = query.where(eq(schema.eventRegistrations.status, status as any));
    }
    
    if (search) {
      query = query.where(
        sql`(${schema.users.fullName} ILIKE ${`%${search}%`} OR 
             ${schema.users.email} ILIKE ${`%${search}%`} OR 
             ${schema.users.organization} ILIKE ${`%${search}%`})`
      );
    }
    
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.eventRegistrations)
      .innerJoin(
        schema.users,
        eq(schema.eventRegistrations.userId, schema.users.id)
      )
      .where(eq(schema.eventRegistrations.eventId, eventId))
      .where(
        status && status !== "all"
          ? eq(schema.eventRegistrations.status, status as any)
          : sql`1=1`
      )
      .where(
        search
          ? sql`(${schema.users.fullName} ILIKE ${`%${search}%`} OR 
                 ${schema.users.email} ILIKE ${`%${search}%`} OR 
                 ${schema.users.organization} ILIKE ${`%${search}%`})`
          : sql`1=1`
      );
    
    const totalCount = totalCountResult[0]?.count || 0;
    
    const registrations = await query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(schema.eventRegistrations.registrationDate));
    
    // Get certificate status for each registration
    const registrationsWithCertificates = await Promise.all(
      registrations.map(async (registration) => {
        const certificate = await db.query.certificates.findFirst({
          where: eq(schema.certificates.registrationId, registration.id),
        });
        
        return {
          ...registration,
          hasCertificate: !!certificate,
          certificateId: certificate?.id,
          certificateIsRevoked: certificate?.isRevoked,
        };
      })
    );
    
    return {
      registrations: registrationsWithCertificates,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  },
  
  async updateRegistrationStatus(id: number, status: 'approved' | 'rejected', notes?: string) {
    const [updatedRegistration] = await db
      .update(schema.eventRegistrations)
      .set({
        status,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(schema.eventRegistrations.id, id))
      .returning();
    
    return updatedRegistration;
  },
  
  async confirmAttendance(id: number) {
    const [updatedRegistration] = await db
      .update(schema.eventRegistrations)
      .set({
        attendanceConfirmed: true,
        updatedAt: new Date(),
      })
      .where(eq(schema.eventRegistrations.id, id))
      .returning();
    
    return updatedRegistration;
  },
  
  // Event Schedule
  async addEventSchedule(scheduleData: schema.NewEventSchedule) {
    const [schedule] = await db
      .insert(schema.eventSchedules)
      .values(scheduleData)
      .returning();
    
    return schedule;
  },
  
  async updateEventSchedule(id: number, scheduleData: Partial<schema.EventSchedule>) {
    const [updatedSchedule] = await db
      .update(schema.eventSchedules)
      .set({
        ...scheduleData,
        updatedAt: new Date(),
      })
      .where(eq(schema.eventSchedules.id, id))
      .returning();
    
    return updatedSchedule;
  },
  
  async deleteEventSchedule(id: number) {
    const [deletedSchedule] = await db
      .delete(schema.eventSchedules)
      .where(eq(schema.eventSchedules.id, id))
      .returning();
    
    return deletedSchedule;
  },
  
  // Event Speakers
  async addEventSpeaker(speakerData: schema.NewEventSpeaker) {
    const [speaker] = await db
      .insert(schema.eventSpeakers)
      .values(speakerData)
      .returning();
    
    return speaker;
  },
  
  async updateEventSpeaker(id: number, speakerData: Partial<schema.EventSpeaker>) {
    const [updatedSpeaker] = await db
      .update(schema.eventSpeakers)
      .set({
        ...speakerData,
        updatedAt: new Date(),
      })
      .where(eq(schema.eventSpeakers.id, id))
      .returning();
    
    return updatedSpeaker;
  },
  
  async deleteEventSpeaker(id: number) {
    const [deletedSpeaker] = await db
      .delete(schema.eventSpeakers)
      .where(eq(schema.eventSpeakers.id, id))
      .returning();
    
    return deletedSpeaker;
  },
  
  // Event Documents
  async addEventDocument(documentData: schema.NewEventDocument) {
    const [document] = await db
      .insert(schema.eventDocuments)
      .values(documentData)
      .returning();
    
    return document;
  },
  
  async getEventDocuments(eventId: number) {
    return await db.query.eventDocuments.findMany({
      where: eq(schema.eventDocuments.eventId, eventId),
      with: {
        uploadedBy: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: desc(schema.eventDocuments.createdAt),
    });
  },
  
  async deleteEventDocument(id: number) {
    const [deletedDocument] = await db
      .delete(schema.eventDocuments)
      .where(eq(schema.eventDocuments.id, id))
      .returning();
    
    return deletedDocument;
  },
  
  // Certificates
  async generateCertificate(registrationId: number, qrCode: string, certificateNumber: string) {
    // Check if certificate already exists
    const existingCertificate = await db.query.certificates.findFirst({
      where: eq(schema.certificates.registrationId, registrationId),
    });
    
    if (existingCertificate) {
      if (existingCertificate.isRevoked) {
        // If revoked, we can reissue by removing the revoked status
        const [updatedCertificate] = await db
          .update(schema.certificates)
          .set({
            isRevoked: false,
            revokedReason: null,
            revokedDate: null,
            revokedById: null,
            qrCode,
            issuedDate: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(schema.certificates.id, existingCertificate.id))
          .returning();
        
        return updatedCertificate;
      }
      
      return existingCertificate;
    }
    
    // Create new certificate
    const [certificate] = await db
      .insert(schema.certificates)
      .values({
        registrationId,
        certificateNumber,
        qrCode,
        issuedDate: new Date(),
      })
      .returning();
    
    return certificate;
  },
  
  async getCertificateById(id: number) {
    return await db.query.certificates.findFirst({
      where: eq(schema.certificates.id, id),
      with: {
        registration: {
          with: {
            event: true,
            user: {
              columns: {
                id: true,
                fullName: true,
                email: true,
                organization: true,
                position: true,
              },
            },
          },
        },
      },
    });
  },
  
  async getCertificateByNumber(certificateNumber: string) {
    return await db.query.certificates.findFirst({
      where: eq(schema.certificates.certificateNumber, certificateNumber),
      with: {
        registration: {
          with: {
            event: true,
            user: {
              columns: {
                id: true,
                fullName: true,
                email: true,
                organization: true,
                position: true,
              },
            },
          },
        },
      },
    });
  },
  
  async getUserCertificates(userId: number, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const certificates = await db.query.certificates.findMany({
      where: and(
        eq(schema.eventRegistrations.userId, userId),
        eq(schema.certificates.isRevoked, false)
      ),
      with: {
        registration: {
          with: {
            event: true,
          },
        },
      },
      limit,
      offset,
      orderBy: desc(schema.certificates.issuedDate),
    });
    
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.certificates)
      .innerJoin(
        schema.eventRegistrations,
        eq(schema.certificates.registrationId, schema.eventRegistrations.id)
      )
      .where(
        and(
          eq(schema.eventRegistrations.userId, userId),
          eq(schema.certificates.isRevoked, false)
        )
      );
    
    const totalCount = totalCountResult[0]?.count || 0;
    
    return {
      certificates,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  },
  
  async getAllCertificates(
    page = 1,
    limit = 10,
    search = "",
    filter: { eventId?: number; isRevoked?: boolean } = {}
  ) {
    const offset = (page - 1) * limit;
    
    let query = db
      .select({
        id: schema.certificates.id,
        certificateNumber: schema.certificates.certificateNumber,
        issuedDate: schema.certificates.issuedDate,
        isRevoked: schema.certificates.isRevoked,
        revokedDate: schema.certificates.revokedDate,
        revokedReason: schema.certificates.revokedReason,
        event: {
          id: schema.events.id,
          title: schema.events.title,
        },
        user: {
          id: schema.users.id,
          fullName: schema.users.fullName,
          email: schema.users.email,
          organization: schema.users.organization,
        },
      })
      .from(schema.certificates)
      .innerJoin(
        schema.eventRegistrations,
        eq(schema.certificates.registrationId, schema.eventRegistrations.id)
      )
      .innerJoin(
        schema.events,
        eq(schema.eventRegistrations.eventId, schema.events.id)
      )
      .innerJoin(
        schema.users,
        eq(schema.eventRegistrations.userId, schema.users.id)
      );
    
    // Apply search
    if (search) {
      query = query.where(
        sql`(${schema.users.fullName} ILIKE ${`%${search}%`} OR 
             ${schema.users.email} ILIKE ${`%${search}%`} OR 
             ${schema.events.title} ILIKE ${`%${search}%`} OR
             ${schema.certificates.certificateNumber} ILIKE ${`%${search}%`})`
      );
    }
    
    // Apply filters
    if (filter.eventId) {
      query = query.where(eq(schema.events.id, filter.eventId));
    }
    
    if (filter.isRevoked !== undefined) {
      query = query.where(eq(schema.certificates.isRevoked, filter.isRevoked));
    }
    
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.certificates)
      .innerJoin(
        schema.eventRegistrations,
        eq(schema.certificates.registrationId, schema.eventRegistrations.id)
      )
      .innerJoin(
        schema.events,
        eq(schema.eventRegistrations.eventId, schema.events.id)
      )
      .innerJoin(
        schema.users,
        eq(schema.eventRegistrations.userId, schema.users.id)
      )
      .where(
        search
          ? sql`(${schema.users.fullName} ILIKE ${`%${search}%`} OR 
                 ${schema.users.email} ILIKE ${`%${search}%`} OR 
                 ${schema.events.title} ILIKE ${`%${search}%`} OR
                 ${schema.certificates.certificateNumber} ILIKE ${`%${search}%`})`
          : sql`1=1`
      )
      .where(
        filter.eventId
          ? eq(schema.events.id, filter.eventId)
          : sql`1=1`
      )
      .where(
        filter.isRevoked !== undefined
          ? eq(schema.certificates.isRevoked, filter.isRevoked)
          : sql`1=1`
      );
    
    const totalCount = totalCountResult[0]?.count || 0;
    
    const certificates = await query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(schema.certificates.issuedDate));
    
    return {
      certificates,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  },
  
  async revokeCertificate(id: number, revokedById: number, reason: string) {
    const [revokedCertificate] = await db
      .update(schema.certificates)
      .set({
        isRevoked: true,
        revokedReason: reason,
        revokedDate: new Date(),
        revokedById,
        updatedAt: new Date(),
      })
      .where(eq(schema.certificates.id, id))
      .returning();
    
    return revokedCertificate;
  },
  
  // Notifications
  async createNotification(userId: number, title: string, message: string, link?: string) {
    const [notification] = await db
      .insert(schema.notifications)
      .values({
        userId,
        title,
        message,
        link,
      })
      .returning();
    
    return notification;
  },
  
  async getUserNotifications(userId: number) {
    return await db.query.notifications.findMany({
      where: eq(schema.notifications.userId, userId),
      orderBy: desc(schema.notifications.createdAt),
      limit: 20,
    });
  },
  
  async markNotificationAsRead(id: number) {
    const [notification] = await db
      .update(schema.notifications)
      .set({
        read: true,
      })
      .where(eq(schema.notifications.id, id))
      .returning();
    
    return notification;
  },
  
  async markAllNotificationsAsRead(userId: number) {
    return await db
      .update(schema.notifications)
      .set({
        read: true,
      })
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.read, false)
        )
      )
      .returning();
  },
  
  // Activity logs
  async logActivity(
    userId: number,
    action: schema.logActionEnum,
    details: any,
    resourceType?: string,
    resourceId?: number,
    ipAddress?: string,
    userAgent?: string
  ) {
    const [log] = await db
      .insert(schema.activityLogs)
      .values({
        userId,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress,
        userAgent,
      })
      .returning();
    
    return log;
  },
  
  async getActivityLogs(
    page = 1,
    limit = 10,
    filters: {
      userId?: number;
      action?: string;
      resourceType?: string;
      resourceId?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ) {
    const offset = (page - 1) * limit;
    
    let query = db.query.activityLogs.findMany({
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
    
    const whereConditions = [];
    
    if (filters.userId) {
      whereConditions.push(eq(schema.activityLogs.userId, filters.userId));
    }
    
    if (filters.action) {
      whereConditions.push(eq(schema.activityLogs.action, filters.action as any));
    }
    
    if (filters.resourceType) {
      whereConditions.push(eq(schema.activityLogs.resourceType!, filters.resourceType));
    }
    
    if (filters.resourceId) {
      whereConditions.push(eq(schema.activityLogs.resourceId!, filters.resourceId));
    }
    
    if (filters.startDate) {
      whereConditions.push(
        gte(schema.activityLogs.createdAt, new Date(filters.startDate))
      );
    }
    
    if (filters.endDate) {
      whereConditions.push(
        lte(schema.activityLogs.createdAt, new Date(filters.endDate))
      );
    }
    
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }
    
    const logs = await query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(schema.activityLogs.createdAt));
    
    // Count total matching logs (this is inefficient in real-world, should use separate count query)
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.activityLogs)
      .where(
        whereConditions.length > 0
          ? and(...whereConditions)
          : sql`1=1`
      );
    
    return {
      logs,
      pagination: {
        total: totalCount[0]?.count || 0,
        page,
        limit,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / limit),
      },
    };
  },
};
