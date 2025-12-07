import dotenv from "dotenv";
dotenv.config();
export const env = {
  PORT: process.env.PORT || 4000,
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-me",
  MOOV_BASE_URL: process.env.MOOV_BASE_URL || "https://api.moov.io",
  MOOV_ACCOUNT_ID: process.env.MOOV_ACCOUNT_ID || ""
};