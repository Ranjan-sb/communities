'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from '@/server/auth/client';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Globe, Menu, X, Bell, List } from 'lucide-react';
import { ChatButton } from '@/components/chat-button';
import { useChat } from '@/providers/chat-provider';
import { PushNotificationManager } from './notifications/PushNotificationManager';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function Navbar() {
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { closeChat } = useChat();
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<
        { title: string; body: string }[]
    >([]);
    const [pushManagerOpen, setPushManagerOpen] = useState(false);
    const pushManagerRef = useRef<HTMLDivElement>(null);

    // Close PushManager if clicked outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                pushManagerRef.current &&
                !pushManagerRef.current.contains(event.target as Node)
            ) {
                setPushManagerOpen(false);
            }
        }

        if (pushManagerOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [pushManagerOpen]);

    // Set mounted state to true after hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSignOut = async () => {
        // Close chat drawer before signing out
        closeChat();
        await signOut();
        router.push('/');
    };

    const toggleNotifications = () => {
        setNotificationsOpen(!notificationsOpen);
    };
    const togglePushManager = () => setPushManagerOpen(!pushManagerOpen);

    // Function to determine if a path is active
    const isActive = (path: string) => {
        if (!pathname) return false;
        return pathname.startsWith(path);
    };

    // Get the active link style
    const getNavLinkClass = (path: string) => {
        const baseClass = 'inline-flex items-center px-1 pt-1 border-b-2';
        const activeClass =
            'border-black text-black font-medium dark:border-white dark:text-white';
        const inactiveClass =
            'border-transparent text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-700';

        return `${baseClass} ${isActive(path) ? activeClass : inactiveClass}`;
    };

    // Get the active mobile link style
    const getMobileNavLinkClass = (path: string) => {
        const baseClass = 'block px-3 py-2 rounded-md text-base font-medium';
        const activeClass =
            'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-white';
        const inactiveClass =
            'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800';

        return `${baseClass} ${isActive(path) ? activeClass : inactiveClass}`;
    };

    return (
        <nav className="bg-white shadow-sm dark:bg-gray-800 dark:shadow-gray-800">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                    <div className="flex">
                        <Link href="/" className="flex items-center">
                            <span className="text-xl font-bold dark:text-white">
                                Community-
                                <span className="text-blue-600 dark:text-blue-400">
                                    X
                                </span>
                            </span>
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {mounted && session?.user?.role === 'admin' && (
                                <Link
                                    href="/admin"
                                    className={getNavLinkClass('/admin')}
                                >
                                    Admin Dashboard
                                </Link>
                            )}
                            {/* Only show Posts and Communities links when user is logged in */}
                            {mounted && session && (
                                <>
                                    <Link
                                        href="/posts"
                                        className={getNavLinkClass('/posts')}
                                    >
                                        Posts
                                    </Link>
                                    <Link
                                        href="/communities"
                                        className={getNavLinkClass(
                                            '/communities',
                                        )}
                                    >
                                        <Globe className="mr-1 h-4 w-4" />
                                        Communities
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Add ChatButton here so it's visible on mobile */}
                        {mounted && session && (
                            <div className="flex sm:hidden">
                                <ChatButton />
                            </div>
                        )}
                        <ThemeToggle />
                        {mounted && session && (
                            <>
                                <ChatButton />
                                {/* Bell Icon for Push Notifications */}
                                {/* <PushNotificationManager /> */}
                                {/* Notifications Button */}
                                {/* Push Notification Button */}
                                <button
                                    onClick={togglePushManager}
                                    className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                                >
                                    <Bell className="mr-2 h-6 w-6" />
                                </button>

                                <button
                                    onClick={toggleNotifications}
                                    className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                                >
                                    <List className="mr-2 h-6 w-6" />
                                    Notifications
                                </button>
                            </>
                        )}
                        {mounted ? (
                            session ? (
                                <div className="hidden items-center space-x-4 sm:flex">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {session.user.email}
                                    </span>
                                    <Button
                                        variant="outline"
                                        onClick={handleSignOut}
                                        className="text-sm"
                                    >
                                        Sign Out
                                    </Button>
                                </div>
                            ) : (
                                <Button asChild className="hidden sm:flex">
                                    <Link
                                        href="/auth/login"
                                        className="text-sm"
                                    >
                                        Sign In
                                    </Link>
                                </Button>
                            )
                        ) : (
                            <div className="hidden h-9 w-[100px] sm:block" /> // Placeholder with similar dimensions
                        )}

                        {/* Mobile menu button */}
                        <div className="flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setMobileMenuOpen(!mobileMenuOpen)
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
                                aria-expanded="false"
                            >
                                <span className="sr-only">Open main menu</span>
                                {mobileMenuOpen ? (
                                    <X
                                        className="block h-6 w-6"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <Menu
                                        className="block h-6 w-6"
                                        aria-hidden="true"
                                    />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Push Notification Drawer */}
            {pushManagerOpen && (
                <div
                    ref={pushManagerRef}
                    className="absolute top-16 right-16 z-50 w-full max-w-md"
                >
                    <PushNotificationManager />
                </div>
            )}

            {/* Notifications Drawer */}
            {notificationsOpen && (
                <div className="absolute top-16 right-0 z-50 w-64 bg-white shadow-lg dark:bg-gray-800">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {notifications.length > 0 ? (
                                notifications.map((notification, index) => (
                                    <div key={index} className="py-2">
                                        <p className="text-sm font-medium">
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {notification.body}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">
                                    No notifications available.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Mobile menu, show/hide based on menu state */}
            <div className={`sm:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
                <div className="space-y-1 px-2 pt-2 pb-3">
                    {mounted && session?.user?.role === 'admin' && (
                        <Link
                            href="/admin"
                            className={getMobileNavLinkClass('/admin')}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Admin Dashboard
                        </Link>
                    )}
                    {mounted && session && (
                        <>
                            <Link
                                href="/posts"
                                className={getMobileNavLinkClass('/posts')}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Posts
                            </Link>
                            <Link
                                href="/communities"
                                className={getMobileNavLinkClass(
                                    '/communities',
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <div className="flex items-center">
                                    <Globe className="mr-1 h-4 w-4" />
                                    Communities
                                </div>
                            </Link>
                        </>
                    )}

                    {/* Mobile auth buttons */}
                    {mounted && (
                        <div className="border-t border-gray-200 pt-4 pb-3 dark:border-gray-700">
                            {session ? (
                                <div className="space-y-1 px-2">
                                    <p className="block px-3 py-2 text-base font-medium text-gray-500 dark:text-gray-400">
                                        {session.user.email}
                                    </p>
                                    <button
                                        onClick={() => {
                                            closeChat();
                                            handleSignOut();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            ) : (
                                <div className="px-2">
                                    <Link
                                        href="/auth/login"
                                        className="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Sign In
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
