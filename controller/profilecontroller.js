const Notification = require('../models/NotificationModal');
const { decrypt, encrypt } = require('../utils/crypto');
const roomSchema = require('../models/Room');
const getUnreadNotifications = async (req, res) => {
  const userId = req.session?.user.id.toString();

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const encryptedNotifications = await Notification.find({ user: userId, isRead: false })
      .sort({ timestamp: -1 });

    const notifications = encryptedNotifications.map((notification) => ({
      ...notification.toObject(),
      type: decrypt(notification.type),
      content: decrypt(notification.content), // Decrypt the content
    }));

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

const sendInvitation = async(req,res) => {
  const userId = req.session?.user.id.toString();
  const otherUserId = req.body.otherUserId;

  if (!userId ) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const notification = new Notification({
          user: otherUserId, // Recipient
          from: userId, // Sender
          type: encrypt("friend_request"),
          content: encrypt("You have a friend request"),
          timestamp: new Date(),
        });
        await notification.save();

    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }

}

const acceptInvitation = async(req,res) => {
  const userId = req.session?.user.id.toString();
  const otherUserId = req.body.otherUserId;

  if (!userId ) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const findroom = await roomSchema.findOne({ users: { $all: [userId, otherUserId] } });

    if (findroom) {
      return res.status(400).json({ error: 'Room already exists' });
    }
    const room = new roomSchema({
      users: [userId, otherUserId],
    });
    await room.save();

   

    res.json({ message: 'Invitation accepted successfully' });

    
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
    
  }
}

module.exports = { getUnreadNotifications };