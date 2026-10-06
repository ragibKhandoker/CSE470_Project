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

module.exports = { sendMessage, getConversation };