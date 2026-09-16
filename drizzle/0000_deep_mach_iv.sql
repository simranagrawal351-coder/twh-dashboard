CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL
);
