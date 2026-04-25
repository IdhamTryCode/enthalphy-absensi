import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  time,
  doublePrecision,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const attendanceStatus = pgEnum("attendance_status", ["Masuk", "Pulang"]);
export const attendanceFlag = pgEnum("attendance_flag", ["Telat", "Pulang Cepat"]);

export const divisions = pgTable("divisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// public.profiles — extension dari auth.users
// id-nya harus sama dengan auth.users.id (FK)
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    divisionId: uuid("division_id").references(() => divisions.id, {
      onDelete: "set null",
    }),
    role: userRole("role").notNull().default("user"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    divisionIdx: index("profiles_division_id_idx").on(t.divisionId),
    roleIdx: index("profiles_role_idx").on(t.role),
  }),
);

export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    tanggal: date("tanggal").notNull(),
    status: attendanceStatus("status").notNull(),
    jam: time("jam").notNull(),
    timestampAt: timestamp("timestamp_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    alamat: text("alamat").notNull(),
    linkFoto: text("link_foto").notNull(),
    flag: attendanceFlag("flag"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userTanggalIdx: index("attendance_user_tanggal_idx").on(t.userId, t.tanggal),
    tanggalIdx: index("attendance_tanggal_idx").on(t.tanggal),
    uniqueUserTanggalStatus: unique("attendance_user_tanggal_status_uniq").on(
      t.userId,
      t.tanggal,
      t.status,
    ),
  }),
);

export const attendanceEdits = pgTable(
  "attendance_edits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attendanceId: uuid("attendance_id")
      .notNull()
      .references(() => attendance.id, { onDelete: "cascade" }),
    editedBy: uuid("edited_by")
      .notNull()
      .references(() => profiles.id),
    field: text("field").notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    attendanceIdx: index("attendance_edits_attendance_id_idx").on(t.attendanceId),
    editedByIdx: index("attendance_edits_edited_by_idx").on(t.editedBy),
  }),
);

// Relations
export const divisionsRelations = relations(divisions, ({ many }) => ({
  profiles: many(profiles),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  division: one(divisions, {
    fields: [profiles.divisionId],
    references: [divisions.id],
  }),
  attendance: many(attendance),
  edits: many(attendanceEdits),
}));

export const attendanceRelations = relations(attendance, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [attendance.userId],
    references: [profiles.id],
  }),
  edits: many(attendanceEdits),
}));

export const attendanceEditsRelations = relations(attendanceEdits, ({ one }) => ({
  attendance: one(attendance, {
    fields: [attendanceEdits.attendanceId],
    references: [attendance.id],
  }),
  editor: one(profiles, {
    fields: [attendanceEdits.editedBy],
    references: [profiles.id],
  }),
}));
