import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const mongoDbName = process.env.MONGODB_DB ?? "slotbook";

if (!mongoUri) {
  throw new Error("Missing MONGODB_URI environment variable.");
}

const now = new Date();
const utc = (isoDateTime) => new Date(`${isoDateTime}Z`);

const sampleSlots = [
  {
    title: "Executive Strategy Consultation",
    description:
      "A focused one-to-one planning session for founders and team leads who want a clear roadmap, a cleaner backlog, and faster decision-making.",
    venueName: "North Tower Suite 12B",
    conductorName: "Avery Collins",
    category: "Consultation",
    format: "In-person",
    audience: "Founders and product leaders",
    highlights: [
      "Priority advisory session for growth decisions",
      "Ideal for roadmap reviews and client escalation planning",
      "Whiteboard collaboration with live notes",
    ],
    featured: true,
    roomLabel: "Suite 12B",
    meetingUrl: null,
    startTime: utc("2026-06-02T09:00:00"),
    endTime: utc("2026-06-02T10:00:00"),
    timezone: "UTC",
    capacity: 6,
    bookedCount: 2,
    isArchived: false,
    deletedAt: null,
    createdAt: now,
  },
  {
    title: "Design Systems Workshop",
    description:
      "Hands-on workshop for teams that want to align on spacing, typography, component tokens, and product-ready UI consistency.",
    venueName: "Studio 4, Horizon Lab",
    conductorName: "Mina Patel",
    category: "Workshop",
    format: "Hybrid",
    audience: "Design and engineering teams",
    highlights: [
      "Practical component audit and system cleanup",
      "Hybrid participation for remote collaborators",
      "Includes a live critique and implementation checklist",
    ],
    featured: true,
    roomLabel: "Studio 4",
    meetingUrl: "https://meet.example.com/design-systems",
    startTime: utc("2026-06-02T13:30:00"),
    endTime: utc("2026-06-02T15:00:00"),
    timezone: "UTC",
    capacity: 14,
    bookedCount: 9,
    isArchived: false,
    deletedAt: null,
    createdAt: now,
  },
  {
    title: "Leadership Performance Review",
    description:
      "A structured review session for managers and department leads to evaluate progress, blockers, and next-quarter priorities.",
    venueName: "Boardroom C",
    conductorName: "Jordan Reyes",
    category: "Meeting",
    format: "In-person",
    audience: "Leadership and operations",
    highlights: [
      "Private boardroom setting with executive pacing",
      "Clear agenda review and follow-up ownership",
      "Best for quarterly planning and alignment",
    ],
    featured: false,
    roomLabel: "Boardroom C",
    meetingUrl: null,
    startTime: utc("2026-06-03T11:00:00"),
    endTime: utc("2026-06-03T11:45:00"),
    timezone: "UTC",
    capacity: 8,
    bookedCount: 8,
    isArchived: false,
    deletedAt: null,
    createdAt: now,
  },
  {
    title: "Live Product Demo Session",
    description:
      "A polished showcase slot designed for clients, investors, and internal stakeholders to experience the product in action.",
    venueName: "Virtual Demo Theater",
    conductorName: "Samira Khan",
    category: "Performance",
    format: "Virtual",
    audience: "Customers and stakeholders",
    highlights: [
      "Narrated demo with guided feature walkthrough",
      "Perfect for showcasing release highlights",
      "Includes live Q&A and feedback capture",
    ],
    featured: true,
    roomLabel: "Virtual stage",
    meetingUrl: "https://meet.example.com/product-demo",
    startTime: utc("2026-06-04T16:00:00"),
    endTime: utc("2026-06-04T16:45:00"),
    timezone: "UTC",
    capacity: 40,
    bookedCount: 18,
    isArchived: false,
    deletedAt: null,
    createdAt: now,
  },
  {
    title: "Client Success Clinic",
    description:
      "A structured support clinic for customer success teams to troubleshoot adoption issues and plan retention-focused follow-up.",
    venueName: "Client Services Room 2",
    conductorName: "Elena Morris",
    category: "Consultation",
    format: "In-person",
    audience: "Customer success managers",
    highlights: [
      "Fast issue triage and account planning",
      "Useful for onboarding and retention conversations",
      "Reserved for high-touch customer accounts",
    ],
    featured: false,
    roomLabel: "Room 2",
    meetingUrl: null,
    startTime: utc("2026-06-05T10:30:00"),
    endTime: utc("2026-06-05T11:15:00"),
    timezone: "UTC",
    capacity: 10,
    bookedCount: 3,
    isArchived: false,
    deletedAt: null,
    createdAt: now,
  },
  {
    title: "Archived Evening Planning Session",
    description:
      "A previously used planning slot kept in the collection as an archived record for historical reporting and audits.",
    venueName: "Old Studio 1",
    conductorName: "Taylor Singh",
    category: "Training",
    format: "In-person",
    audience: "Internal operations",
    highlights: [
      "Historical record only",
      "Useful for analytics and admin review",
      "Not bookable from the public site",
    ],
    featured: false,
    roomLabel: "Old Studio 1",
    meetingUrl: null,
    startTime: utc("2026-05-18T17:00:00"),
    endTime: utc("2026-05-18T18:00:00"),
    timezone: "UTC",
    capacity: 12,
    bookedCount: 12,
    isArchived: true,
    deletedAt: now,
    createdAt: utc("2026-05-10T08:30:00"),
  },
];

async function main() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(mongoDbName);
    const collection = db.collection("slots");

    const result = await collection.insertMany(sampleSlots, { ordered: true });

    console.log(`Inserted ${Object.keys(result.insertedIds).length} sample slots into ${mongoDbName}.slots`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});