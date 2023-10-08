// create api key model
const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    apiKey: String,
    count: {
        type: Number,
        default: 0
    },
   
}, { timestamps: true }
);

const ApiKey = mongoose.model('ApiKey', apiKeySchema);

module.exports = ApiKey;    
