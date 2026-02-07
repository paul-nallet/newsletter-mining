CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('pricing', 'feature-gap', 'ux', 'performance', 'integration', 'other');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('file', 'mailgun');--> statement-breakpoint
CREATE TYPE "public"."trend" AS ENUM('emerging', 'stable', 'declining');--> statement-breakpoint
CREATE TABLE "newsletters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
ALTER TABLE "problems" ADD CONSTRAINT "problems_newsletter_id_newsletters_id_fk" FOREIGN KEY ("newsletter_id") REFERENCES "public"."newsletters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "problems_newsletter_id_idx" ON "problems" USING btree ("newsletter_id");--> statement-breakpoint
CREATE INDEX "problems_severity_idx" ON "problems" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "problems_category_idx" ON "problems" USING btree ("category");