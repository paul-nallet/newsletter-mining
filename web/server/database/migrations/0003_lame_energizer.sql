ALTER TABLE "user_profiles" ADD COLUMN "cluster_threshold" real DEFAULT 0.78 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "cluster_min_size" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "auto_recluster" boolean DEFAULT false NOT NULL;