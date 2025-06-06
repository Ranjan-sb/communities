'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/server/auth/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await signIn.email({
                email,
                password,
                callbackURL: callbackUrl,
            });

            if (result?.error) {
                if (result.error.code === 'EMAIL_NOT_VERIFIED') {
                    setError(
                        'Your email is not verified. Please verify your email to continue.',
                    );
                } else {
                    setError(result.error.message || 'Failed to sign in');
                }
            } else {
                router.push(callbackUrl);
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEmail = async () => {
        if (!email) {
            setError('Please enter your email address first');
            return;
        }

        setIsVerifyingEmail(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/verify-email-direct', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to verify email');
            }

            setVerificationSuccess(true);
            setError(null);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to verify email',
            );
        } finally {
            setIsVerifyingEmail(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Sign In</CardTitle>
                    <CardDescription>
                        Enter your email and password to sign in to your account
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
                                {error}
                                {error.includes('email is not verified') && (
                                    <div className="mt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleVerifyEmail}
                                            disabled={isVerifyingEmail}
                                        >
                                            {isVerifyingEmail ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                'Verify Email Now'
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {verificationSuccess && (
                            <div className="rounded-md bg-green-100 p-3 text-sm text-green-800">
                                Email verified successfully! You can now sign
                                in.
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button
                            type="submit"
                            className="mt-4 w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                        <div className="text-center text-sm">
                            Don't have an account?{' '}
                            <Link href="/auth/register" className="underline">
                                Sign up
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center p-4">
                    Loading...
                </div>
            }
        >
            <LoginForm />
        </Suspense>
    );
}
