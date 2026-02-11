ALTER TABLE "newsletters" ADD COLUMN "markdown_body" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "newsletters" DROP COLUMN "html_body";
--> statement-breakpoint
ALTER TABLE "newsletters" DROP COLUMN "text_body";
--> statement-breakpoint
ALTER TABLE "newsletters" ALTER COLUMN "markdown_body" DROP DEFAULT;
