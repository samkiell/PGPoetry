import { Schema, model, models, type Model, type Types } from "mongoose";

export type UserRole = "reader" | "writer" | "admin";

/**
 * Shares the `users` collection with the Auth.js MongoDB adapter.
 * The adapter writes `name`, `email`, `emailVerified`, `image` for OAuth users;
 * our credentials flow additionally writes `username`, `password`, `role`.
 */
export interface UserDoc {
  _id: Types.ObjectId;
  name: string;
  username: string;
  email: string;
  emailVerified: Date | null;
  image: string;
  /** bcrypt hash — only present for credentials (email/password) accounts. */
  password?: string;
  role: UserRole;
  bio: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, trim: true, default: "" },
    username: { type: String, trim: true, sparse: true, unique: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    emailVerified: { type: Date, default: null },
    image: { type: String, default: "" },
    password: { type: String, select: false },
    role: { type: String, enum: ["reader", "writer", "admin"], default: "reader" },
    bio: { type: String, trim: true, maxlength: 280, default: "" },
  },
  { timestamps: true, collection: "users" },
);

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) || model<UserDoc>("User", userSchema);
