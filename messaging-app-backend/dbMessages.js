import mongoose from "mongoose";

const messagingSchema = mongoose.Schema({
  message: String,
  name: String,
  timestamp: String,
  received: Boolean,
  type: { type: String, default: "text" },
  fileUrl: String,
  imageId: String,
});

export default mongoose.model("messagingmessages", messagingSchema);
