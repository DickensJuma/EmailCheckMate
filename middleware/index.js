const jwt = require('jsonwebtoken');

function generateApiKey(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let apiKey = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      apiKey += characters.charAt(randomIndex);
    }
  
    return apiKey;
  }

  function authToken(req, res, next) {
    let token = req.header('authorization');
   
    if (!token) {
        return res.status(401).json({code: 401, error: 'No token provided' });
    }
    token = token.split(' ')[1];
    console.log("TOKEN",token);
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("DECODED",decoded);
        req.user = decoded.user;
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({code: 401, error: 'Invalid token' });
    }
}

// Middleware to validate the API key
const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.header('x-api-key'); // Assuming API key is passed in the 'x-api-key' header
  
    if (!apiKey) { // Replace 'your-api-key' with your actual API key
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    next();
  };

  
  module.exports = {
    generateApiKey,
    authToken,
    apiKeyMiddleware
  };