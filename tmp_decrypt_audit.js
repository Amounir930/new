const crypto = require('node:crypto');

const masterKeyStr = 'ApexV2@EncMaster-Secure#2026!Growth_Scale_123';
const metadata = {"iv": "5eedfc86565d21ffdac23761", "enc": "f70d8148edbe608deaa3e0e72c4baa0618655e1813a42f9f607939d0b56bf6f41b61bf6c2876092701920d096e7a1ad27db6fc8f764a9f0a783278", "tag": "6db6c17422c22bdd4d9f2f72eb95267c", "data": {"v": 1}};

const keyBuffer = Buffer.from(masterKeyStr, 'utf8').subarray(0, 32);
const iv = Buffer.from(metadata.iv, 'hex');
const tag = Buffer.from(metadata.tag, 'hex');
const encrypted = metadata.enc;

try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    console.log('DECRYPTED_METADATA:', decrypted);
} catch (err) {
    console.error('DECRYPTION_FAILED:', err.message);
}
