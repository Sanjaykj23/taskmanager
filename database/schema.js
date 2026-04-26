import { pgTable, uuid, text, varchar, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

// Define Enums to match Database
export const roleEnum = pgEnum("user_role", ["admin", "team_lead", "user"]);
export const statusEnum = pgEnum("task_status", ["pending", "completed"]);

// 1. Profiles Table
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  fullname: text("full_name").notNull(),
  gmail: varchar("gmail", { length: 255 }).notNull().unique(),
  role: roleEnum("role").default("user"),
  techStack: text("tech_stack"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. Projects Table
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectName: text("project_name").notNull(),
  projectDescription: text("project_description"),
  leadId: uuid("lead_id").references(() => profiles.id),
  adminId: uuid("admin_id").references(() => profiles.id),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// 3. Project Members Table
export const projectMembers = pgTable("project_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }),
  role: roleEnum("role").default("user"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// 4. Tasks Table
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  assignedTo: uuid("assigned_to").references(() => profiles.id),
  status: statusEnum("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});