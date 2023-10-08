const mongoose = require('mongoose');


// email,
// deliverability: 'UNDELIVERABLE',
// quality_score: '0.00',
// is_valid_format: false,
// is_disposable_email: JSON.parse(disposableCheckResult.is_disposable),
// is_role_email: false,
// is_catchall_email: false,
// is_mx_found: false,
// is_smtp_valid: false,
// error: 'Invalid email format',
// user schema
const  emailSchema = new mongoose.Schema({
    user_id : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    email: String,
    deliverability: String,
    quality_score: String,
    is_free: Boolean,
    is_valid_format: Boolean,
    is_disposable_email: Boolean,
    is_role_email: Boolean,
    is_catchall_email: Boolean,
    is_mx_found: Boolean,
    is_smtp_valid: Boolean,
    error: String,
    ipAddress: String, 
    meta_data: Array,
}, { timestamps: true }
);

const Email = mongoose.model('Email', emailSchema);

module.exports = Email;
