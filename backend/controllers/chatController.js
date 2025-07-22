const User = require('../models/User');
const { db } = require('../config/firebase');

// Send message (with trial/premium checking)
const sendMessage = async (req, res) => {
  try {
    const { firebaseUid, message, isAnonymous = false } = req.body;

    // Handle anonymous users
    if (isAnonymous || !firebaseUid) {
      // For anonymous users, we'll use the existing Gemini API directly
      // This allows trial usage without database storage
      return res.status(200).json({
        success: true,
        message: 'Anonymous message processed',
        requiresAuth: false
      });
    }

    // For authenticated users, check their status
    const user = await User.findOne({ firebaseUid });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const now = new Date();
    
    // Check if user has premium access
    if (user.isPremium) {
      // Premium users have unlimited access
      user.messageCount += 1;
      user.lastActiveTime = now;
      await user.save();

      // Log to Firebase Realtime Database
      await db.ref(`chats/${firebaseUid}`).push({
        message,
        timestamp: now.toISOString(),
        messageCount: user.messageCount
      });

      return res.status(200).json({
        success: true,
        message: 'Message sent successfully',
        isPremium: true,
        messageCount: user.messageCount
      });
    }

    // Check trial status for non-premium users
    if (!user.trialStartTime) {
      // Start trial for first-time users
      user.trialStartTime = now;
      user.trialEndTime = new Date(now.getTime() + (parseInt(process.env.TRIAL_DURATION_MINUTES) * 60 * 1000));
    }

    const isTrialExpired = now > user.trialEndTime;
    const hasReachedMessageLimit = user.messageCount >= parseInt(process.env.MAX_TRIAL_MESSAGES);

    if (isTrialExpired || hasReachedMessageLimit) {
      return res.status(403).json({
        success: false,
        message: 'Trial period expired or message limit reached',
        requiresAuth: true,
        trialExpired: isTrialExpired,
        messageLimitReached: hasReachedMessageLimit,
        messageCount: user.messageCount,
        maxMessages: parseInt(process.env.MAX_TRIAL_MESSAGES)
      });
    }

    // Allow message for trial users
    user.messageCount += 1;
    user.lastActiveTime = now;
    await user.save();

    // Log to Firebase Realtime Database
    await db.ref(`chats/${firebaseUid}`).push({
      message,
      timestamp: now.toISOString(),
      messageCount: user.messageCount,
      trialUser: true
    });

    const remainingMessages = Math.max(0, parseInt(process.env.MAX_TRIAL_MESSAGES) - user.messageCount);
    const remainingTime = Math.max(0, user.trialEndTime.getTime() - now.getTime());

    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      messageCount: user.messageCount,
      remainingMessages,
      remainingTime,
      trialEndTime: user.trialEndTime
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// Get chat history
const getChatHistory = async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { limit = 50 } = req.query;

    const snapshot = await db.ref(`chats/${firebaseUid}`)
      .orderByChild('timestamp')
      .limitToLast(parseInt(limit))
      .once('value');

    const chatHistory = [];
    snapshot.forEach((childSnapshot) => {
      chatHistory.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });

    res.status(200).json({
      success: true,
      chatHistory: chatHistory.reverse() // Show newest first
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat history',
      error: error.message
    });
  }
};

// Get user analytics (for admin)
const getUserAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({ isPremium: true });
    const trialUsers = await User.countDocuments({ isPremium: false });
    
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('email displayName createdAt messageCount isPremium');

    // Get online users from Firebase Realtime Database
    const onlineSnapshot = await db.ref('users').orderByChild('isOnline').equalTo(true).once('value');
    const onlineCount = Object.keys(onlineSnapshot.val() || {}).length;

    res.status(200).json({
      success: true,
      analytics: {
        totalUsers,
        premiumUsers,
        trialUsers,
        onlineUsers: onlineCount,
        recentUsers
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
  getUserAnalytics
};
