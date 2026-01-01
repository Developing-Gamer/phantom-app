import { init } from "@instantdb/react";
import schema, { type AppSchema } from "@/instant.schema";

export const db = init<AppSchema>({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  schema,
  devtool: false,
});

/**
 * BEST PRACTICES FOR INSTANTDB TRANSACTIONS
 * -----------------------------------------
 * When creating entities that are linked to others, use atomic transactions:
 * 
 * const messageId = id(); // from @instantdb/react
 * db.tx.messages[messageId]
 *   .update({ content: "Hello", createdAt: Date.now() })
 *   .link({ chat: chatId }); // Link to the parent entity
 * 
 * db.tx.chats[chatId].update({ lastMessageAt: Date.now() });
 * 
 * Rule: If your schema defines a link, ALWAYS use .link() or .unlink()
 * to make data traversable in nested queries.
 */
