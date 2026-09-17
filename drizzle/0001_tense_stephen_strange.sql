CREATE TABLE `activity` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`section` text NOT NULL,
	`action` text NOT NULL,
	`actor` text NOT NULL,
	`actor_id` text NOT NULL,
	`before_json` text,
	`after_json` text,
	`at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `calendar_links` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`date_field` text NOT NULL,
	`external_id` text,
	`external_url` text,
	`mode` text DEFAULT 'workspace' NOT NULL,
	`synced_value` text,
	`external_value` text,
	`etag` text,
	`status` text DEFAULT 'Not synced' NOT NULL,
	`error` text,
	`synced_at` text
);
--> statement-breakpoint
CREATE TABLE `members` (
	`email` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`areas` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
