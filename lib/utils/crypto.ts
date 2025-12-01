const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH = 'SHA-256';
const AES_KEY_LENGTH = 256;
const AES_GCM_IV_LENGTH = 12;

function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto as Crypto;
  }
  throw new Error('Web Crypto API is unavailable in this environment');
}

function getSubtle(): SubtleCrypto {
  return getCrypto().subtle;
}

export function generateSalt(length = 16): Uint8Array {
  const salt = new Uint8Array(length);
  getCrypto().getRandomValues(salt);
  return salt;
}

async function importPasscodeKey(passcode: string): Promise<CryptoKey> {
  const subtle = getSubtle();
  return subtle.importKey(
    'raw',
    TEXT_ENCODER.encode(passcode),
    'PBKDF2',
    false,
    ['deriveKey', 'deriveBits']
  );
}

export async function deriveKey(passcode: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtle = getSubtle();
  const baseKey = await importPasscodeKey(passcode);
  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: AES_KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function hashPasscode(passcode: string, salt: Uint8Array): Promise<string> {
  const subtle = getSubtle();
  const baseKey = await importPasscodeKey(passcode);
  const derivedBits = await subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    baseKey,
    AES_KEY_LENGTH
  );
  return bufferToBase64(derivedBits);
}

export async function encryptSecret(plaintext: string, key: CryptoKey): Promise<string> {
  const subtle = getSubtle();
  const iv = generateSalt(AES_GCM_IV_LENGTH);
  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    TEXT_ENCODER.encode(plaintext)
  );
  return `${bufferToBase64(iv)}:${bufferToBase64(ciphertext)}`;
}

export async function decryptSecret(ciphertext: string, key: CryptoKey): Promise<string> {
  const subtle = getSubtle();
  const [ivPart, dataPart] = ciphertext.split(':');
  if (!ivPart || !dataPart) {
    throw new Error('Invalid ciphertext format');
  }
  const iv = base64ToBuffer(ivPart);
  const dataBytes = base64ToBuffer(dataPart);
  const dataBuffer = new Uint8Array(dataBytes).buffer;
  const decrypted = await subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    dataBuffer
  );
  return TEXT_DECODER.decode(decrypted);
}

export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function base64ToBuffer(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binary = atob(base64);
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function verifyPasscode(passcode: string, salt: Uint8Array, expectedHash: string): Promise<boolean> {
  const hash = await hashPasscode(passcode, salt);
  return hash === expectedHash;
}

