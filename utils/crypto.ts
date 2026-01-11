import CryptoJS from 'crypto-js';

// Specific secret key for this application
// Note: In a client-side only application, this key is inevitably exposed in the bundle.
// Its primary purpose is to obscure the API key in local storage, not to protect against
// determined reverse engineering.
const SECRET_KEY = "chat-translate-secure-storage-key-v1";

export const encryptData = (data: string): string => {
    if (!data) return "";
    try {
        return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
    } catch (e) {
        console.error("Encryption failed", e);
        return "";
    }
};

export const decryptData = (encryptedData: string): string => {
    if (!encryptedData) return "";
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        console.error("Decryption failed", e);
        return "";
    }
};
