import { Schema, model, models, type Model, type Types } from "mongoose";
import slugify from "slugify";

export type PoemStatus = "draft" | "scheduled" | "published";

export interface PoemDoc {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  content: string;
  tags: string[];
  featured: boolean;
  status: PoemStatus;
  /** Set when status becomes "published"; drives ordering and the public feed. */
  publishedAt: Date | null;
  /** For status "scheduled" — the cron/check publishes once this passes. */
  scheduledFor: Date | null;
  /** Cloudinary secure URL for the cover/thumbnail image. */
  coverImage: string;
  /** Optional collection/series this poem belongs to. */
  collectionId: Types.ObjectId | null;
  likes: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const poemSchema = new Schema<PoemDoc>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    featured: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "scheduled", "published"],
      default: "draft",
      index: true,
    },
    publishedAt: { type: Date, default: null },
    scheduledFor: { type: Date, default: null },
    coverImage: { type: String, trim: true, default: "" },
    collectionId: {
      type: Schema.Types.ObjectId,
      ref: "Collection",
      default: null,
      index: true,
    },
    likes: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

// Keep the slug in sync with the title.
poemSchema.pre("validate", function () {
  if (this.isModified("title") || !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
});

// Stamp publishedAt the moment a poem first goes live.
poemSchema.pre("save", function () {
  if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

poemSchema.index({ status: 1, publishedAt: -1 });
poemSchema.index({ tags: 1 });

export const Poem: Model<PoemDoc> =
  (models.Poem as Model<PoemDoc>) || model<PoemDoc>("Poem", poemSchema);
