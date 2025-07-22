require('dotenv').config();

// Gemini API configuration
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const API_KEY = 'AIzaSyBRhGw0lcagRIgwauI1ZXESO--kYjL88_Q';

// AI API handler with both Gemini and backup
const handleAIRequest = async (req, res) => {
  try {
    const { message, userId, isAnonymous = false } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    let response;
    let retryCount = 0;
    const maxRetries = 3;

    // Try Gemini API first
    while (retryCount < maxRetries) {
      try {
        response = await fetch(`${API_URL}?key=${API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: message
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            }
          }),
        });

        // If success or non-retryable error, break
        if (response.ok || (response.status !== 503 && response.status !== 500)) {
          break;
        }

        retryCount++;
        if (retryCount < maxRetries) {
          // Wait before retry (exponential backoff)
          const waitTime = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
          console.log(`Retrying Gemini API in ${waitTime/1000} seconds... (Attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      } catch (geminiError) {
        console.error('Gemini API error:', geminiError);
        break;
      }
    }

    // Check if Gemini API was successful
    if (response && response.ok) {
      const responseData = await response.json();
      const responseContent = responseData.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

      return res.status(200).json({
        success: true,
        response: responseContent,
        source: 'gemini',
        timestamp: new Date().toISOString()
      });
    }

    // If Gemini fails, try backup API
    console.log('Gemini API failed, trying backup API...');
    
    try {
      const backupResponse = await fetch(process.env.BACKUP_API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (backupResponse.ok) {
        const backupData = await backupResponse.json();
        
        // Find matching response from backup API
        const userContentLower = message.toLowerCase().trim();
        let responseContent = backupData[userContentLower];
        
        // If no exact match, try partial matches
        if (!responseContent) {
          const keys = Object.keys(backupData);
          const partialMatch = keys.find(key => 
            userContentLower.includes(key.toLowerCase()) || 
            key.toLowerCase().includes(userContentLower)
          );
          
          if (partialMatch) {
            responseContent = backupData[partialMatch];
          } else {
            responseContent = "Sorry, our main AI is temporarily down, but I'm still here! Try asking something else.";
          }
        }

        return res.status(200).json({
          success: true,
          response: `🔄 ${responseContent}`,
          source: 'backup',
          timestamp: new Date().toISOString()
        });
      }
    } catch (backupError) {
      console.error('Backup API also failed:', backupError);
    }

    // If both APIs fail
    return res.status(503).json({
      success: false,
      message: 'All AI services are temporarily unavailable. Please try again later.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  handleAIRequest
};
