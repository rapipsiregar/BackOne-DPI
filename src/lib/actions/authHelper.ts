// src/lib/actions/authHelper.ts
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-backone-key';

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: string;
  site_uuid?: string;
  agent_uuid?: string;
  agent_uuids?: string[];
}

export async function getAuthUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded || null;
  } catch (err) {
    console.error('[getAuthUser] Failed to decode JWT token:', err);
    return null;
  }
}
