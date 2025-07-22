const express = require('express');
const router = express.Router();
const { handleAIRequest } = require('../controllers/aiController');
const { verifyToken } = require('../controllers/authController');

// Public route for anonymous users (trial)
router.post('/chat-anonymous', handleAIRequest);

// Protected route for authenticated users
router.post('/chat', verifyToken, handleAIRequest);

module.exports = router;
