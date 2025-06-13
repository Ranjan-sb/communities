'use server';

import webpush, { PushSubscription as WebPushSubscription } from 'web-push';
import { db } from '@/server/db'; // Replace with your database connection
import { subscribers } from '@/server/db/schema'; // Import the subscribers table
import { currentUser } from '@/server/auth/server';
import { eq } from 'drizzle-orm';

webpush.setVapidDetails(
    'mailto:ranjan@xcelerator.co.in',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    // 'BK4Qh4tHl9i-QsQa2W5NbemMjkgbVTe9j-C7alwmgkpqoX33kLZfihDb8KYGxcXInm0OWS-uz6XCpkz5rqaN_eE',
    process.env.VAPID_PRIVATE_KEY!,
    // 'au5LbrlkxMCtyHKrV6Yrf8H3ptZLqnQMAZyG-MPtxYw'
);

let subscription: WebPushSubscription | null = null;

export async function subscribeUser(sub: any, userId: string | null = null) {
    const user = await currentUser();
    console.log('Current User:', user);
    const subscriber = {
        endpoint: sub.endpoint,
        expirationTime: sub.expirationTime,
        p256dh: sub.keys?.p256dh,
        auth: sub.keys?.auth,
        userId: user?.id ?? null, // Optional: Link to a user if applicable
    };

    await db.insert(subscribers).values(subscriber); // Insert into the database
    return { success: true };
}

// export async function unsubscribeUser() {
//     subscription = null;
//     // In a production environment, you would want to remove the subscription from the database
//     // For example: await db.delete(subscribers).where({ endpoint: subscription.endpoint });
//     return { success: true };
// }
export async function unsubscribeUser(endpoint: string) {
    if (!endpoint) {
        return { success: false, error: 'Missing endpoint' };
    }

    await db.delete(subscribers).where(eq(subscribers.endpoint, endpoint));

    return { success: true };
}

// export async function sendNotification(message: string) {
//     // Fetch all subscribers from the database
//     const allSubscribers = await db
//         .select({
//             endpoint: subscribers.endpoint,
//             p256dh: subscribers.p256dh,
//             auth: subscribers.auth,
//         })
//         .from(subscribers)
//         .execute(); // Use .execute() to run the query

//     if (allSubscribers.length === 0) {
//         throw new Error('No subscribers available');
//     }

//     for (const sub of allSubscribers) {
//         const subscription = {
//             endpoint: sub.endpoint,
//             keys: {
//                 p256dh: sub.p256dh,
//                 auth: sub.auth,
//             },
//         };

//         try {
//             await webpush.sendNotification(
//                 subscription,
//                 JSON.stringify({
//                     command: 'notify',
//                     data: {
//                         title: 'Test Notification',
//                         body: message,
//                         icon: '/icon.png',
//                         url: '/notifications', // Set the URL to open when the notification is clicked
//                     },
//                 }),
//             );
//         } catch (error) {
//             console.error('Error sending push notification:', error);
//         }
//     }

//     return { success: true };
// }
export async function sendNotification(
    recipientId: string,
    message: string,
    title: string = 'New Message',
    url: string = '/chat',
) {
    // Fetch subscribers for the recipient
    const recipientSubscribers = await db
        .select({
            endpoint: subscribers.endpoint,
            p256dh: subscribers.p256dh,
            auth: subscribers.auth,
        })
        .from(subscribers)
        .where(eq(subscribers.userId, recipientId))
        .execute();

    if (recipientSubscribers.length === 0) {
        console.warn('No push subscribers found for user:', recipientId);
        return { success: false, message: 'No subscribers for user' };
    }

    for (const sub of recipientSubscribers) {
        const subscription = {
            endpoint: sub.endpoint,
            keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
            },
        };

        try {
            console.log('Sending push to:', sub.endpoint);
            await webpush.sendNotification(
                subscription,
                JSON.stringify({
                    command: 'notify',
                    data: {
                        title,
                        body: message,
                        icon: '/icon.png',
                        url,
                    },
                }),
            );
        } catch (error) {
            console.error('Error sending push notification:', error);
        }
    }

    return { success: true };
}
