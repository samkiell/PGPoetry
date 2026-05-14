import { Schema, model, models, type Model, type Types } from "mongoose";

export interface CommentDoc {
  _id: Types.ObjectId;
  poem: Types.ObjectId;
  /** Null for anonymous comments. */
  author: Types.ObjectId | null;
  /** Display name — the user's name, or a free-typed name for anonymous posts. */
  authorName: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<CommentDoc>(
  {
    poem: {
      type: Schema.Types.ObjectId,
      ref: "Poem",
      required: true,
      index: true,
    },
    author: { type: Schema.Types.ObjectId, ref: "User", default: null },
    authorName: { type: String, trim: true, default: "Anonymous" },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
  },
  { timestamps: true },
);

commentSchema.index({ poem: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });

export const Comment: Model<CommentDoc> =
  (models.Comment as Model<CommentDoc>) ||
  model<CommentDoc>("Comment", commentSchema);
