export const env = {
  port: Number(process.env.PORT || 8080),
  isProd: process.env.NODE_ENV === "production",
  mongoUri: process.env.MONGODB_URI || "",
  mongoDb: process.env.MONGODB_DB || "foldifyer",
  jwtSecret: process.env.JWT_SECRET || "",
  geminiKey: process.env.GEMINI_API_KEY || "",
  geminiTextModel: process.env.GEMINI_TEXT_MODEL || "gemini-3.8-flash",
  geminiImageModel: process.env.GEMINI_IMAGE_MODEL || "gemini-nano-banana-2.1",
  geminiImageSize: process.env.GEMINI_IMAGE_SIZE || "1K",
  // Optional Cloudflare R2 for pictures. When all five are set, NEW pictures go to R2 instead of MongoDB.
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || "", accessKey: process.env.R2_ACCESS_KEY_ID || "", secret: process.env.R2_SECRET_ACCESS_KEY || "",
    bucket: process.env.R2_BUCKET || "", publicUrl: (process.env.R2_PUBLIC_URL || "").replace(/\/$/, ""),
  },
  mongoLimitMb: Number(process.env.MONGODB_LIMIT_MB || 512),
  revenuecatSecret: process.env.REVENUECAT_SECRET_KEY || "",
  /** For tests: figures are not counted and the Club is open for everyone. */
  devAllPro: process.env.DEV_ALL_PRO === "true",
  publicUrl: (process.env.PUBLIC_URL || "").replace(/\/$/, ""),
  /** Figures a new device can make for free. */
  freeFigs: Number(process.env.FREE_FIGURES || 1),
  perDay: Number(process.env.FIGURES_PER_DAY || 20),
  /** How many figures each one-time pack adds (RevenueCat product id → figures). */
  packs: { foldifyer_pack3: 3, foldifyer_pack10: 10 } as Record<string, number>,
  /** RevenueCat entitlement of the Club subscription, and how many figures it includes each calendar month. */
  clubEntitlement: process.env.REVENUECAT_ENTITLEMENT || "club",
  clubFigs: Number(process.env.CLUB_FIGURES_PER_MONTH || 5),
};

export const demoMode = () => !env.geminiKey && !env.isProd;

export function assertEnv() {
  const missing = [
    !env.mongoUri && "MONGODB_URI",
    env.jwtSecret.length < 32 && "JWT_SECRET (32+ chars)",
    env.isProd && !env.geminiKey && "GEMINI_API_KEY",
    env.isProd && !env.revenuecatSecret && !env.devAllPro && "REVENUECAT_SECRET_KEY",
  ].filter(Boolean);
  if (missing.length) throw new Error(`Missing env: ${missing.join(", ")}`);
}

export const r2On = () => !!(env.r2.accountId && env.r2.accessKey && env.r2.secret && env.r2.bucket && env.r2.publicUrl);
