import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;
    const { message } = req.body;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      message,
    });
    if (newMessage) conversation.messages.push(newMessage._id);

    await Promise.all([conversation.save(), newMessage.save()]);

    //implement socket io for real time data transfer

    return res.status(200).json({
      message: "message sent successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Message cannot be sent, please try again later",
    });
  }
};

export const getMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;
    const conversation = await Conversation.find({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation)
      return res.status(200).json({
        message: [],
        success: false,
      });

    return res.status(200).json({
      message: conversation?.messages,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Message cannot be retrieved, please try again later",
    });
  }
};
