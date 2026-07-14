import { bytesToHex, type Hex } from "viem";
import { getShipperPublicKey } from "./shipper-keys";

const MAX_ENCRYPTED_PAYLOAD_BYTES = 4096;

const encode = (data: string): Uint8Array => new TextEncoder().encode(data);

async function generateSymmetricKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

async function encryptData(
  data: string,
  aesKey: CryptoKey
): Promise<{ encryptedData: Uint8Array; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encode(data)
  );
  return { encryptedData: new Uint8Array(encryptedData), iv };
}

async function exportKey(key: CryptoKey): Promise<Uint8Array> {
  const rawKey = await crypto.subtle.exportKey("raw", key);
  return new Uint8Array(rawKey);
}

async function encryptSymmetricKey(
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
  const encryptedSymmetricKey = aesKeyBytes.map(
    (byte, index) => byte ^ sharedKey[index]
  );

  return { ephemeralPubKey, encryptedSymmetricKey };
}

export async function encryptShippingPayload(payload: string): Promise<Hex> {
  const shipperPublicKey = await getShipperPublicKey();
  const aesKey = await generateSymmetricKey();
  const { encryptedData, iv } = await encryptData(payload, aesKey);
  const encryptedKeyData = await encryptSymmetricKey(aesKey, shipperPublicKey);
  const encryptedPackage = new Uint8Array([
    ...iv,
    ...encryptedData,
    ...encryptedKeyData.ephemeralPubKey,
    ...encryptedKeyData.encryptedSymmetricKey,
  ]);

  if (encryptedPackage.byteLength > MAX_ENCRYPTED_PAYLOAD_BYTES) {
    throw new Error("Encrypted shipping payload exceeds the contract limit.");
  }

  return bytesToHex(encryptedPackage);
}
