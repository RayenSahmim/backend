const crypto = require('crypto');
require('dotenv').config();

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // Convert from hex string
const IV_LENGTH = 16; // AES block size

// Static IV for consistent encryption
const STATIC_IV = crypto.createHash('sha256').update('your-static-salt').digest().slice(0, IV_LENGTH);

// Function to encrypt
const encrypt = (text) => {
  try {
    // Use a static IV for consistent encryption
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, STATIC_IV);
    
    // Ensure input is a string
    const textToEncrypt = text.toString();
    
    let encrypted = cipher.update(textToEncrypt, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

// Function to decrypt
const decrypt = (encryptedText) => {
  try {
    // Use the same static IV for decryption
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, STATIC_IV);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed');
  }
};

module.exports = { encrypt, decrypt };