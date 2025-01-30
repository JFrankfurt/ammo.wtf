import { exampleShippingData } from "./shipping-validation";

type EncryptedPackage = {
    encryptedData: Uint8Array;
    iv: Uint8Array;
    ephemeralPubKey: Uint8Array;
    encryptedSymmetricKey: Uint8Array;
  };
  
  /**
   * Utility to encode text to Uint8Array
   */
  const encode = (data: string): Uint8Array => new TextEncoder().encode(data);
  
  /**
   * Utility to decode Uint8Array to string
   */
  const decode = (data: Uint8Array): string => new TextDecoder().decode(data);
  
  /**
   * Generates a random AES key
   * @returns A promise that resolves to an AES-GCM CryptoKey
   */
  export async function generateSymmetricKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }
  
  /**
   * Encrypts data using AES-GCM
   */
  export async function encryptData(
    data: string,
    aesKey: CryptoKey
  ): Promise<{ encryptedData: Uint8Array; iv: Uint8Array }> {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
    const encryptedData = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encode(data)
    );
    return { encryptedData: new Uint8Array(encryptedData), iv };
  }

  /**
 * Decrypts AES-encrypted data using AES-GCM
 * @param encryptedData - The encrypted data as a Uint8Array
 * @param aesKey - The AES key (CryptoKey) for decryption
 * @param iv - The initialization vector (IV) as a Uint8Array
 * @returns A promise that resolves to the decrypted string
 */
export async function decryptData(
    encryptedData: Uint8Array,
    aesKey: CryptoKey,
    iv: Uint8Array
  ): Promise<string> {
    const decryptedData = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encryptedData
    );
    return decode(new Uint8Array(decryptedData));
  }
  
  
  /**
   * Exports a CryptoKey to raw bytes
   */
  export async function exportKey(key: CryptoKey): Promise<Uint8Array> {
    const rawKey = await crypto.subtle.exportKey("raw", key);
    return new Uint8Array(rawKey);
  }
  
  /**
   * Encrypts the AES key using an ECC recipient's public key
   */
  export async function encryptSymmetricKey(
    aesKey: CryptoKey,
    recipientPubKey: CryptoKey
  ): Promise<{ ephemeralPubKey: Uint8Array; encryptedSymmetricKey: Uint8Array }> {
    const aesKeyBytes = await exportKey(aesKey);
  
    const ephemeralKeyPair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey", "deriveBits"]
    );
  
    const ephemeralPubKey = new Uint8Array(
      await crypto.subtle.exportKey("spki", ephemeralKeyPair.publicKey)
    );
  
    const sharedSecret = await crypto.subtle.deriveBits(
      {
        name: "ECDH",
        public: recipientPubKey,
      },
      ephemeralKeyPair.privateKey,
      256
    );
  
    const sharedKey = new Uint8Array(sharedSecret).slice(0, aesKeyBytes.length);
    const encryptedSymmetricKey = aesKeyBytes.map((byte, i) => byte ^ sharedKey[i]);
  
    return { ephemeralPubKey, encryptedSymmetricKey };
  }
  
  /**
   * Decrypts the AES key using ECC recipient's private key
   */
  export async function decryptSymmetricKey(
    encryptedKeyData: { ephemeralPubKey: Uint8Array; encryptedSymmetricKey: Uint8Array },
    recipientPrivKey: CryptoKey
  ): Promise<CryptoKey> {
    const { ephemeralPubKey, encryptedSymmetricKey } = encryptedKeyData;
  
    const importedEphemeralPubKey = await crypto.subtle.importKey(
      "spki",
      ephemeralPubKey,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      []
    );
  
    const sharedSecret = await crypto.subtle.deriveBits(
      {
        name: "ECDH",
        public: importedEphemeralPubKey,
      },
      recipientPrivKey,
      256
    );
  
    const sharedKey = new Uint8Array(sharedSecret).slice(0, encryptedSymmetricKey.length);
    const symmetricKeyBytes = encryptedSymmetricKey.map((byte, i) => byte ^ sharedKey[i]);
  
    return crypto.subtle.importKey(
      "raw",
      symmetricKeyBytes.buffer,
      { name: "AES-GCM" },
      true,
      ["decrypt"]
    );
  }
  
  /**
   * Full Example Flow
   */
  export async function example() {
    const shippingData = JSON.stringify(exampleShippingData);
  
    // Generate example ECC key pair for the shipper - this public key will probably be hardcoded into the app
    const shipperKeyPair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey", "deriveBits"]
    );
  
    // Encrypt shipping data
    const aesKey = await generateSymmetricKey();
    const { encryptedData, iv } = await encryptData(shippingData, aesKey);
    const encryptedKeyData = await encryptSymmetricKey(aesKey, shipperKeyPair.publicKey);
  
    // Simulate posting to blockchain
    const blockchain: Record<string, EncryptedPackage> = {
      shippingTransaction: { encryptedData, iv, ...encryptedKeyData },
    };
  
    console.log("Encrypted data posted to blockchain:", blockchain.shippingTransaction);
  
    // Shipper retrieves and decrypts the data
    const retrievedData = blockchain.shippingTransaction;
    const decryptedAesKey = await decryptSymmetricKey(retrievedData, shipperKeyPair.privateKey);
    const decryptedShippingInfo = await decryptData(retrievedData.encryptedData, decryptedAesKey, retrievedData.iv);
  
    console.log("Decrypted Shipping Info:", JSON.parse(decryptedShippingInfo));
  }

  // example();