ALTER TABLE `expenses` ADD `receivable_amount` real;--> statement-breakpoint
ALTER TABLE `expenses` ADD `receivable_settled` integer DEFAULT 0 NOT NULL;