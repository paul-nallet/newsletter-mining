CREATE TYPE "public"."analysis_credit_status" AS ENUM('reserved', 'consumed', 'released');--> statement-breakpoint
CREATE TABLE "analysis_credit_months" (
	"period_start" date PRIMARY KEY NOT NULL,
	"credit_limit" integer DEFAULT 50 NOT NULL,
	"reserved_count" integer DEFAULT 0 NOT NULL,
	"consumed_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analysis_credit_months_reserved_non_negative" CHECK ("analysis_credit_months"."reserved_count" >= 0),
	CONSTRAINT "analysis_credit_months_consumed_non_negative" CHECK ("analysis_credit_months"."consumed_count" >= 0),
	CONSTRAINT "analysis_credit_months_consumed_within_limit" CHECK ("analysis_credit_months"."consumed_count" <= "analysis_credit_months"."credit_limit"),
	CONSTRAINT "analysis_credit_months_total_within_limit" CHECK ("analysis_credit_months"."reserved_count" + "analysis_credit_months"."consumed_count" <= "analysis_credit_months"."credit_limit")
);
--> statement-breakpoint
CREATE TABLE "analysis_credit_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_start" date NOT NULL,
	"newsletter_id" uuid NOT NULL,
	"source" text NOT NULL,
	"status" "analysis_credit_status" DEFAULT 'reserved' NOT NULL,
	"failure_reason" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finalized_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "analysis_credit_reservations" ADD CONSTRAINT "analysis_credit_reservations_period_start_analysis_credit_months_period_start_fk" FOREIGN KEY ("period_start") REFERENCES "public"."analysis_credit_months"("period_start") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_credit_reservations" ADD CONSTRAINT "analysis_credit_reservations_newsletter_id_newsletters_id_fk" FOREIGN KEY ("newsletter_id") REFERENCES "public"."newsletters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analysis_credit_reservations_period_status_idx" ON "analysis_credit_reservations" USING btree ("period_start","status");--> statement-breakpoint
CREATE INDEX "analysis_credit_reservations_newsletter_status_idx" ON "analysis_credit_reservations" USING btree ("newsletter_id","status");--> statement-breakpoint
CREATE INDEX "analysis_credit_reservations_expires_at_idx" ON "analysis_credit_reservations" USING btree ("expires_at");