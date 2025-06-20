'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, Suspense } from 'react';
import { trpc } from '@/providers/trpc-provider';
import { useSession } from '@/server/auth/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TipTapEditor from '@/components/TipTapEditor';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

function NewPostForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const communityId = searchParams.get('communityId')
        ? parseInt(searchParams.get('communityId')!)
        : null;
    const communitySlug = searchParams.get('communitySlug');
    const { data: session } = useSession();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    // Fetch community to check membership status if communityId is provided
    const { data: community, isLoading: isLoadingCommunity } =
        trpc.communities.getById.useQuery(
            { id: communityId! },
            { enabled: !!communityId },
        );

    // Check if user is a member of the community
    const userMembership = community?.members?.find(
        (m) => m.userId === session?.user.id,
    );
    const isMember =
        !!userMembership && userMembership.membershipType === 'member';

    const createPost = trpc.community.createPost.useMutation({
        onSuccess: (post) => {
            // If post was created from a community, redirect back to that community
            if (communityId && communitySlug) {
                router.push(`/communities/${communitySlug}`);
            } else {
                router.push(`/posts/${post.id}`);
            }
        },
    });

    // If community ID is provided but user is not a member, redirect back to community page
    useEffect(() => {
        if (communityId && community && !isMember && !isLoadingCommunity) {
            router.push(`/communities/${communitySlug}`);
        }
    }, [
        communityId,
        community,
        isMember,
        communitySlug,
        router,
        isLoadingCommunity,
    ]);

    if (!session) {
        return (
            <div className="mx-auto max-w-4xl p-4">
                <h1 className="mb-4 text-3xl font-bold">Access Denied</h1>
                <p className="mb-4 text-gray-600">
                    Please sign in to create a new post.
                </p>
                <Button asChild>
                    <Link href="/auth/login">Sign In</Link>
                </Button>
            </div>
        );
    }

    // Show loading state while checking community membership
    if (communityId && isLoadingCommunity) {
        return (
            <div className="mx-auto max-w-4xl p-4">
                <h1 className="mb-6 text-3xl font-bold">Create New Post</h1>
                <p>Loading community information...</p>
            </div>
        );
    }

    // Show access denied if user is not a member of the community
    if (communityId && !isMember) {
        return (
            <div className="mx-auto max-w-4xl p-4">
                <h1 className="mb-4 text-3xl font-bold">Access Denied</h1>
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Membership Required</AlertTitle>
                    <AlertDescription>
                        {community?.type === 'private'
                            ? 'This is a private community. You must be a member to create posts, not just a follower.'
                            : 'You must be a member of this community to create posts.'}
                    </AlertDescription>
                </Alert>
                <Button asChild>
                    <Link href={`/communities/${communitySlug}`}>
                        Return to Community
                    </Link>
                </Button>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            return;
        }

        await createPost.mutate({
            title: title.trim(),
            content: content,
            communityId: communityId,
        });
    };

    return (
        <div className="mx-auto max-w-4xl p-4">
            <h1 className="mb-6 text-3xl font-bold">Create New Post</h1>
            {communityId && communitySlug && (
                <div className="text-muted-foreground mb-4 text-sm">
                    Creating post in community:{' '}
                    <Link
                        href={`/communities/${communitySlug}`}
                        className="font-medium underline"
                    >
                        {communitySlug}
                    </Link>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                        htmlFor="title"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Title
                    </label>
                    <Input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label
                        htmlFor="content"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Content
                    </label>
                    <TipTapEditor
                        content={content}
                        onChange={setContent}
                        placeholder="Write your post content here..."
                    />
                </div>

                <div className="flex space-x-4">
                    {communitySlug && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                router.push(`/communities/${communitySlug}`)
                            }
                        >
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={createPost.isPending}>
                        {createPost.isPending ? 'Creating...' : 'Create Post'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default function NewPostPage() {
    return (
        <Suspense
            fallback={<div className="mx-auto max-w-4xl p-4">Loading...</div>}
        >
            <NewPostForm />
        </Suspense>
    );
}
