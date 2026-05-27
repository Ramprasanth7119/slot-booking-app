import { MongoClient } from "mongodb";

const mongoDbName = process.env.MONGODB_DB ?? "slotbook";
const mongoClientOptions = {
  serverSelectionTimeoutMS: 500,
  connectTimeoutMS: 500,
  socketTimeoutMS: 1000,
  waitQueueTimeoutMS: 500,
  directConnection: true,
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