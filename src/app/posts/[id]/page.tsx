'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { trpc } from '@/providers/trpc-provider';
import { useSession } from '@/server/auth/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Trash2 } from 'lucide-react';
import CommentItem from '@/components/CommentItem';
import type { CommentWithReplies } from '@/components/CommentItem';

type User = {
    id: string;
    name: string | null;
    email: string;
};

type Post = {
    id: number;
    title: string;
    content: string;
    authorId: string;
    createdAt: Date;
    updatedAt: Date;
    author: User;
    comments: CommentWithReplies[];
    isDeleted: boolean;
};

export default function PostPage() {
    const params = useParams();
    const postId = parseInt(params.id as string);
    const { data: session } = useSession();
    const [comment, setComment] = useState('');
    const router = useRouter();

    // State for inline comment editing
    const [editingCommentId, setEditingCommentId] = useState<number | null>(
        null,
    );
    const [editedCommentContent, setEditedCommentContent] =
        useState<string>('');

    // New state for reply functionality
    const [replyingToCommentId, setReplyingToCommentId] = useState<
        number | null
    >(null);
    const [replyContent, setReplyContent] = useState('');

    const utils = trpc.useUtils();

    const {
        data: post,
        isLoading,
        refetch,
    } = trpc.community.getPost.useQuery(
        { postId },
        {
            enabled: !!session,
        },
    );

    const createComment = trpc.community.createComment.useMutation({
        onSuccess: () => {
            setComment('');
            setReplyContent(''); // Clear reply content on success
            setReplyingToCommentId(null); // Reset replying state
            utils.community.getPost.invalidate({ postId });
        },
    });

    // Placeholder for updateComment mutation (to be created)
    const updateCommentMutation = trpc.community.updateComment.useMutation({
        onSuccess: () => {
            utils.community.getPost.invalidate({ postId });
            setEditingCommentId(null);
            setEditedCommentContent('');
        },
        onError: (error) => {
            // Handle error, e.g., show a toast notification
            console.error('Failed to update comment:', error);
            alert('Failed to update comment: ' + error.message);
        },
    });

    const deleteCommentMutation = trpc.community.deleteComment.useMutation({
        onSuccess: () => {
            utils.community.getPost.invalidate({ postId });
        },
    });

    const deletePostMutation = trpc.community.deletePost.useMutation({
        onSuccess: () => {
            utils.community.getPost.invalidate({ postId });
        },
    });

    if (!session) {
        return (
            <div className="mx-auto max-w-4xl p-4">
                <h1 className="mb-4 text-3xl font-bold">Access Denied</h1>
                <p className="mb-4 text-gray-600">
                    Please sign in to view this post.
                </p>
                <Button onClick={() => router.push('/auth/login')}>
                    Sign In
                </Button>
            </div>
        );
    }

    if (isLoading) {
        return <div className="p-4">Loading post...</div>;
    }

    if (!post) {
        return <div className="p-4">Post not found</div>;
    }

    const handleStartEdit = (commentToEdit: CommentWithReplies) => {
        setEditingCommentId(commentToEdit.id);
        setEditedCommentContent(commentToEdit.content);
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditedCommentContent('');
    };

    const handleSaveEdit = async (commentId: number) => {
        if (!editedCommentContent.trim()) return;
        updateCommentMutation.mutate({
            commentId,
            content: editedCommentContent.trim(),
        });
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;

        await createComment.mutate({
            postId,
            content: comment.trim(),
        });
    };

    // New handlers for reply functionality
    const handleStartReply = (commentId: number) => {
        setReplyingToCommentId(commentId);
        setReplyContent('');
    };

    const handleCancelReply = () => {
        setReplyingToCommentId(null);
        setReplyContent('');
    };

    const handleSubmitReply = async (parentId: number) => {
        if (!replyContent.trim()) return;

        await createComment.mutate({
            postId,
            content: replyContent.trim(),
            parentId, // Include parentId when creating a reply
        });
    };

    const handleDeleteComment = async (commentId: number) => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            await deleteCommentMutation.mutate({ commentId });
        }
    };

    const handleDeletePost = async () => {
        if (
            !confirm(
                'Are you sure you want to delete this post? The comments will still be visible.',
            )
        ) {
            return;
        }

        try {
            await deletePostMutation.mutateAsync({ postId });
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post');
        }
    };

    return (
        <div className="mx-auto max-w-4xl p-4">
            <div className="mb-8">
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h1 className="mb-2 text-3xl font-bold">
                            {post.isDeleted ? '[Deleted]' : post.title}
                        </h1>
                        <div className="text-sm text-gray-500">
                            Posted by {post.author?.name || 'Unknown'} on{' '}
                            {new Date(post.createdAt).toLocaleString()}
                        </div>
                    </div>
                    {session.user.id === post.authorId && !post.isDeleted && (
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    router.push(`/posts/${post.id}/edit`)
                                }
                                className="flex items-center gap-2"
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDeletePost}
                                className="flex items-center gap-2 text-red-600 hover:bg-red-50"
                                disabled={deletePostMutation.isPending}
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    )}
                </div>
                <div className="prose prose-ul:list-disc prose-ol:list-decimal max-w-none rounded-lg bg-white p-6 shadow-sm">
                    {post.isDeleted ? (
                        <div className="space-y-2">
                            <span className="block text-gray-500 italic">
                                [Content deleted]
                            </span>
                            <span className="block text-sm text-gray-400">
                                Removed on{' '}
                                {new Date(post.updatedAt).toLocaleString()}
                            </span>
                        </div>
                    ) : (
                        <div
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    )}
                </div>
            </div>

            <div className="mb-8">
                <h2 className="mb-4 text-2xl font-bold">Comments</h2>
                {session && !post.isDeleted && (
                    <form onSubmit={handleSubmitComment} className="mb-6">
                        <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            placeholder="Write a comment..."
                        />
                        <Button
                            type="submit"
                            disabled={createComment.isPending}
                            className="mt-2"
                        >
                            {createComment.isPending
                                ? 'Posting...'
                                : 'Post Comment'}
                        </Button>
                    </form>
                )}

                {post.isDeleted && (
                    <div className="mb-6 rounded-lg bg-gray-50 p-4 text-gray-500">
                        <p>
                            This post has been deleted. New comments are
                            disabled, but existing comments are still visible.
                        </p>
                    </div>
                )}

                <div className="space-y-4">
                    {post.comments?.map((comment: CommentWithReplies) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            session={session}
                            onStartEdit={handleStartEdit}
                            onCancelEdit={handleCancelEdit}
                            onSaveEdit={handleSaveEdit}
                            editingCommentId={editingCommentId}
                            editedCommentContent={editedCommentContent}
                            onSetEditedContent={setEditedCommentContent}
                            updateCommentMutationPending={
                                updateCommentMutation.isPending
                            }
                            replyingToCommentId={replyingToCommentId}
                            replyContent={replyContent}
                            onStartReply={handleStartReply}
                            onCancelReply={handleCancelReply}
                            onSetReplyContent={setReplyContent}
                            onSubmitReply={handleSubmitReply}
                            replyMutationPending={createComment.isPending}
                            onDeleteComment={handleDeleteComment}
                            deleteCommentPending={
                                deleteCommentMutation.isPending
                            }
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
