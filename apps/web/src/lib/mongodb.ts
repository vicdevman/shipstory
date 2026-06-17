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

function parseAgentConfig(yamlText: string) {
  const config: any = {};
  let currentKey = '';
  const lines = yamlText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (trimmed.endsWith(':')) {
      currentKey = trimmed.slice(0, -1).trim();
      config[currentKey] = {};
    } else if (currentKey && trimmed.includes(':')) {
      const parts = trimmed.split(':');
      const key = parts[0].trim();
      const val = parts.slice(1).join(':').trim().replace(/['"]/g, '');
      config[currentKey][key] = val;
    }
  }
  return config;
}

export function getAgentConfig() {
  const path = require('path');
  const fs = require('fs');
  const cwd = process.cwd();
  const paths = [
    path.join(cwd, '../../agents/agent_config.yaml'),
    path.join(cwd, 'agents/agent_config.yaml'),
    path.join(cwd, '../agents/agent_config.yaml'),
    path.join(cwd, 'apps/web/../../agents/agent_config.yaml'),
    'C:/Users/User/OneDrive/Desktop/projects/shipstory/agents/agent_config.yaml'
  ];

  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        const yamlText = fs.readFileSync(p, 'utf8');
        return parseAgentConfig(yamlText);
      }
    } catch (e) {
      console.warn(`Failed reading agent config path ${p}:`, e);
    }
  }
  return null;
}

