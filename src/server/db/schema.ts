import {
    pgTable,
    serial,
    text,
    timestamp,
    integer,
    boolean,
} from 'drizzle-orm/pg-core';
import { users, orgs } from './auth-schema';
import { relations } from 'drizzle-orm';

// Existing table
export const hello = pgTable('hello', {
    id: serial('id').primaryKey(),
    greeting: text('greeting').notNull(),
});

// Community schema
export const posts = pgTable('posts', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    authorId: text('author_id')
        .notNull()
        .references(() => users.id),
    orgId: text('org_id')
        .notNull()
        .references(() => orgs.id),
    groupId: text('group_id'), // optional, for future use
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Define comments table with type assertion to handle self-reference
export const comments = pgTable('comments', {
    id: serial('id').primaryKey(),
    content: text('content').notNull(),
    postId: integer('post_id')
        .notNull()
        .references(() => posts.id),
    authorId: text('author_id')
        .notNull()
        .references(() => users.id),
    parentId: integer('parent_id').references((): any => comments.id),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const reactions = pgTable('reactions', {
    id: serial('id').primaryKey(),
    postId: integer('post_id')
        .notNull()
        .references(() => posts.id, { onDelete: 'cascade' }),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Define relations
export const postsRelations = relations(posts, ({ one, many }) => ({
    author: one(users, {
        fields: [posts.authorId],
        references: [users.id],
    }),
    comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
    post: one(posts, {
        fields: [comments.postId],
        references: [posts.id],
    }),
    author: one(users, {
        fields: [comments.authorId],
        references: [users.id],
    }),
}));

// Auth schema
export * from './auth-schema';
