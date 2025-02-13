// Convert PEM format to base64 string (remove header, footer, and newlines)
const SHIPPER_PUBLIC_KEY_B64 =
  "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE12btjAag15lPnn82xPWPD81F6jZNU+2q10suaH8NW4NypIDVd5QeCAA9bKQBuroL6VZQVr+WZ5P4hWtNP6BCZg==";

export async function getShipperPublicKey(): Promise<CryptoKey> {
  // Decode base64 to bytes
  const binaryString = atob(SHIPPER_PUBLIC_KEY_B64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Import as SPKI format
  return crypto.subtle.importKey(
    "spki",
    bytes,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    []
  );
}
