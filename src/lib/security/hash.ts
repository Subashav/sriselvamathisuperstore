import { createHash, randomInt } from "crypto";

export const sha256 = (value: string) => {
  return createHash("sha256").update(value).digest("hex");
};

export const generateOtp = () => {
  return randomInt(100000, 999999).toString();
};
