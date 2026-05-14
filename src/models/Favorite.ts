import { Schema, model, models, type Model, type Types } from "mongoose";

/** A reader bookmarking a poem to their profile. Requires an account. */
export interface FavoriteDoc {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  poem: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<FavoriteDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    poem: { type: Schema.Types.ObjectId, ref: "Poem", required: true },
  },
  { timestamps: true },
);

// A reader can favorite a given poem only once.
favoriteSchema.index({ user: 1, poem: 1 }, { unique: true });

export const Favorite: Model<FavoriteDoc> =
  (models.Favorite as Model<FavoriteDoc>) ||
  model<FavoriteDoc>("Favorite", favoriteSchema);
