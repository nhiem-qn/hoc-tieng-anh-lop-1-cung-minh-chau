import { defineAction, z, type ActionsModule } from "@hatch/space-sdk";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

const progressItem = z.object({
  lessonId: z.string(),
  stars: z.number(),
  completions: z.number(),
  bestCorrect: z.number(),
  totalQuestions: z.number(),
  updatedAt: z.string(),
});

const rewardItem = z.object({
  rewardId: z.string(),
  kind: z.string(),
  earnedAt: z.string(),
});

const speechItem = z.object({
  lessonId: z.string(),
  bestScore: z.number(),
  lastScore: z.number(),
  attempts: z.number(),
  updatedAt: z.string(),
});

const discoveryItem = z.object({
  mapId: z.string(),
  objectKey: z.string(),
});

const stateResponse = z.object({
  progress: z.array(progressItem),
  rewards: z.array(rewardItem),
  speechScores: z.array(speechItem),
  discoveries: z.array(discoveryItem),
});

export const Actions = {
  getState: defineAction({
    request: z.object({}),
    response: stateResponse,
    async handler(ctx): Promise<z.infer<typeof stateResponse>> {
      const db = ctx.db<typeof schema>();
      const pRows = await db.select().from(schema.progress);
      const rRows = await db.select().from(schema.rewards);
      const sRows = await db.select().from(schema.speechScores);
      const dRows = await db.select().from(schema.exploreDiscoveries);
      return {
        progress: pRows.map((r) => ({
          lessonId: r.lessonId,
          stars: r.stars,
          completions: r.completions,
          bestCorrect: r.bestCorrect,
          totalQuestions: r.totalQuestions,
          updatedAt: r.updatedAt.toISOString(),
        })),
        rewards: rRows.map((r) => ({
          rewardId: r.rewardId,
          kind: r.kind,
          earnedAt: r.earnedAt.toISOString(),
        })),
        speechScores: sRows.map((r) => ({
          lessonId: r.lessonId,
          bestScore: r.bestScore,
          lastScore: r.lastScore,
          attempts: r.attempts,
          updatedAt: r.updatedAt.toISOString(),
        })),
        discoveries: dRows.map((r) => ({
          mapId: r.mapId,
          objectKey: r.objectKey,
        })),
      };
    },
  }),

  discoverObject: defineAction({
    description:
      "Ghi một đồ vật bé vừa khám phá trong Game Khám Phá 3D vào Sổ Khám Phá; khi đủ 100% vật của map thì tặng sticker thám hiểm của map đó.",
    request: z.object({
      mapId: z.string().min(1).max(32),
      objectKey: z.string().min(1).max(80),
      totalObjects: z.number().int().min(1).max(40),
    }),
    response: z.object({
      discoveredCount: z.number(),
      mapComplete: z.boolean(),
      newStickerId: z.string().nullable(),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const existing = await db
        .select()
        .from(schema.exploreDiscoveries)
        .where(eq(schema.exploreDiscoveries.mapId, args.mapId));
      const already = existing.some((r) => r.objectKey === args.objectKey);
      if (!already) {
        await db.insert(schema.exploreDiscoveries).values({
          mapId: args.mapId,
          objectKey: args.objectKey,
          discoveredAt: new Date(),
        });
      }
      const discoveredCount = existing.length + (already ? 0 : 1);
      const mapComplete = discoveredCount >= args.totalObjects;
      let newStickerId: string | null = null;
      if (mapComplete) {
        const stickerId = `stk-explorer-${args.mapId}`;
        const found = await db
          .select()
          .from(schema.rewards)
          .where(eq(schema.rewards.rewardId, stickerId))
          .limit(1);
        if (!found[0]) {
          await db.insert(schema.rewards).values({
            rewardId: stickerId,
            kind: "sticker",
            earnedAt: new Date(),
          });
          newStickerId = stickerId;
        }
      }
      ctx.invalidateQueries();
      return { discoveredCount, mapComplete, newStickerId };
    },
  }),

  saveSpeechScore: defineAction({
    request: z.object({
      lessonId: z.string().min(1).max(64),
      score: z.number().int().min(0).max(100),
    }),
    response: z.object({
      bestScore: z.number(),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const existing = await db
        .select()
        .from(schema.speechScores)
        .where(eq(schema.speechScores.lessonId, args.lessonId))
        .limit(1);
      const prev = existing[0];
      const now = new Date();
      let bestScore = args.score;
      if (prev) {
        bestScore = Math.max(prev.bestScore, args.score);
        await db
          .update(schema.speechScores)
          .set({
            bestScore,
            lastScore: args.score,
            attempts: prev.attempts + 1,
            updatedAt: now,
          })
          .where(eq(schema.speechScores.lessonId, args.lessonId));
      } else {
        await db.insert(schema.speechScores).values({
          lessonId: args.lessonId,
          bestScore: args.score,
          lastScore: args.score,
          attempts: 1,
          updatedAt: now,
        });
      }
      ctx.invalidateQueries();
      return { bestScore };
    },
  }),

  grantRewards: defineAction({
    request: z.object({
      rewardIds: z.array(z.string().min(1).max(80)).max(10),
    }),
    response: z.object({
      newRewardIds: z.array(z.string()),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const now = new Date();
      const newRewardIds: string[] = [];
      for (const id of args.rewardIds) {
        const found = await db
          .select()
          .from(schema.rewards)
          .where(eq(schema.rewards.rewardId, id))
          .limit(1);
        if (!found[0]) {
          await db.insert(schema.rewards).values({
            rewardId: id,
            kind: "sticker",
            earnedAt: now,
          });
          newRewardIds.push(id);
        }
      }
      ctx.invalidateQueries();
      return { newRewardIds };
    },
  }),

  completeLesson: defineAction({
    request: z.object({
      lessonId: z.string().min(1).max(64),
      correct: z.number().int().min(0).max(100),
      total: z.number().int().min(1).max(100),
      rewardIds: z.array(z.string().min(1).max(80)).max(10).default([]),
      giftId: z.string().max(80).nullable().default(null),
    }),
    response: z.object({
      stars: z.number(),
      newRewardIds: z.array(z.string()),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      // Sao theo tỉ lệ đúng của chính lượt chơi này: >=90% → 3 sao, >=60% → 2, còn lại 1.
      const ratio = args.total > 0 ? args.correct / args.total : 0;
      const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;

      const existing = await db
        .select()
        .from(schema.progress)
        .where(eq(schema.progress.lessonId, args.lessonId))
        .limit(1);
      const prev = existing[0];
      const now = new Date();
      if (prev) {
        await db
          .update(schema.progress)
          .set({
            stars: Math.max(prev.stars, stars),
            completions: prev.completions + 1,
            bestCorrect: Math.max(prev.bestCorrect, args.correct),
            totalQuestions: args.total,
            updatedAt: now,
          })
          .where(eq(schema.progress.lessonId, args.lessonId));
      } else {
        await db.insert(schema.progress).values({
          lessonId: args.lessonId,
          stars,
          completions: 1,
          bestCorrect: args.correct,
          totalQuestions: args.total,
          updatedAt: now,
        });
      }

      // Ghi nhận sticker/quà mới (bỏ qua cái đã có).
      const wanted: { id: string; kind: string }[] = [
        ...args.rewardIds.map((id) => ({ id, kind: "sticker" })),
        ...(args.giftId ? [{ id: args.giftId, kind: "gift" }] : []),
      ];
      const newRewardIds: string[] = [];
      for (const item of wanted) {
        const found = await db
          .select()
          .from(schema.rewards)
          .where(eq(schema.rewards.rewardId, item.id))
          .limit(1);
        if (!found[0]) {
          await db.insert(schema.rewards).values({
            rewardId: item.id,
            kind: item.kind,
            earnedAt: now,
          });
          newRewardIds.push(item.id);
        }
      }

      ctx.invalidateQueries();
      return { stars, newRewardIds };
    },
  }),
} satisfies ActionsModule;
