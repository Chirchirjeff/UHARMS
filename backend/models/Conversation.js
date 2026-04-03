import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: ["patient", "doctor"],
      required: true
    }
  }],
  lastMessage: {
    type: String,
    default: ""
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking"
  }
}, {
  timestamps: true
});

// ✅ FIX: Ensure one conversation per appointment
conversationSchema.index(
  { appointmentId: 1 },
  { unique: true, sparse: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;