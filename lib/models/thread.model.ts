import mongoose from "mongoose";

const threadSchema = new mongoose.Schema({ 
    text: { type: String, required: true },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    community:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Community",
    },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    parentId:{
        type: String
    },
    children: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Thread"
        }
    ],
    topics: [{
        type: String
    }
    ],
    repost: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Thread"
        }
    ],
    repostedIn: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Thread"
        }
    ],
    sharedBy : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    likedBy : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
  });

const Thread = mongoose.models.Thread || mongoose.model('Thread', threadSchema);

export default Thread;