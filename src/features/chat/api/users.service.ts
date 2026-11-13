import { eq } from "drizzle-orm";
import { db } from "@/services/db";
import { users } from "@/services/db/schema";
import type { LookupUser } from "../types/chat.types";

export async function findUserByEmail(
  email: string,
): Promise<LookupUser | null> {
  const normalized = email.trim().toLowerCase();

  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);

  return row ?? null;
}
