import { db } from "./index";
import * as schema from "@shared/schema";
import { genSalt, hash } from "bcrypt";
import { sql } from "drizzle-orm";

async function hashPassword(password: string): Promise<string> {
  const salt = await genSalt(10);
  return hash(password, salt);
}

async function seed() {
  try {
    console.log("🌱 Starting database seeding...");

    // Clear existing data (for development only)
    // In production, we would not delete existing data
    console.log("Clearing existing data...");
    await db.execute(sql`TRUNCATE TABLE "users" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "permissions" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "events" CASCADE`);

    // Seed permissions
    console.log("Seeding permissions...");
    const permissionsData = [
      { name: "user:create", description: "Can create users" },
      { name: "user:read", description: "Can view users" },
      { name: "user:update", description: "Can update users" },
      { name: "user:delete", description: "Can delete users" },
      { name: "role:manage", description: "Can manage roles and permissions" },
      { name: "event:create", description: "Can create events" },
      { name: "event:read", description: "Can view events" },
      { name: "event:update", description: "Can update events" },
      { name: "event:delete", description: "Can delete events" },
      { name: "event:publish", description: "Can publish events" },
      { name: "event:register", description: "Can register for events" },
      { name: "event:approve", description: "Can approve event registrations" },
      { name: "certificate:generate", description: "Can generate certificates" },
      { name: "certificate:revoke", description: "Can revoke certificates" },
      { name: "certificate:read", description: "Can view certificates" },
      { name: "media:upload", description: "Can upload media files" },
      { name: "media:read", description: "Can view media files" },
      { name: "media:delete", description: "Can delete media files" },
      { name: "report:generate", description: "Can generate reports" },
      { name: "log:view", description: "Can view activity logs" },
    ];

    const permissions = await db.insert(schema.permissions).values(permissionsData).returning();
    console.log(`✅ Created ${permissions.length} permissions`);

    // Seed users
    console.log("Seeding users...");
    const superAdminPassword = await hashPassword("Admin@123");
    const ministryManagerPassword = await hashPassword("Manager@123");
    const doctorPassword = await hashPassword("Doctor@123");
    
    const users = await db.insert(schema.users).values([
      {
        username: "admin",
        email: "admin@medevents.com",
        password: superAdminPassword,
        fullName: "System Administrator",
        role: "super_admin",
        organization: "MedEvents System",
        position: "Administrator",
        verified: true,
        profileImage: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        active: true,
      },
      {
        username: "sara.ahmed",
        email: "sara.ahmed@health.gov",
        password: ministryManagerPassword,
        fullName: "Dr. Sara Ahmed",
        role: "ministry_manager",
        organization: "Ministry of Health",
        position: "Health Director",
        verified: true,
        profileImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        active: true,
      },
      {
        username: "ahmed.hassan",
        email: "ahmed.hassan@hospital.org",
        password: doctorPassword,
        fullName: "Dr. Ahmed Hassan",
        role: "lecturer_doctor",
        organization: "Central Hospital",
        position: "Chief Cardiologist",
        verified: true,
        profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        active: true,
      },
      {
        username: "sarah.johnson",
        email: "sarah.johnson@hospital.org",
        password: doctorPassword,
        fullName: "Dr. Sarah Johnson",
        role: "participant_doctor",
        organization: "University Medical Center",
        position: "Pediatrician",
        verified: true,
        profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        active: true,
      },
      {
        username: "michael.rodriguez",
        email: "michael.rodriguez@hospital.org",
        password: doctorPassword,
        fullName: "Dr. Michael Rodriguez",
        role: "participant_doctor",
        organization: "Children's Hospital",
        position: "Neurologist",
        verified: true,
        profileImage: "https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        active: true,
      },
    ]).returning();
    
    console.log(`✅ Created ${users.length} users`);

    // Assign permissions to users
    console.log("Assigning permissions to users...");
    const superAdmin = users.find(user => user.role === "super_admin");
    const ministryManager = users.find(user => user.role === "ministry_manager");
    const lecturerDoctor = users.find(user => user.role === "lecturer_doctor");
    
    if (superAdmin) {
      // Super admin gets all permissions
      await db.insert(schema.userPermissions).values(
        permissions.map(permission => ({
          userId: superAdmin.id,
          permissionId: permission.id
        }))
      );
    }
    
    if (ministryManager) {
      // Ministry manager gets most permissions except for some admin ones
      const ministryPermissions = permissions.filter(p => 
        !["user:delete", "role:manage"].includes(p.name)
      );
      
      await db.insert(schema.userPermissions).values(
        ministryPermissions.map(permission => ({
          userId: ministryManager.id,
          permissionId: permission.id
        }))
      );
    }
    
    if (lecturerDoctor) {
      // Lecturer doctor gets permissions related to events and certificates
      const lecturerPermissions = permissions.filter(p => 
        ["event:read", "event:create", "event:update", "certificate:generate", "certificate:read", "media:upload", "media:read"].includes(p.name)
      );
      
      await db.insert(schema.userPermissions).values(
        lecturerPermissions.map(permission => ({
          userId: lecturerDoctor.id,
          permissionId: permission.id
        }))
      );
    }

    console.log("✅ Assigned permissions to users");

    // Seed events
    console.log("Seeding events...");
    const events = await db.insert(schema.events).values([
      {
        title: "National Cardiology Conference",
        description: "The National Cardiology Conference is an annual event that brings together cardiac specialists, researchers, and healthcare professionals from across the country to discuss the latest advancements in cardiovascular medicine. This year's conference will focus on innovative treatment approaches, emerging technologies, and preventive care strategies for heart disease.",
        eventType: "conference",
        eventLevel: "national",
        location: "Ministry of Health Conference Center",
        address: "123 Medical Avenue, Capital City",
        startDate: new Date("2023-09-15"),
        endDate: new Date("2023-09-17"),
        startTime: "08:00",
        endTime: "17:00",
        registrationDeadline: new Date("2023-09-10"),
        capacity: 250,
        status: "active",
        coverImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1500&auto=format&fit=crop&q=80&ixlib=rb-4.0.3",
        autoApproveRegistrations: true,
        createdById: ministryManager?.id || 1,
      },
      {
        title: "Medical Research Symposium",
        description: "Join us for the annual Medical Research Symposium where leading researchers share their latest findings and innovations in medical science. This event provides a platform for networking, collaboration, and discussion on cutting-edge medical research across various specialties.",
        eventType: "symposium",
        eventLevel: "provincial",
        location: "Central Hospital",
        address: "456 Health Street, Northern Province",
        startDate: new Date("2023-08-28"),
        endDate: new Date("2023-08-30"),
        startTime: "09:00",
        endTime: "16:00",
        registrationDeadline: new Date("2023-08-20"),
        capacity: 200,
        status: "upcoming",
        coverImage: "https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=1500&auto=format&fit=crop&q=80&ixlib=rb-4.0.3",
        autoApproveRegistrations: false,
        createdById: ministryManager?.id || 1,
      },
      {
        title: "Pediatric Healthcare Workshop",
        description: "A comprehensive workshop focused on the latest developments in pediatric healthcare, featuring hands-on training sessions, case studies, and expert presentations on child health and wellness strategies.",
        eventType: "workshop",
        eventLevel: "local",
        location: "Children's Hospital",
        address: "789 Child Care Road, Eastern District",
        startDate: new Date("2023-08-21"),
        endDate: new Date("2023-08-22"),
        startTime: "09:30",
        endTime: "15:30",
        registrationDeadline: new Date("2023-08-15"),
        capacity: 150,
        status: "completed",
        coverImage: "https://images.unsplash.com/photo-1581594549595-35f6edc7b762?w=1500&auto=format&fit=crop&q=80&ixlib=rb-4.0.3",
        autoApproveRegistrations: true,
        createdById: lecturerDoctor?.id || 3,
      },
    ]).returning();
    
    console.log(`✅ Created ${events.length} events`);

    // Seed event speakers
    console.log("Seeding event speakers...");
    const eventSpeakers = await db.insert(schema.eventSpeakers).values([
      {
        eventId: events[0].id,
        name: "Dr. Sarah Johnson",
        title: "Chief Cardiologist",
        organization: "National Heart Institute",
        bio: "Dr. Sarah Johnson is a renowned cardiologist with over 15 years of experience in cardiovascular medicine and research. She specializes in preventive cardiology and has published numerous papers on heart disease prevention strategies.",
        photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80&ixlib=rb-4.0.3",
      },
      {
        eventId: events[0].id,
        name: "Dr. Michael Rodriguez",
        title: "Director of Cardiac Research",
        organization: "University Medical Center",
        bio: "Dr. Rodriguez leads the cardiac research department at University Medical Center. His work focuses on innovative treatment approaches for complex cardiac conditions and he has pioneered several surgical techniques in the field.",
        photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80&ixlib=rb-4.0.3",
      },
      {
        eventId: events[1].id,
        name: "Dr. Ahmed Hassan",
        title: "Chief of Medical Research",
        organization: "Central Hospital",
        bio: "With a PhD in medical research and over 20 years of clinical experience, Dr. Hassan has led numerous breakthrough studies in the field of medicine. His current focus is on translational research bridging laboratory findings with clinical applications.",
        photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80&ixlib=rb-4.0.3",
      },
    ]).returning();
    
    console.log(`✅ Created ${eventSpeakers.length} event speakers`);

    // Seed event schedules
    console.log("Seeding event schedules...");
    await db.insert(schema.eventSchedules).values([
      {
        eventId: events[0].id,
        title: "Opening Ceremony",
        description: "Welcome address and introduction to the conference",
        date: new Date("2023-09-15"),
        startTime: "08:00",
        endTime: "09:00",
        location: "Main Hall",
      },
      {
        eventId: events[0].id,
        title: "Keynote: Advances in Preventive Cardiology",
        description: "An overview of the latest research and techniques in preventing cardiovascular disease",
        speakerId: eventSpeakers[0].id,
        date: new Date("2023-09-15"),
        startTime: "09:15",
        endTime: "10:30",
        location: "Main Hall",
      },
      {
        eventId: events[0].id,
        title: "Coffee Break & Networking",
        description: "Refreshments and networking opportunity",
        date: new Date("2023-09-15"),
        startTime: "10:30",
        endTime: "11:00",
        location: "Exhibition Area",
      },
    ]);
    
    console.log("✅ Created event schedules");

    // Seed event registrations
    console.log("Seeding event registrations...");
    await db.insert(schema.eventRegistrations).values([
      {
        eventId: events[0].id,
        userId: users[3].id, // Sarah Johnson as participant
        status: "approved",
        registrationDate: new Date("2023-08-20"),
        attendanceConfirmed: true,
      },
      {
        eventId: events[0].id,
        userId: users[4].id, // Michael Rodriguez as participant
        status: "approved",
        registrationDate: new Date("2023-08-15"),
        attendanceConfirmed: true,
      },
      {
        eventId: events[1].id,
        userId: users[3].id, // Sarah Johnson as participant
        status: "approved",
        registrationDate: new Date("2023-08-05"),
        attendanceConfirmed: false,
      },
    ]);
    
    console.log("✅ Created event registrations");

    // Seed notifications
    console.log("Seeding notifications...");
    await db.insert(schema.notifications).values([
      {
        userId: users[1].id, // Ministry manager
        title: "New event registration",
        message: "New event registration approval needed for National Cardiology Conference",
        read: false,
        link: "/events/1",
      },
      {
        userId: users[1].id, // Ministry manager
        title: "Certificate revocation request",
        message: "Certificate revocation request pending for review",
        read: false,
        link: "/certificates",
      },
      {
        userId: users[1].id, // Ministry manager
        title: "Event updated",
        message: "National Cardiology Conference has been updated",
        read: true,
        link: "/events/1",
      },
    ]);
    
    console.log("✅ Created notifications");

    console.log("🌱 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during database seeding:", error);
    throw error;
  }
}

seed();
