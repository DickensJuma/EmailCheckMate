const express = require('express');
const mongoose = require('mongoose');
const EmailCheckMateRoutes = require('./routes/index.js');
const cors = require('cors');
const dotenv = require('dotenv');   
dotenv.config();


const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 6000;

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
