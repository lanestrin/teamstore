import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
	...authTables,

	users: defineTable({
		name: v.optional(v.string()),
		email: v.string(),
	}).index("by_email", ["email"]),

	stores: defineTable({
		name: v.string(),
		slug: v.string(),
		description: v.optional(v.string()),

		logo: v.optional(v.string()),
		banner: v.optional(v.string()),

		createdBy: v.id("users"),

		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_slug", ["slug"])
		.index("by_creator", ["createdBy"]),

	storeMembers: defineTable({
		storeId: v.id("stores"),
		userId: v.id("users"),

		role: v.union(
			v.literal("owner"),
			v.literal("manager"),
			v.literal("coach")
		),

		createdAt: v.number(),
	})
		.index("by_store", ["storeId"])
		.index("by_user", ["userId"])
		.index("by_store_user", ["storeId", "userId"]),
});