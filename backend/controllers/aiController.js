require('dotenv').config();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Word documents (.docx, .doc), and image files (.jpg, .jpeg, .png, .gif, .bmp, .tiff) are allowed'), false);
    }
  }
});

// Extract text from different file types
const extractTextFromFile = async (file) => {
  const { buffer, mimetype, originalname } = file;
  
  try {
    switch (mimetype) {
      case 'application/pdf':
        const pdfData = await pdfParse(buffer);
        return {
          text: pdfData.text,
          type: 'PDF',
          pages: pdfData.numpages
        };
        
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        const docResult = await mammoth.extractRawText({ buffer });
        return {
          text: docResult.value,
          type: 'Word Document',
          warnings: docResult.messages
        };
        
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/png':
      case 'image/gif':
      case 'image/bmp':
      case 'image/tiff':
        // Convert image to a format Tesseract can handle better
        let processedBuffer = buffer;
        
        try {
          // Use sharp to preprocess the image for better OCR
          processedBuffer = await sharp(buffer)
            .resize(null, 1000, { 
              withoutEnlargement: true,
              fit: 'inside'
            })
            .greyscale()
            .normalize()
            .sharpen()
            .png()
            .toBuffer();
        } catch (sharpError) {
          console.log('Sharp preprocessing failed, using original buffer:', sharpError.message);
          processedBuffer = buffer;
        }
        
        const ocrResult = await Tesseract.recognize(processedBuffer, 'eng+hin', {
          logger: m => console.log('OCR Progress:', m)
        });
        
        return {
          text: ocrResult.data.text,
          type: 'Image (OCR)',
          confidence: ocrResult.data.confidence,
          language: 'English + Hindi'
        };
        
      default:
        throw new Error(`Unsupported file type: ${mimetype}`);
    }
  } catch (error) {
    throw new Error(`Failed to extract text from ${originalname}: ${error.message}`);
  }
};

// Universal file processing handler
const handleFileRequest = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    console.log(`Processing file: ${req.file.originalname} (${req.file.mimetype})`);

    // Extract text from the uploaded file
    const extractionResult = await extractTextFromFile(req.file);
    const extractedText = extractionResult.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: `Could not extract text from ${req.file.originalname} or the file appears to be empty`
      });
    }

    // Prepare message for AI with file content
    const { customPrompt } = req.body;
    const fileTypeInfo = `File Type: ${extractionResult.type}`;
    const additionalInfo = extractionResult.pages ? `Pages: ${extractionResult.pages}` : 
                          extractionResult.confidence ? `OCR Confidence: ${Math.round(extractionResult.confidence)}%` : '';
    
    const finalPrompt = customPrompt 
      ? `${customPrompt}\n\n${fileTypeInfo}${additionalInfo ? ` (${additionalInfo})` : ''}\nFile Content:\n${extractedText}`
      : `Please summarize and analyze the following ${extractionResult.type.toLowerCase()} content:\n\n${fileTypeInfo}${additionalInfo ? ` (${additionalInfo})` : ''}\nContent:\n${extractedText}`;

    // Process through AI
    let response;
    let retryCount = 0;
    const maxRetries = 3;

    // Try Gemini API first
    while (retryCount < maxRetries) {
      try {
        response = await fetch(`${process.env.GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: finalPrompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000,
            }
          }),
        });

        if (response.ok || (response.status !== 503 && response.status !== 500)) {
          break;
        }

        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      } catch (error) {
        console.error(`Gemini API attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }

    if (response && response.ok) {
      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        return res.status(200).json({
          success: true,
          response: aiResponse,
          source: 'gemini',
          fileName: req.file.originalname,
          fileType: extractionResult.type,
          extractedTextLength: extractedText.length,
          additionalInfo: extractionResult,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Fallback response if AI fails
    return res.status(200).json({
      success: true,
      response: `I've successfully extracted ${extractedText.length} characters from your ${extractionResult.type.toLowerCase()} "${req.file.originalname}". However, our AI service is temporarily unavailable. Here's the extracted content:\n\n${extractedText.substring(0, 1000)}${extractedText.length > 1000 ? '...' : ''}`,
      source: 'fallback',
      fileName: req.file.originalname,
      fileType: extractionResult.type,
      extractedTextLength: extractedText.length,
      additionalInfo: extractionResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('File processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing file',
      error: error.message
    });
  }
};

// Legacy PDF processing handler (for backward compatibility)
const handlePDFRequest = handleFileRequest;

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
        response = await fetch(`${process.env.GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
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
  handleAIRequest,
  handlePDFRequest,
  handleFileRequest,
  upload
};
