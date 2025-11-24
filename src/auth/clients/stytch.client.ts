import { Client } from "stytch";

export const stytchClient = new Client({
  project_id: process.env.STYTCH_PROJECT_ID,
  secret: process.env.STYTCH_SECRET,
  env: process.env.NODE_ENV === "production" ? "live" : "test",
});
