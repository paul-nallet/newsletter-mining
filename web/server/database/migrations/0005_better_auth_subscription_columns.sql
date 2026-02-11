-- Align Better Auth Stripe subscription schema with @better-auth/stripe v1.4.18+
-- Required by callback flow: /api/auth/subscription/success

ALTER TABLE "subscription"
  ADD COLUMN IF NOT EXISTS "cancelAt" timestamp with time zone;

ALTER TABLE "subscription"
  ADD COLUMN IF NOT EXISTS "canceledAt" timestamp with time zone;

ALTER TABLE "subscription"
  ADD COLUMN IF NOT EXISTS "endedAt" timestamp with time zone;

ALTER TABLE "subscription"
  ALTER COLUMN "status" SET DEFAULT 'incomplete';

UPDATE "subscription"
SET "status" = 'incomplete'
WHERE "status" IS NULL;
