DROP TABLE IF EXISTS entries;
--> statement-breakpoint
CREATE TABLE progress (
  lesson_id TEXT PRIMARY KEY,
  stars INTEGER NOT NULL DEFAULT 0,
  completions INTEGER NOT NULL DEFAULT 0,
  best_correct INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE rewards (
  reward_id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  earned_at INTEGER NOT NULL
);
