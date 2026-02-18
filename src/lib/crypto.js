/**
 * End-to-End Encryption Module
 * Uses Web Crypto API (AES-256-GCM) for client-side encryption
 * 
 * Security Model:
 * - Encryption key derived from user password via PBKDF2 (600k iterations)
 * - AES-256-GCM provides authenticated encryption (confidentiality + integrity)
 * - IV (12 bytes) generated randomly per operation (never reused)
 * - Server never sees plaintext or encryption key (zero-knowledge)
 * 
 * Format: base64(iv + ciphertext + authTag)
 */

const PBKDF2_ITERATIONS = 600000; // OWASP recommendation for SHA-256
const SALT_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits (GCM standard)

/**
 * Generate a random salt for key derivation
 * @returns {Promise<string>} Base64-encoded salt
 */
export async function generateSalt() {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  return arrayBufferToBase64(salt);
}

/**
 * Derive encryption key from password using PBKDF2
 * @param {string} password - User password
 * @param {string} saltBase64 - Base64-encoded salt
 * @returns {Promise<CryptoKey>} AES-256-GCM key
 */
export async function deriveKey(password, saltBase64) {
  const salt = base64ToArrayBuffer(saltBase64);
  
  // Import password as raw key material
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES-256-GCM key
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false, // not extractable
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Encrypt plaintext using AES-256-GCM
 * @param {string} plaintext - Text to encrypt
 * @param {CryptoKey} key - AES-256-GCM key
 * @returns {Promise<string>} Base64-encoded (iv + ciphertext + authTag)
 */
export async function encrypt(plaintext, key) {
  if (!plaintext) return '';
  
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  // Concatenate: iv + ciphertext (includes authTag)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return arrayBufferToBase64(combined);
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * @param {string} ciphertextBase64 - Base64-encoded (iv + ciphertext + authTag)
 * @param {CryptoKey} key - AES-256-GCM key
 * @returns {Promise<string>} Decrypted plaintext
 */
export async function decrypt(ciphertextBase64, key) {
  if (!ciphertextBase64) return '';

  try {
    const combined = base64ToArrayBuffer(ciphertextBase64);
    
    // Extract iv and ciphertext
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data. Invalid key or corrupted data.');
  }
}

/**
 * Encrypt JSON data
 * @param {any} data - Data to encrypt (will be JSON.stringified)
 * @param {CryptoKey} key - AES-256-GCM key
 * @returns {Promise<string>} Base64-encoded encrypted JSON
 */
export async function encryptJSON(data, key) {
  if (!data) return '';
  const json = JSON.stringify(data);
  return encrypt(json, key);
}

/**
 * Decrypt JSON data
 * @param {string} ciphertextBase64 - Base64-encoded encrypted JSON
 * @param {CryptoKey} key - AES-256-GCM key
 * @returns {Promise<any>} Decrypted and parsed JSON
 */
export async function decryptJSON(ciphertextBase64, key) {
  if (!ciphertextBase64) return null;
  const json = await decrypt(ciphertextBase64, key);
  return json ? JSON.parse(json) : null;
}

// Utility functions

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
