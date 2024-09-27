import mongoose from "mongoose";

const userSchema = new mongoose.Schema({ 
    id : { type: String, required: true },
    username : { type: String, required: true, unique: true },
    name : { type: String, required: true },
    image : String,
    bio : String,
    threads : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }],
    onboarded: { type: Boolean, default: false },
    communities : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Community' }],
    createdAt: { type: Date, default: Date.now },
    taggedIn : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }],
    invitedTo : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Community' }],
    likedThreads : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }],
    myLikedThreads : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }],
    sharedThreadsByFr : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }],
    following : [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers : [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;