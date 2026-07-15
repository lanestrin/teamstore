import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	...authTables,

	users: defineTable({
		name: v.optional(v.string()),
		email: v.string(),
	}).index("by_email", ["email"]),

	organizations: defineTable({
		name: v.string(),
		slug: v.string(),

		createdBy: v.id("users"),

		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_slug", ["slug"])
		.index("by_creator", ["createdBy"]),

	organizationMembers: defineTable({
		organizationId: v.id("organizations"),
		userId: v.id("users"),

		role: v.union(
			v.literal("owner"),
			v.literal("admin"),
			v.literal("member")
		),

		createdAt: v.number(),
	})
		.index("by_organization", ["organizationId"])
		.index("by_user", ["userId"])
		.index("by_organization_user", [
			"organizationId",
			"userId",
		]),

	stores: defineTable({
		createdBy: v.id("users"),

		organizationId: v.optional(
			v.id("organizations")
		),

		organizationName: v.optional(v.string()),
		organizationSlug: v.optional(v.string()),

		name: v.optional(v.string()),
		slug: v.optional(v.string()),
		description: v.optional(v.string()),

		logoStorageId: v.optional(v.id("_storage")),
		bannerStorageId: v.optional(
			v.id("_storage")
		),

		primaryColor: v.optional(v.string()),
		secondaryColor: v.optional(v.string()),

		currentStep: v.number(),

		status: v.union(
			v.literal("draft"),
			v.literal("active"),
			v.literal("archived")
		),

		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_slug", ["slug"])
		.index("by_creator", ["createdBy"])
		.index("by_creator_status", [
			"createdBy",
			"status",
		])
		.index("by_organization", [
			"organizationId",
		]),
});