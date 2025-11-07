
// This tells TypeScript that CryptoJS is a global variable provided by the script in index.html
declare const CryptoJS: any;

export const encrypt = (data: string, key: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, key).toString();
      resolve(encrypted);
    } catch (e) {
      reject(e);
    }
  });
};

export const decrypt = (encryptedData: string, key: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      // If decryption fails (e.g. wrong password), originalText will be empty
      if (originalText) {
          resolve(originalText);
      } else {
          throw new Error("Decryption failed");
      }
    } catch (e) {
      reject(e);
    }
  });
};
