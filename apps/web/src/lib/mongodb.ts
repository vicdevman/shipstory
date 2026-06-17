import mongoose, { Schema } from 'mongoose';

const uri = process.env.MONGODB_URI || process.env.MONGDB_URI || '';

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectMongoose() {
  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI" or "MONGDB_URI"');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: 'shipstory',
    } as any;
    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Flexible mongoose schema for dynamic Company Brain state
const CompanyBrainSchema = new Schema(
  {
    _id: { type: String, required: true },
  },
  { strict: false, collection: 'company_brain' }
);

export const CompanyBrain = mongoose.models.CompanyBrain || mongoose.model('CompanyBrain', CompanyBrainSchema);

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
