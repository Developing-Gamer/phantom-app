// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const rules = {
  // Add your permission rules here
  // Example:
  // posts: {
  //   allow: {
  //     view: "true",
  //     create: "isOwner",
  //     update: "isOwner",
  //     delete: "isOwner",
  //   },
  //   bind: ["isOwner", "auth.id != null && auth.id == data.ownerId"],
  // },
} satisfies InstantRules;

export default rules;
