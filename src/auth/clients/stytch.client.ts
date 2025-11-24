import { Stytch } from "stytch";

export const stytchClient = new Stytch({
  project_id: process.env.STYTCH_PROJECT_ID,
  secret: process.env.STYTCH_SECRET,
  env: process.env.NODE_ENV === "production" ? "live" : "test",
});
