// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
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
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
