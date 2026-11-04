CREATE TABLE `explore_discoveries` (
	`map_id` text NOT NULL,
	`object_key` text NOT NULL,
	`discovered_at` integer NOT NULL,
	PRIMARY KEY(`map_id`, `object_key`)
);
