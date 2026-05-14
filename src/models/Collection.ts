import { Schema, model, models, type Model, type Types } from "mongoose";
import slugify from "slugify";

/** A curated series of poems — e.g. "Letters to the Sea" or "Grief, in parts". */
export interface CollectionDoc {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const collectionSchema = new Schema<CollectionDoc>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [160, "Title cannot exceed 160 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: { type: String, trim: true, maxlength: 600, default: "" },
    coverImage: { type: String, trim: true, default: "" },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

collectionSchema.pre("validate", function () {
  if (this.isModified("title") || !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
});

export const Collection: Model<CollectionDoc> =
  (models.Collection as Model<CollectionDoc>) ||
  model<CollectionDoc>("Collection", collectionSchema);
