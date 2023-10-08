const dns = require('dns');
const axios = require('axios'); 
const emailValidator = require('deep-email-validator')

const fs = require('fs');

let rawdata = fs.readFileSync('./free-email-providers.json');
let free_email_provider_domains = JSON.parse(rawdata);




class EmailValidatorSDK {
  constructor(apiKey) {
    this.apiKey = apiKey;
   
  }

  async validateEmail(email) {
    try {
      const disposableCheckResult = await this.checkDisposableEmail(email);
      //console.log("DISPOSABLE CHECK",disposableCheckResult);
      const domain = email.split('@')[1];
      console.log("DOMAIN",domain);
      const mxRecords = await this.resolveMxRecords(domain);
     // console.log("MX RECORDS",mxRecords);

  
    const validEmail = await emailValidator.validate(email)
    console.log("VALID EMAIL",validEmail);
         
    // Validate the free email provider
    const freeEmailProvider = free_email_provider_domains.some((domain) => { 
        return email.includes(domain);
    });
    console.log("FREE EMAIL PROVIDER",freeEmailProvider);
    let is_free_domain = false;
    if(freeEmailProvider){
        is_free_domain = true;
    }
   
      
      // Validate the email format
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email) || validEmail.validators.regex.value === false) {
        console.log("REGEX 2",validEmail.validators.regex.value);
        console.log("REGEX 2",emailRegex.test(email));
        return {
          email,
          deliverability: 'UNDELIVERABLE',
          quality_score: '0.00',
          is_valid_format: false,
          is_free: is_free_domain,
          is_disposable_email: JSON.parse(disposableCheckResult.is_disposable),
          is_role_email: false,
          is_catchall_email: false,
          is_mx_found: false,
          is_smtp_valid: false,
          error: 'Invalid email format',
          meta_data:  [domain, mxRecords, validEmail, freeEmailProvider]
        };
      }

      // Calculate quality score based on criteria
      let qualityScore = 1.0;

      if (JSON.parse(disposableCheckResult.is_disposable)){
        console.log("DISPOSABLE 2",JSON.parse(disposableCheckResult.is_disposable));
        qualityScore -= 0.3;
      }

    
      if ( !validEmail.valid) {
         console.log("SMTP validEmail 3",validEmail.valid);
        qualityScore -= 0.5;
      }

     
 
      if ( !mxRecords || mxRecords?.length === 0) {
     
        qualityScore -= 0.4;
      }

        // if (freeEmailProvider) {
        // console.log("FREE EMAIL PROVIDER 3",freeEmailProvider);
        // qualityScore -= 0.2;
        // }


   

      qualityScore = Math.max(0, Math.min(1, qualityScore));
    console.log("QUALITY SCORE",qualityScore);

      const deliverableThreshold = 0.6;
      const catchallThreshold = 0.8;
      let deliverability = 'UNDELIVERABLE';

      if (qualityScore >= deliverableThreshold) {
        deliverability = 'DELIVERABLE';

        if (qualityScore >= catchallThreshold) {
          return {
            email,
            deliverability,
            quality_score: qualityScore.toFixed(2),
            is_valid_format: true,
            is_free: is_free_domain,
            is_disposable_email: JSON.parse(disposableCheckResult.is_disposable),
            is_role_email: false,
            is_catchall_email: true,
            is_mx_found: true,
            is_smtp_valid: true,
            meta_data:  [domain, mxRecords, validEmail, freeEmailProvider]
            
          };
        }
      }

      return {
        email,
        deliverability,
        quality_score: qualityScore.toFixed(2),
        is_valid_format: true,
        is_free: is_free_domain,
        is_disposable_email:JSON.parse(disposableCheckResult.is_disposable),
        is_role_email: false,
        is_catchall_email: false,
        is_mx_found: mxRecords && mxRecords.length > 0,
        is_smtp_valid: validEmail.valid,
        meta_data:  [domain, mxRecords, validEmail, freeEmailProvider]
      };
    } catch (error) {
        console.log("ERROR",error);
      return {
        email,
        deliverability: 'UNDELIVERABLE',
        quality_score: '0.00',
        is_valid_format: false,
        is_free: false,
        is_disposable_email: false,
        is_role_email: false,
        is_catchall_email: false,
        is_mx_found: false,
        is_smtp_valid: false,
        error: error.message,
        meta_data:  [domain, mxRecords, validEmail, freeEmailProvider]
        
      };
    }
  }

  async checkDisposableEmail(email) {
    try {
    const url = `https://disposable.debounce.io/?email=${email}`
      const response = await axios.get(url, {
        auth: {
          username: this.apiKey,
          password: '',
        },
      });

      return {
        is_disposable: response.data.disposable,
      };
    }

    catch (error) {
        return {
            is_disposable: false,
        };
        }
    }


  resolveMxRecords(domain) {
    return new Promise((resolve, reject) => {
      dns.resolveMx(domain, (err, mxRecords) => {
        if (err || !mxRecords || mxRecords.length === 0) {
          resolve(null);
        } else {
          resolve(mxRecords);
        }
      });
    });
  }
}

module.exports = EmailValidatorSDK;
