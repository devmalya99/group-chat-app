import type { User } from "@/services/db/schema";
import type { AuthUser } from "../types/auth.types";

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
  };
}
