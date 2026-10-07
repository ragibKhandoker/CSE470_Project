const messageModel = require('../models/messageModel');
const userModel = require('../models/userModel');

const sendMessage = async (req, res, next) => {
  try {
    const { receiver_id, food_post_id, message_text } = req.body;
    const sender_id = req.user.id;

    if (!receiver_id || !message_text || !message_text.trim()) {
      return res.status(400).json({
        message: 'Receiver ID and a non-empty message are required'
      });
    }

    if (Number(receiver_id) === Number(sender_id)) {
      return res.status(400).json({ message: 'You cannot send a message to yourself' });
    }

    const receiver = await userModel.findById(receiver_id);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver user not found' });
    }

    const message = await messageModel.createMessage({
      sender_id,
      receiver_id,
      food_post_id: food_post_id || null,
      message_text
    });

    return res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    next(error);
  }
};

const getConversation = async (req, res, next) => {
  try {
    const otherUserId = Number(req.params.userId);
    const foodPostId = req.query.food_post_id ? Number(req.query.food_post_id) : null;

    if (!Number.isInteger(otherUserId) || otherUserId <= 0) {
      return res.status(400).json({ message: 'A valid userId is required' });
    }

    const messages = await messageModel.findConversation(req.user.id, otherUserId, foodPostId);
    return res.status(200).json({
      message: 'Conversation retrieved successfully',
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

const sendAdminMessage = async (req, res, next) => {
  try {
    const receiverId = Number(req.body.receiver_id);
    const messageText = typeof req.body.message_text === 'string' ? req.body.message_text.trim() : '';

    if (!Number.isInteger(receiverId) || receiverId <= 0 || !messageText) {
      return res.status(400).json({ message: 'A valid receiver and non-empty message are required' });
    }
    if (messageText.length > 2000) {
      return res.status(400).json({ message: 'Message must be 2000 characters or fewer' });
    }

    const receiver = await userModel.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver user not found' });
    }
    if (!['donor', 'receiver'].includes((receiver.role || '').toLowerCase())) {
      return res.status(400).json({ message: 'Admins can send profile messages only to donors and receivers' });
    }

    const message = await messageModel.createAdminMessage({
      sender_id: req.user.id,
      receiver_id: receiverId,
      receiver_role: receiver.role.toLowerCase(),
      message_text: messageText
    });

    return res.status(201).json({ message: 'Message sent successfully', data: message });
  } catch (error) {
    next(error);
  }
};

const getAdminInbox = async (req, res, next) => {
  try {
    if (!['donor', 'receiver'].includes((req.user.role || '').toLowerCase())) {
      return res.status(403).json({ message: 'Admin messages are available to donors and receivers only' });
    }

    const messages = await messageModel.findAdminMessagesForUser(req.user.id);
    return res.status(200).json({ message: 'Admin messages retrieved successfully', data: messages });
  } catch (error) {
    next(error);
  }
};

const replyToAdmin = async (req, res, next) => {
  try {
    const adminId = Number(req.body.receiver_id);
    const messageText = typeof req.body.message_text === 'string' ? req.body.message_text.trim() : '';
    if (!Number.isInteger(adminId) || adminId <= 0 || !messageText) {
      return res.status(400).json({ message: 'A valid admin and non-empty message are required' });
    }
    if (messageText.length > 2000) {
      return res.status(400).json({ message: 'Message must be 2000 characters or fewer' });
    }
    if (!['donor', 'receiver'].includes((req.user.role || '').toLowerCase())) {
      return res.status(403).json({ message: 'Only donors and receivers can reply to admin messages' });
    }

    const admin = await userModel.findById(adminId);
    if (!admin || !['admin', 'super_admin'].includes((admin.role || '').toLowerCase())) {
      return res.status(400).json({ message: 'The selected recipient is not an admin' });
    }

    const priorMessages = await messageModel.findConversation(req.user.id, adminId);
    if (!priorMessages.some((message) => Number(message.sender_id) === adminId)) {
      return res.status(403).json({ message: 'You can reply only to an admin who has messaged you' });
    }

    const message = await messageModel.createAdminReply({
      sender_id: req.user.id,
      receiver_id: adminId,
      message_text: messageText
    });
    return res.status(201).json({ message: 'Reply sent successfully', data: message });
  } catch (error) {
    next(error);
  }
};

const getAdminUserConversation = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: 'A valid userId is required' });
    }
    const targetUser = await userModel.findById(userId);
    if (!targetUser || !['donor', 'receiver'].includes((targetUser.role || '').toLowerCase())) {
      return res.status(404).json({ message: 'Donor or receiver user not found' });
    }

    const messages = await messageModel.findAdminConversationWithUser(userId, req.user.id);
    return res.status(200).json({ message: 'Conversation retrieved successfully', data: messages });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getConversation,
  sendAdminMessage,
  getAdminInbox,
  replyToAdmin,
  getAdminUserConversation
};