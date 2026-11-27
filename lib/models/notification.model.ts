import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "follow",
        "like",
        "comment",
        "reply",
        "community_invitation",
        "community_join_approved",
        "community_join_rejected",
      ],
      required: true,
    },
    entityType: {
      type: String,
      enum: ["user", "thread", "community"],
      required: true,
    },
    entityId: { type: String, required: true },
    message: { type: String, required: true, maxlength: 240 },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;
