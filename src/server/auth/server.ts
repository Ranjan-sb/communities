import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { admin } from 'better-auth/plugins';
import { sendEmail } from '@/lib/email';
import {
    createVerificationEmail,
    createResetPasswordEmail,
} from '@/lib/email-templates';
import { db } from '@/server/db';
import { headers as nextHeaders } from 'next/headers';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
}

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
        usePlural: true,
    }),
    selectUserFields: ['id', 'name', 'email', ['org_id', 'orgId'], 'role'],
    plugins: [
        nextCookies(),
        admin({
            defaultRole: 'user',
            impersonationSessionDuration: 60 * 60 * 24,
        }),
    ],
    cors: {
        origin: [
            'http://localhost:3000',
            'https://communities-three.vercel.app',
            'https://communities-git-dev-ranjan-bhats-projects.vercel.app',
            'https://communities-629729ibv-ranjan-bhats-projects.vercel.app',
            'https://communities-git-feature-push-notif-03b32a-ranjan-bhats-projects.vercel.app',
            '*',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    },
    emailVerification: {
        sendVerificationEmail: async ({ user, url }) => {
            const { subject, html } = createVerificationEmail(url);
            await sendEmail({ to: user.email, subject, html });
        },
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        expiresIn: 3600,
    },
    emailAndPassword: {
        enabled: true,
        disableSignUp: false,
        requireEmailVerification: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        autoSignIn: true,
        sendResetPassword: async ({ user, url }) => {
            const { subject, html } = createResetPasswordEmail(url);
            await sendEmail({ to: user.email, subject, html });
        },
        resetPasswordTokenExpiresIn: 3600,
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
        },
    },
    databaseHooks: {
        user: {
            create: {
                before: async (userData, ctx) => {
                    // Try to get orgId from various possible sources
                    let orgId = null;

                    // Check if there's a user object in the request body with org_id
                    if (ctx?.body?.user?.org_id) {
                        orgId = ctx.body.user.org_id;
                    }
                    // Check for direct orgId in request body
                    else if (ctx?.body?.orgId) {
                        orgId = ctx.body.orgId;
                    }

                    if (orgId) {
                        // Return modified user data with org_id explicitly set
                        return {
                            data: {
                                ...userData,
                                org_id: orgId,
                            },
                        };
                    }

                    return { data: userData };
                },
            },
        },
    },
});

export async function getUserSession(headers?: Headers) {
    return auth.api.getSession({
        headers: headers ?? new Headers(),
    });
}

export async function currentUser() {
    const readonlyHeaders = await nextHeaders();
    const reqHeaders = new Headers();

    for (const [key, value] of readonlyHeaders.entries()) {
        reqHeaders.set(key, value);
    }

    const session = await auth.api.getSession({ headers: reqHeaders });
    return session?.user ?? null;
}
