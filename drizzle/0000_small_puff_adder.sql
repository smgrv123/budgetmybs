CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`custom_type` text,
	`icon` text,
	`color` text,
	`is_predefined` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `debts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`custom_type` text,
	`principal` real NOT NULL,
	`remaining` real NOT NULL,
	`interest_rate` real NOT NULL,
	`emi_amount` real NOT NULL,
	`tenure_months` integer NOT NULL,
	`remaining_months` integer NOT NULL,
	`start_date` text,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` real NOT NULL,
	`category_id` text NOT NULL,
	`description` text,
	`date` text DEFAULT (date('now')) NOT NULL,
	`was_impulse` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fixed_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`custom_type` text,
	`amount` real NOT NULL,
	`day_of_month` integer,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `monthly_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`month` text NOT NULL,
	`frivolous_budget` real NOT NULL,
	`rollover_from_previous` real DEFAULT 0 NOT NULL,
	`is_closed` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_snapshots_month_unique` ON `monthly_snapshots` (`month`);--> statement-breakpoint
CREATE TABLE `profile` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`salary` real NOT NULL,
	`frivolous_budget` real NOT NULL,
	`monthly_savings_target` real NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `savings_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`custom_type` text,
	`target_amount` real NOT NULL,
	`icon` text,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
