import bcrypt from "bcryptjs";
import { env } from "@/lib/config/env";

export const hashPassword = async (value: string) => {
  return bcrypt.hash(value, env.BCRYPT_SALT_ROUNDS);
};

export const verifyPassword = async (value: string, hash: string) => {
  return bcrypt.compare(value, hash);
};
