import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

// -- Better-Auth 認証用スキーマ-----------------------------------
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// -- アプリ用スキーマ--------------------------------------------
export const 商品 = pgTable("商品", {
  商品CD: text("商品CD").primaryKey(),
  商品名: text("商品名").notNull(),
  単価: decimal("単価").notNull(),
  備考: text("備考"),
  version: integer("version").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const 得意先 = pgTable("得意先", {
  得意先ID: text("得意先ID")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  得意先名: text("得意先名").notNull(),
  電話番号: text("電話番号"),
  備考: text("備考"),
  version: integer("version").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const 受注 = pgTable(
  "受注",
  {
    受注ID: text("受注ID")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    受注日: date("受注日").notNull(),
    得意先ID: text("得意先ID").notNull(),
    得意先名: text("得意先名").notNull(),
    合計金額: decimal("合計金額").notNull(),
    備考: text("備考"),
    version: integer("version").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("受注_受注日_idx").on(table.受注日)],
);

export const 受注明細 = pgTable(
  "受注明細",
  {
    受注明細ID: text("受注明細ID")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    受注ID: text("受注ID")
      .notNull()
      .references(() => 受注.受注ID, { onDelete: "cascade" }),
    商品CD: text("商品CD").notNull(),
    商品名: text("商品名").notNull(),
    単価: decimal("単価").notNull(),
    数量: decimal("数量").notNull(),
    明細金額: decimal("明細金額").notNull(),
  },
  (table) => [index("受注明細_受注ID_idx").on(table.受注ID)],
);

export const 受注Relations = relations(受注, ({ many }) => ({
  受注明細: many(受注明細),
}));

export const 受注明細Relations = relations(受注明細, ({ one }) => ({
  受注: one(受注, {
    fields: [受注明細.受注ID],
    references: [受注.受注ID],
  }),
}));

// ----------------------------------------------------------------
export const schema = {
  user,
  session,
  account,
  verification,
  商品,
  得意先,
  受注,
  受注明細,
};
