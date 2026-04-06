// backend/routes/messageRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

const router = express.Router();

// Middleware to verify token
const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

// Get user's conversations
router.get("/conversations", verifyAuth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      "participants.userId": req.user._id
    })
      .populate("participants.userId", "name email role")
      .populate("appointmentId", "date time")
      .sort({ lastMessageAt: -1 });
    
    const formatted = await Promise.all(conversations.map(async (conv) => {
      const other = conv.participants.find(
        p => p.userId._id.toString() !== req.user._id.toString()
      );
      
      // Get last message with status
      const lastMessageObj = await Message.findOne({ conversationId: conv._id })
        .sort({ createdAt: -1 })
        .populate("senderId", "name");
      
      return {
        _id: conv._id,
        otherUser: {
          _id: other?.userId._id,
          name: other?.userId.name || "Unknown",
          email: other?.userId.email || "",
          role: other?.role || ""
        },
        lastMessage: lastMessageObj?.content || conv.lastMessage || "",
        lastMessageAt: lastMessageObj?.createdAt || conv.lastMessageAt,
        lastMessageId: lastMessageObj?._id,
        lastMessageStatus: lastMessageObj ? {
          isRead: lastMessageObj.isRead || false,
          deliveredAt: lastMessageObj.deliveredAt || null,
          isSentByMe: lastMessageObj.senderId?._id.toString() === req.user._id.toString()
        } : null,
        unreadCount: await Message.countDocuments({
          conversationId: conv._id,
          receiverId: req.user._id,
          isRead: false
        }),
        appointment: conv.appointmentId
      };
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get messages for a conversation (with auto-delivery tracking)
router.get("/conversations/:conversationId/messages", verifyAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    console.log("Fetching messages for conversation:", conversationId);
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    // Verify user is part of conversation
    const isParticipant = conversation.participants.some(
      p => p.userId.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    // Auto-mark messages as delivered when fetched by receiver
    await Message.updateMany(
      {
        conversationId,
        receiverId: req.user._id,
        deliveredAt: null
      },
      { deliveredAt: new Date() }
    );
    
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate("senderId", "name");
    
    console.log(`Found ${messages.length} messages`);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Send a message
router.post("/conversations/:conversationId/messages", verifyAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType, prescriptionData } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    // Find the receiver
    const receiver = conversation.participants.find(
      p => p.userId.toString() !== req.user._id.toString()
    );
    
    if (!receiver) {
      return res.status(400).json({ error: "Receiver not found" });
    }
    
    // Create message
    const message = new Message({
      conversationId,
      senderId: req.user._id,
      senderRole: req.user.role,
      receiverId: receiver.userId,
      receiverRole: receiver.role,
      content: content.trim(),
      messageType: messageType || "text",
      prescriptionData,
      isRead: false,
      deliveredAt: null
    });
    
    await message.save();
    
    // Update conversation
    conversation.lastMessage = content.trim();
    conversation.lastMessageAt = new Date();
    await conversation.save();
    
    // Populate sender info
    await message.populate("senderId", "name");
    
    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Mark message as delivered
router.put("/:messageId/delivered", verifyAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    
    // Only the receiver can mark as delivered
    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized - Only receiver can mark as delivered" });
    }
    
    // Only update if not already delivered
    if (!message.deliveredAt) {
      message.deliveredAt = new Date();
      await message.save();
    }
    
    res.json({ 
      success: true, 
      messageId: message._id,
      deliveredAt: message.deliveredAt 
    });
  } catch (error) {
    console.error("Error marking message as delivered:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Mark message as read
router.put("/:messageId/read", verifyAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    
    // Only the receiver can mark as read
    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized - Only receiver can mark as read" });
    }
    
    // Only update if not already read
    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }
    
    res.json({ 
      success: true, 
      messageId: message._id,
      isRead: message.isRead,
      readAt: message.readAt
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get unread messages count (with auto-delivery tracking)
router.get("/unread/count", verifyAuth, async (req, res) => {
  try {
    // Mark messages as delivered when checking unread count
    await Message.updateMany(
      {
        receiverId: req.user._id,
        deliveredAt: null
      },
      { deliveredAt: new Date() }
    );
    
    const unreadCount = await Message.countDocuments({
      receiverId: req.user._id,
      isRead: false
    });
    
    res.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create a new conversation
router.post("/conversations", verifyAuth, async (req, res) => {
  try {
    const { otherUserId, appointmentId } = req.body;
    
    if (!otherUserId) {
      return res.status(400).json({ error: "otherUserId is required" });
    }
    
    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      "participants.userId": { $all: [req.user._id, otherUserId] }
    });
    
    if (!conversation) {
      const otherUser = await User.findById(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      conversation = new Conversation({
        participants: [
          { userId: req.user._id, role: req.user.role },
          { userId: otherUserId, role: otherUser.role }
        ],
        appointmentId: appointmentId || null,
        lastMessage: "",
        lastMessageAt: new Date()
      });
      
      await conversation.save();
    }
    
    res.json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;