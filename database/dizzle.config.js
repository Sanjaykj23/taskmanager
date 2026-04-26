import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";
import dotenv from "dotenv";

// Supabase connection string (from Supabase dashboard → Settings → Database)
const pool = new Pool({
  connectionString: process.env.SUPERBASE_URL, // store in .env
});

export const db = drizzle(pool, { schema });
