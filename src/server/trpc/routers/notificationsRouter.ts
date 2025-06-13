import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { db } from '@/server/db';
import { notifications } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { subscribers } from '@/server/db/schema';

export const notificationsRouter = router({
    getNotifications: publicProcedure
        .input(
            z.object({
                userId: z.string(),
            }),
        )
        .query(async ({ input }) => {
            const { userId } = input;

            const userNotifications = await db
                .select({
                    title: notifications.title,
                    body: notifications.body,
                    sentAt: notifications.sentAt,
                })
                .from(notifications)
                .where(eq(notifications.userId, userId))
                .execute();

            return userNotifications;
        }),
    unsubscribe: publicProcedure
        .input(z.object({ endpoint: z.string() }))
        .mutation(async ({ input }) => {
            const { endpoint } = input;
            await db
                .delete(subscribers)
                .where(eq(subscribers.endpoint, endpoint))
                .execute();
            return { success: true };
        }),
});
