import { MongoClient, ObjectId } from "mongodb";

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const mongoDbName = process.env.MONGODB_DB ?? "slotbook";

if (!mongoUri) {
  throw new Error("Missing MONGODB_URI environment variable.");
}

const now = new Date();
const hoursFromNow = (h) => new Date(now.getTime() + h * 60 * 60 * 1000);

const professionalSlots = [
  {
    _id: new ObjectId("665a10000000000000000001"),
    title: "Global Architecture Summit 2026",
    description: "Annual gathering of lead architects to discuss distributed systems, edge computing, and AI-native infrastructure scaling.",
    venueName: "Grand Ballroom, Tech Center",
    conductorName: "Dr. Sarah Chen",
    category: "Performance",
    format: "Hybrid",
    audience: "Senior Architects & CTOs",
    highlights: ["Scalability Masterclass", "Edge Computing Roadmap", "Live System Simulation"],
    featured: true,
    roomLabel: "Main Stage",
    meetingUrl: "https://zoom.us/j/arch-summit-2026",
    startTime: hoursFromNow(24),
    endTime: hoursFromNow(28),
    timezone: "UTC",
    capacity: 100,
    bookedCount: 65,
    isArchived: false,
    deletedAt: null,
    createdAt: now,
  },
  {
    _id: new ObjectId("665a10000000000000000002"),
    title: "Executive Leadership 1-on-1",
    description: "Private coaching session focused on organizational growth, team culture, and high-stakes decision making for executives.",
    venueName: "Executive Suite 402",
    conductorName: "Marcus Sterling",
    category: "Consultation",
    format: "In-person",
    audience: "C-level Executives",
    highlights: ["Confidential Advisory", "Leadership Frameworks", "Growth Planning"],
    featured: true,
    roomLabel: "Suite 402",
    meetingUrl: null,
    startTime: hoursFromNow(48),
    endTime: hoursFromNow(49),
    timezone: "UTC",
    capacity: 5,
    bookedCount: 3,
    isArchived: false,
    deletedAt: null,
    createdAt: now,
  },
  {
    _id: new ObjectId("665a10000000000000000003"),
    title: "Security & Compliance Audit",
    description: "Comprehensive review of security protocols, SOC2 readiness, and data privacy frameworks for enterprise platforms.",
    venueName: "Security Lab A",
    conductorName: "Elena Rodriguez",
    category: "Training",
    format: "In-person",
    audience: "IT Managers & Security Officers",
    highlights: ["SOC2 Compliance Mapping", "Vulnerability Assessment", "Data Privacy Lab"],
    featured: false,
    roomLabel: "Lab A",
    meetingUrl: null,
    startTime: hoursFromNow(12),
    endTime: hoursFromNow(15),
    timezone: "UTC",
    capacity: 10,
    bookedCount: 10,
    isArchived: false,
    deletedAt: null,
    createdAt: now,
  },
  {
    _id: new ObjectId("665a10000000000000000004"),
    title: "NextJS 16 Migration Deep Dive",
    description: "Hands-on technical session on migrating enterprise apps to NextJS 16, focusing on React 19 features and Turbopack optimization.",
    venueName: "Virtual Developer Hub",
    conductorName: "Alex Rivera",
    category: "Workshop",
    format: "Virtual",
    audience: "Full-stack Developers",
    highlights: ["React 19 Server Actions", "PPR Implementation", "Turbopack Tuning"],
    featured: true,
    roomLabel: "Virtual Room 1",
    meetingUrl: "https://meet.google.com/nextjs-16-deep-dive",
    startTime: hoursFromNow(72),
    endTime: hoursFromNow(75),
    timezone: "UTC",
    capacity: 50,
    bookedCount: 5,
    isArchived: false,
    deletedAt: null,
    createdAt: now,
  }
];

// Generate real booking records to match the bookedCount
const bookings = [
  // Bookings for Slot 1 (Architecture Summit) - 65 booked
  ...Array.from({ length: 65 }).map((_, i) => ({
    slotId: new ObjectId("665a10000000000000000001"),
    customerName: `Tech Leader ${i + 1}`,
    customerEmail: `leader${i + 1}@enterprise.com`,
    status: "confirmed",
    bookedAt: new Date(now.getTime() - i * 1000 * 60 * 60), // Spread across past days
  })),
  // Add some cancelled ones for Slot 1
  ...Array.from({ length: 5 }).map((_, i) => ({
    slotId: new ObjectId("665a10000000000000000001"),
    customerName: `Former Attendee ${i + 1}`,
    customerEmail: `cancelled${i + 1}@tech.com`,
    status: "cancelled",
    bookedAt: new Date(now.getTime() - i * 1000 * 60 * 120),
  })),

  // Bookings for Slot 2 (Executive 1-on-1) - 3 booked
  {
    slotId: new ObjectId("665a10000000000000000002"),
    customerName: "Alice Henderson",
    customerEmail: "alice.h@fortune500.com",
    status: "confirmed",
    bookedAt: hoursFromNow(-5),
  },
  {
    slotId: new ObjectId("665a10000000000000000002"),
    customerName: "Bob Vances",
    customerEmail: "bob.v@refrigeration.com",
    status: "confirmed",
    bookedAt: hoursFromNow(-10),
  },
  {
    slotId: new ObjectId("665a10000000000000000002"),
    customerName: "Catherine O'Hara",
    customerEmail: "catherine@comedy.ca",
    status: "confirmed",
    bookedAt: hoursFromNow(-15),
  },

  // Bookings for Slot 3 (Security Audit) - 10 booked (FULL)
  ...Array.from({ length: 10 }).map((_, i) => ({
    slotId: new ObjectId("665a10000000000000000003"),
    customerName: `Security Expert ${i + 1}`,
    customerEmail: `expert${i + 1}@cyber-safe.io`,
    status: "confirmed",
    bookedAt: hoursFromNow(-24 + i),
  })),

  // Bookings for Slot 4 (NextJS 16) - 5 booked
  ...Array.from({ length: 5 }).map((_, i) => ({
    slotId: new ObjectId("665a10000000000000000004"),
    customerName: `Dev ${i + 1}`,
    customerEmail: `dev${i + 1}@github.com`,
    status: "confirmed",
    bookedAt: hoursFromNow(-2),
  }))
];

async function main() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(mongoDbName);
    
    console.log("Cleaning existing data...");
    await db.collection("slots").deleteMany({});
    await db.collection("bookings").deleteMany({});

    console.log("Inserting professional slots...");
    await db.collection("slots").insertMany(professionalSlots);

    console.log("Inserting simulated bookings...");
    await db.collection("bookings").insertMany(bookings);

    console.log("Success! Database has been reset with professional demo data.");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
