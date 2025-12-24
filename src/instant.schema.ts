// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const schema = i.schema({
  entities: {
    // InstantDB's built-in user entity - required for custom authentication
    // When using Stack Auth with InstantDB, user emails/IDs are stored here
    $users: i.entity({
      email: i.any().unique().indexed(),
    }),
    // Add your entities here
    // Example:
    // posts: i.entity({
    //   title: i.string(),
    //   content: i.string(),
    //   createdAt: i.number().indexed(),
    // }),
  },
  links: {
    // Add your links here
    // Example:
    // authorPosts: {
    //   forward: { on: "posts", has: "one", label: "author" },
    //   reverse: { on: "$users", has: "many", label: "posts" },
    // },
  },
  rooms: {
    // Add your rooms for real-time presence here
    // Example:
    // chat: {
    //   presence: i.entity({
    //     name: i.string(),
    //   }),
    // },
  },
});

// This helps Typescript display nicer intellisense
export type AppSchema = typeof schema;
export default schema;
