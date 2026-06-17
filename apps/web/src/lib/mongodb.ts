import { MongoClient } from 'mongodb';

const uri = process.env.MONGDB_URI || process.env.MONGODB_URI || '';

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

if (uri) {
  if (process.env.NODE_ENV === 'development') {
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

        if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 10000,
      });
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    clientPromise = client.connect();
  }
}

export async function getMongoCollection() {
  if (!uri || !clientPromise) {
    console.warn('[MongoDB] Connection URI is missing or client is not initialized.');
    return null;
  }
  try {
    const conn = await clientPromise;
    const db = conn.db('shipstory');
    return db.collection<{ _id: string; [key: string]: any }>('company_brain');
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error);
    return null;
  }
}

export async function getLocalFallback(dbPath: string): Promise<any> {
  const fs = require('fs').promises;
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    if (data && data.trim()) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error(`[LocalFallback] Error reading from ${dbPath}:`, e);
  }
  return null;
}

export async function saveLocalFallback(dbPath: string, state: any): Promise<void> {
  const fs = require('fs').promises;
  try {
    const cleanState = JSON.parse(JSON.stringify(state));
    await fs.writeFile(dbPath, JSON.stringify(cleanState, null, 2), 'utf8');
  } catch (e) {
    console.error(`[LocalFallback] Error saving to ${dbPath}:`, e);
  }
}
