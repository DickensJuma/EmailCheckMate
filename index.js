const express = require('express');
const dns = require('dns');
const { check, validationResult } = require('express-validator');
const EmailValidatorSDK = require('./email-validator-sdk'); // Replace with the correct path to your SDK file
const mongoose = require('mongoose');
const bcypt = require('bcryptjs');
const cors = require('cors');
const dotenv = require('dotenv');   
dotenv.config();
const {generateApiKey} = require('./middleware/index.js');
const EmailCheckMateRoutes = require('./routes/index.js');





const app = express();
const port = process.env.PORT || 6000;



app.use(express.json());
//app.use(apiKeyMiddleware); // Use the API key middleware
app.use(cors());
//connect to db
const db_url = process.env.MONGO_URL;
mongoose.connect(db_url,{
    useNewUrlParser: true,
    useUnifiedTopology: true
    })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));




app.use('/api/v1', EmailCheckMateRoutes);




app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
