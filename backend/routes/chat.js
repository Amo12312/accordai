const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/authController');
const { 
  sendMessage, 
  getChatHistory, 
  getUserAnalytics 
} = require('../controllers/chatController');

// Public route for anonymous trial
router.post('/send-anonymous', sendMessage);

// Protected routes
router.post('/send', verifyToken, sendMessage);
router.get('/history/:firebaseUid', verifyToken, getChatHistory);
router.get('/analytics', verifyToken, getUserAnalytics);

module.exports = router;
