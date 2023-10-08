const EmailValidatorSDK = require('./email-validator-sdk'); // Replace with the correct path to your SDK file

// Replace 'your-api-key' with your actual API key
const apiKey = 'your-api-key';
const emailValidator = new EmailValidatorSDK(apiKey);

const emailAddressesToCheck = [
  'nyatindopatrick12@gmail.com',
  'dickensjuma@yahoo.com',
  'nonexistent@example12345.com',
  'info@mailboxlayer.com',
  "simple@example.com",
"very.common@example.com",
"abc@example.co.uk",
"disposable.style.email.with+symbol@example.com",
"other.email-with-hyphen@example.com",
"fully-qualified-domain@example.com",
"user.name+tag+sorting@example.com",
"example-indeed@strange-example.com",
"dickens@bluewaveinsurance.co.ke",
"dickens@bluewave.insure",
"james@mailinator.com"

  // Add more email addresses to check here...
];

async function runTests() {
  try {
    for (const email of emailAddressesToCheck) {
      const result = await emailValidator.validateEmail(email);
      console.log(`Result for ${email}:`, result);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

runTests();

  