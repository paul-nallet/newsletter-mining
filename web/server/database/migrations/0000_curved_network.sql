CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."analysis_credit_status" AS ENUM('reserved', 'consumed', 'released');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('pricing', 'feature-gap', 'ux', 'performance', 'integration', 'other');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('file', 'mailgun');--> statement-breakpoint
CREATE TYPE "public"."trend" AS ENUM('emerging', 'stable', 'declining');--> statement-breakpoint
CREATE TABLE "analysis_credit_months" (
	"user_id" text NOT NULL,
	"period_start" date NOT NULL,
	"credit_limit" integer DEFAULT 50 NOT NULL,
	"reserved_count" integer DEFAULT 0 NOT NULL,
	"consumed_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analysis_credit_months_user_id_period_start_pk" PRIMARY KEY("user_id","period_start"),
	CONSTRAINT "analysis_credit_months_reserved_non_negative" CHECK ("analysis_credit_months"."reserved_count" >= 0),
	CONSTRAINT "analysis_credit_months_consumed_non_negative" CHECK ("analysis_credit_months"."consumed_count" >= 0),
	CONSTRAINT "analysis_credit_months_consumed_within_limit" CHECK ("analysis_credit_months"."consumed_count" <= "analysis_credit_months"."credit_limit"),
	CONSTRAINT "analysis_credit_months_total_within_limit" CHECK ("analysis_credit_months"."reserved_count" + "analysis_credit_months"."consumed_count" <= "analysis_credit_months"."credit_limit")
);
--> statement-breakpoint
CREATE TABLE "analysis_credit_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
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
CREATE TABLE "newsletters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"from_email" text DEFAULT '',
	"from_name" text DEFAULT '',
	"subject" text DEFAULT '',
	"html_body" text DEFAULT '',
	"text_body" text NOT NULL,
	"analyzed" boolean DEFAULT false NOT NULL,
	"analyzed_at" timestamp with time zone,
	"source_type" "source_type" DEFAULT 'file' NOT NULL,
	"source_vertical" varchar(100),
	"overall_sentiment" text,
	"key_topics" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_clusters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"cluster_name" text NOT NULL,
	"cluster_summary" text DEFAULT '',
	"problem_ids" jsonb DEFAULT '[]'::jsonb,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"mention_count" integer DEFAULT 0 NOT NULL,
	"trend" "trend" DEFAULT 'stable' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"newsletter_id" uuid NOT NULL,
	"problem_summary" text NOT NULL,
	"problem_detail" text NOT NULL,
	"category" "category" DEFAULT 'other' NOT NULL,
	"severity" "severity" DEFAULT 'medium' NOT NULL,
	"original_quote" text DEFAULT '',
	"context" text DEFAULT '',
	"signals" jsonb DEFAULT '[]'::jsonb,
	"mentioned_tools" jsonb DEFAULT '[]'::jsonb,
	"target_audience" text DEFAULT '',
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"ingest_email" varchar(320) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist_signups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"source" varchar(120) DEFAULT 'landing' NOT NULL,
	"ip_hash" varchar(128) DEFAULT '',
	"user_agent" text DEFAULT '',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analysis_credit_reservations" ADD CONSTRAINT "analysis_credit_reservations_newsletter_id_newsletters_id_fk" FOREIGN KEY ("newsletter_id") REFERENCES "public"."newsletters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problems" ADD CONSTRAINT "problems_newsletter_id_newsletters_id_fk" FOREIGN KEY ("newsletter_id") REFERENCES "public"."newsletters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analysis_credit_reservations_period_status_idx" ON "analysis_credit_reservations" USING btree ("period_start","status");--> statement-breakpoint
CREATE INDEX "analysis_credit_reservations_newsletter_status_idx" ON "analysis_credit_reservations" USING btree ("newsletter_id","status");--> statement-breakpoint
CREATE INDEX "analysis_credit_reservations_expires_at_idx" ON "analysis_credit_reservations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "newsletters_user_id_idx" ON "newsletters" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "problem_clusters_user_id_idx" ON "problem_clusters" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "problems_user_id_idx" ON "problems" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "problems_newsletter_id_idx" ON "problems" USING btree ("newsletter_id");--> statement-breakpoint
CREATE INDEX "problems_severity_idx" ON "problems" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "problems_category_idx" ON "problems" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_ingest_email_idx" ON "user_profiles" USING btree ("ingest_email");--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_signups_email_unique_idx" ON "waitlist_signups" USING btree ("email");--> statement-breakpoint
CREATE INDEX "waitlist_signups_created_at_idx" ON "waitlist_signups" USING btree ("created_at");