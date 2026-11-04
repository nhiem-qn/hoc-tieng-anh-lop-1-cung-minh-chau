import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Tiến độ từng bài học (Unit SGK hoặc mục mở rộng), khóa theo lesson_id. */
export const progress = sqliteTable("progress", {
  lessonId: text("lesson_id").primaryKey(),
  stars: integer("stars").notNull().default(0),
  completions: integer("completions").notNull().default(0),
  bestCorrect: integer("best_correct").notNull().default(0),
  totalQuestions: integer("total_questions").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Sticker và quà bé đã nhận, khóa theo reward_id. */
export const rewards = sqliteTable("rewards", {
  rewardId: text("reward_id").primaryKey(),
  kind: text("kind").notNull(), // "sticker" | "gift"
  earnedAt: integer("earned_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Sổ Khám Phá của Game 3D: đồ vật bé đã bấm vào trong từng map, khóa theo (map_id, object_key). */
export const exploreDiscoveries = sqliteTable(
  "explore_discoveries",
  {
    mapId: text("map_id").notNull(),
    objectKey: text("object_key").notNull(),
    discoveredAt: integer("discovered_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.mapId, t.objectKey] })],
);

/** Điểm đọc lại (nghe & đọc theo cô, chấm bằng nhận diện giọng nói), khóa theo lesson_id. */
export const speechScores = sqliteTable("speech_scores", {
  lessonId: text("lesson_id").primaryKey(),
  bestScore: integer("best_score").notNull().default(0),
  lastScore: integer("last_score").notNull().default(0),
  attempts: integer("attempts").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
