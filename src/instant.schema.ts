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
    // messages: i.entity({
    //   content: i.string(),
    //   createdAt: i.number().indexed(),
    // }),
    // chats: i.entity({
    //   name: i.string(),
    //   lastMessageAt: i.number().indexed(),
    // }),
  },
  links: {
    // Add your links here
    // InstantDB relies on a graph-based linking system.
    // Always use db.tx.entity[id].link({ label: otherId }) in transactions.
    //
    // IMPORTANT: When creating entities that belong to users:
    // - Define a link between your entity and $users
    // - Use .link({ user: userId }) when creating the entity
    // - This enables permission rules like: auth.id in data.ref('user.id')
    //
    // Example for profiles linked to users:
    // profileUser: {
    //   forward: { on: "profiles", has: "one", label: "user" },
    //   reverse: { on: "$users", has: "one", label: "profile" },
    // },
    //
    // Example for posts with many-to-one relationship:
    // chatMessages: {
    //   forward: { on: "chats", has: "many", label: "messages" },
    //   reverse: { on: "messages", has: "one", label: "chat" },
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
