// Minimal SHA-1 implementation for demo bundling (non-constant-time; demo only)
function sha1Hex(message) {
  function rotl(n, s) { return (n << s) | (n >>> (32 - s)); }
  function toHex(n) { return ('00000000' + (n >>> 0).toString(16)).slice(-8); }
  const msg = new TextEncoder().encode(String(message));
  const ml = msg.length * 8;
  const withOne = new Uint8Array(((msg.length + 9 + 63) >> 6) << 6);
  withOne.set(msg);
  withOne[msg.length] = 0x80;
  const dv = new DataView(withOne.buffer);
  dv.setUint32(withOne.length - 4, ml >>> 0);

  let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;
  const w = new Uint32Array(80);
  for (let i = 0; i < withOne.length; i += 64) {
    for (let j = 0; j < 16; j++) w[j] = dv.getUint32(i + j * 4);
    for (let j = 16; j < 80; j++) w[j] = rotl(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let j = 0; j < 80; j++) {
      const f = j < 20 ? ((b & c) | (~b & d))
        : j < 40 ? (b ^ c ^ d)
        : j < 60 ? ((b & c) | (b & d) | (c & d))
        : (b ^ c ^ d);
      const k = j < 20 ? 0x5A827999 : j < 40 ? 0x6ED9EBA1 : j < 60 ? 0x8F1BBCDC : 0xCA62C1D6;
      const temp = (rotl(a, 5) + f + e + k + w[j]) >>> 0;
      e = d; d = c; c = rotl(b, 30) >>> 0; b = a; a = temp;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
  }
  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4);
}

exports.createHash = function createHash(algo) {
  if (algo !== 'sha1') throw new Error('Only sha1 supported in demo shim');
  let acc = '';
  return {
    update(chunk) { acc += (typeof chunk === 'string') ? chunk : new TextDecoder().decode(chunk); return this; },
    digest(enc) { const hex = sha1Hex(acc); return enc === 'hex' ? hex : Buffer.from(hex, 'hex'); }
  };
};
