import { Schema, model, models, type Model, type Types } from "mongoose";

/**
 * One row per like, so likes can be toggled and de-duplicated.
 * Logged-in readers are keyed by `user`; anonymous visitors by a signed
 * `visitorId` cookie. `Poem.likes` stays as a denormalised counter.
 */
export interface LikeDoc {
  _id: Types.ObjectId;
  poem: Types.ObjectId;
  user: Types.ObjectId | null;
  visitorId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const likeSchema = new Schema<LikeDoc>(
  {
    poem: {
      type: Schema.Types.ObjectId,
      ref: "Poem",
      required: true,
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    visitorId: { type: String, default: null },
  },
  { timestamps: true },
);

// Unique per identity — partial indexes so the null branch doesn't collide.
likeSchema.index(
  { poem: 1, user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: "objectId" } } },
);
likeSchema.index(
  { poem: 1, visitorId: 1 },
  { unique: true, partialFilterExpression: { visitorId: { $type: "string" } } },
);

export const Like: Model<LikeDoc> =
  (models.Like as Model<LikeDoc>) || model<LikeDoc>("Like", likeSchema);
