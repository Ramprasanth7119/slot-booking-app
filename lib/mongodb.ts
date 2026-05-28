import { MongoClient } from "mongodb";

const mongoDbName = process.env.MONGODB_DB ?? "slotbook";
const mongoClientOptions = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 10000,
  waitQueueTimeoutMS: 5000,
};

type MongoClientCache = {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
};

declare global {
  var mongoClientCache: MongoClientCache | undefined;
}

const cachedClient = globalThis.mongoClientCache ?? { client: null, promise: null };

globalThis.mongoClientCache = cachedClient;

export async function getMongoClient() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  if (cachedClient.client) {
    return cachedClient.client;
  }

  if (!cachedClient.promise) {
    const client = new MongoClient(mongoUri, mongoClientOptions);
    cachedClient.promise = client.connect();
  }

  cachedClient.client = await cachedClient.promise;
  return cachedClient.client;
}

export async function getMongoDb() {
  const client = await getMongoClient();
  return client.db(mongoDbName);
}