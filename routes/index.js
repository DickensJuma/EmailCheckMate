const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const EmailValidatorSDK = require('../email-validator-sdk');
const User = require('../models/user.model');
const Email = require('../models/email.model');
const ApiKey = require('../models/apikey.model');
const mongoose = require('mongoose');
const bcypt = require('bcryptjs');
const {generateApiKey, authToken, apiKeyMiddleware} = require('../middleware/index.js');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);



router.post('/validate-email', [
    check('email').isEmail(),apiKeyMiddleware
], async(req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const apiKey = req.header('x-api-key'); // Assuming API key is passed in the 'x-api-key' header

    // check if an api key is available 
    let apiKeyExists = await ApiKey.findOne({ apiKey });
    if (!apiKeyExists) {
        return res.status(400).json({code: 400, error: 'Invalid API key' });
    }
    // increase count
    apiKeyExists.count += 1;

    // save api key
    await apiKeyExists.save();

     const emailValidator = new EmailValidatorSDK(apiKey);
    const isValidEmail = await emailValidator.validateEmail(email);
    
    console.log("VALID EMAIL",isValidEmail);
    const emailDetailsReport = new Email({
        email,
        deliverability: isValidEmail.deliverability,
        quality_score: isValidEmail.quality_score,
        is_valid_format: isValidEmail.is_valid_format,
        is_disposable_email: isValidEmail.is_disposable_email,
        is_role_email: isValidEmail.is_role_email,
        is_catchall_email: isValidEmail.is_catchall_email,
        is_mx_found: isValidEmail.is_mx_found,
        is_smtp_valid: isValidEmail.is_smtp_valid,
        error: isValidEmail.error,
        ipAddress: req.ip,
        user_id: apiKeyExists.user_id,
        meta_data: isValidEmail.meta_data
    });
    await emailDetailsReport.save();

    if(isValidEmail.valid){
        return res.status(200).json(isValidEmail);
    }
    else{
        return res.status(400).json(isValidEmail);
    }
    
});


router.post('/generate-api-key',authToken, async (req, res) => {
    const {  user_id, paid } = req.body;

    let newApiKey = await generateApiKey(32);


    // check if user exists with email
    let user = await User.findOne({ _id: user_id });
    if (!user) {
        return res.status(400).json({code: 400, error: 'User does not exist' });
    }

    // check if user has paid
    if (!paid) {
        return res.status(400).json({code: 400, error: 'User has not paid' });
    }

    // check if user has already generated an api key

    let apiKeyExists = await ApiKey.findOne({ user_id: user_id });
    console.log("API KEY EXISTS",apiKeyExists);
    if (apiKeyExists) {
        return res.status(200).json({code: 200, message: 'API key already exists' , apiKey: apiKeyExists.apiKey});
    }

    // create api key
     let apiKey = new ApiKey({
        user_id,
        apiKey: newApiKey,
    });
    await apiKey.save();
    console.log("API KEY",apiKey);
    console.log("NEW API KEY",newApiKey);

    return res.status(201).json({code: 201, message: 'API key generated successfully', apiKey: newApiKey });


});

router.get('/api-keys', authToken, async (req, res) => {
   let user_id = req.user.user_id;
   console.log("USER ID",user_id);
    let apiKeys = await ApiKey.find({user_id});
    console.log("API KEYS",apiKeys);
    if(apiKeys.length === 0){
        return res.status(400).json({code: 400, error: 'No api keys found' });
    }

    return res.status(200).json({code: 200, apiKeys });

});

router.post("/create-checkout-session", async (req, res) => { 
    const  product  = req.body; 
    const session = await stripe.checkout.sessions.create({ 
      payment_method_types: ["card"], 
      line_items: [ 
        { 
          price_data: { 
            currency: "inr", 
            product_data: { 
              name: product.name, 
            }, 
            unit_amount: product.price * 100, 
          }, 
          quantity: product.quantity, 
        }, 
      ], 
      mode: "payment", 
      success_url: "http://localhost:3000/success", 
      cancel_url: "http://localhost:3000/cancel", 
    }); 
    res.json({ id: session.id }); 
  }); 

// register user

router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    const isValidEmail = await emailValidator.validateEmail(email);
    console.log("VALID EMAIL",isValidEmail);
    if(isValidEmail.deliverability === 'UNDELIVERABLE'){

        return res.status(400).json({
            code: 400,
            message: 'Invalid email'
        });
    }

    // check if user exists with email 
    let user = await User.findOne({ email });
    if (user) {
        return res.status(400).json({code: 400, error: 'User already exists' });
    }
    const salt = await bcypt.genSalt(10);
    const hashedPassword = await bcypt.hash(password, salt);
    user = new User({
        email,
        password: hashedPassword,
    });
    await user.save();

    // generate jwt token
    const payload = {
        user: {
            user_id: user.id,

        },
    };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
        if (err) throw err;
        return res.status(201).json({ code: 201,user_id: user.id, message: 'User created successfully', token });
    });


});



// login user

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if(!email || !password){
        return res.status(400).json({code: 400, error: 'Please provide email and password' });
    }

    // check if user exists with email
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({code: 400, error: 'Invalid credentials' });
    }

    // check if password is correct
    const isMatch = await bcypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({code: 400, error: 'Invalid credentials' });
    }

    // generate jwt token
    const payload = {
        user: {
            user_id: user.id,

        },
    };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
        if (err) throw err;
        return res.status(200).json({ code: 200, user_id: user.id, message: 'User logged in successfully', token });
    });


})

module.exports = router;

