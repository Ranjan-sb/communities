import { useState, useEffect } from 'react';
import {
    subscribeUser,
    unsubscribeUser,
    sendNotification,
} from '@/app/actions';
import { urlBase64ToUint8Array } from '@/app/page';
import { Button } from '@/components/ui/button'; // shadcn Button
import { Input } from '@/components/ui/input'; // shadcn Input
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from '@/components/ui/card';

export function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(
        null,
    );
    const [message, setMessage] = useState('');

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            registerServiceWorker();
        }
    }, []);

    async function registerServiceWorker() {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none',
        });
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
    }

    async function subscribeToPush() {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
                // 'BK4Qh4tHl9i-QsQa2W5NbemMjkgbVTe9j-C7alwmgkpqoX33kLZfihDb8KYGxcXInm0OWS-uz6XCpkz5rqaN_eE'
            ),
        });
        setSubscription(sub);
        const serializedSub = JSON.parse(JSON.stringify(sub));
        await subscribeUser(serializedSub);
    }

    async function unsubscribeFromPush() {
        if (!subscription) return;

        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        setSubscription(null);

        // Call server action with endpoint
        await unsubscribeUser(endpoint);
    }

    //   async function sendTestNotification() {
    //     if (subscription) {
    //       await sendNotification(message);
    //       setMessage("");
    //     }
    //   }

    if (!isSupported) {
        return <p>Push notifications are not supported in this browser.</p>;
    }

    return (
        <Card className="mx-auto w-full max-w-md">
            <CardHeader>
                <CardTitle>Push Notifications</CardTitle>
            </CardHeader>
            <CardContent>
                {subscription ? (
                    <>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            You are subscribed to push notifications.
                        </p>
                        <Button
                            variant="destructive"
                            onClick={unsubscribeFromPush}
                            className="mt-4"
                        >
                            Unsubscribe
                        </Button>
                        {/* <Input
              type="text"
              placeholder="Enter notification message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-4"
            /> */}
                    </>
                ) : (
                    <>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            You are not subscribed to push notifications.
                        </p>
                        <Button
                            variant="default"
                            onClick={subscribeToPush}
                            className="mt-4"
                        >
                            Subscribe
                        </Button>
                    </>
                )}
            </CardContent>
            {/* {subscription && (
        <CardFooter>
          <Button variant="default" onClick={sendTestNotification}>
            Send Test Notification
          </Button>
        </CardFooter>
      )} */}
        </Card>
    );
}
