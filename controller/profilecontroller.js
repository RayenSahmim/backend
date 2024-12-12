const NotificationModal = require('../models/NotificationModal');
const getUnreadNotifications = async(req, res) => {
  const userId = req.session?.user.id.toString();

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const notifications = await NotificationModal.find({ user :userId, isRead: false }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:');
    res.status(500).json({ error: 'Failed to fetch notifications'  , error});
  }
}
  
  module.exports = { getUnreadNotifications };  