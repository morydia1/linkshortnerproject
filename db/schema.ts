import { index, integer, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const links = pgTable(
  "links",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id").notNull(),
    shortCode: varchar("short_code", { length: 16 }).notNull(),
    url: text("url").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("links_user_id_idx").on(table.userId),
    uniqueIndex("links_short_code_idx").on(table.shortCode),
  ],
);

export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
