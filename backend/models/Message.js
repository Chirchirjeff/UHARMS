import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  senderRole: {
    type: String,
    enum: ["patient", "doctor"],
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  receiverRole: {
    type: String,
    enum: ["patient", "doctor"],
    required: true
  },
  content: {
    type: String,
    trim: true
  },
  messageType: {
    type: String,
    enum: ["text", "prescription", "booking_confirmation", "appointment_reminder"],
    default: "text"
  },
  prescriptionData: {
    diagnosis: String,
    medicines: [{
      name: String,
      dosage: String,
      duration: String
    }],
    notes: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  // NEW: Track when message was delivered to receiver
  deliveredAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// ✅ Important for fast message loading
messageSchema.index({ conversationId: 1, createdAt: -1 });
// NEW: Index for tracking unread/delivered messages
messageSchema.index({ receiverId: 1, isRead: 1, deliveredAt: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;