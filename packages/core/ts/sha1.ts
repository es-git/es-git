const shared = new Uint32Array(80);

export interface Sha1 {
  update(chunk : string) : string
  update(chunk : number[]) : number[]
  update(chunk : Uint8Array) : Uint8Array
  digest() : string
}

// Input chunks must be either arrays of bytes or "raw" encoded strings
export default function sha1() : Sha1
export default function sha1(buffer : string | number[] | Uint8Array) : string
export default function sha1(buffer? : string | number[] | Uint8Array) {
  if (buffer === undefined) return create(new Uint32Array(80));
  const shasum = create(shared);
  shasum.update(buffer as any);
  return shasum.digest();
};

// A pure JS implementation of sha1 for non-node environments.
function create(block : Uint32Array) : Sha1 {
  let h0 = 0x67452301;
  let h1 = 0xEFCDAB89;
  let h2 = 0x98BADCFE;
  let h3 = 0x10325476;
  let h4 = 0xC3D2E1F0;
  // The first 64 bytes (16 words) is the data chunk
  let offset = 0;
  let shift = 24;
  let totalLength = 0;

  return { update: update, digest: digest };

  // The user gave us more data.  Store it!
  function update(chunk : string) : string
  function update(chunk : number[]) : number[]
  function update(chunk : Uint8Array) : Uint8Array
  function update(chunk : string | number[] | Uint8Array) : any {
    if (typeof chunk === "string") return updateString(chunk);
    const length = chunk.length;
    totalLength += length * 8;
    for (let i = 0; i < length; i++) {
      write(chunk[i]);
    }
    return chunk;
  }

  function updateString(string : string) {
    const length = string.length;
    totalLength += length * 8;
    for (let i = 0; i < length; i++) {
      write(string.charCodeAt(i));
    }
  }


  function write(byte : number) {
    block[offset] |= (byte & 0xff) << shift;
    if (shift) {
      shift -= 8;
    }
    else {
      offset++;
      shift = 24;
    }
    if (offset === 16) processBlock();
  }

  // No more data will come, pad the block, process and return the result.
  function digest() {
    // Pad
    write(0x80);
    if (offset > 14 || (offset === 14 && shift < 24)) {
      processBlock();
    }
    offset = 14;
    shift = 24;

    // 64-bit length big-endian
    write(0x00); // numbers this big aren't accurate in javascript anyway
    write(0x00); // ..So just hard-code to zero.
    write(totalLength > 0xffffffffff ? totalLength / 0x10000000000 : 0x00);
    write(totalLength > 0xffffffff ? totalLength / 0x100000000 : 0x00);
    for (let s = 24; s >= 0; s -= 8) {
      write(totalLength >> s);
    }

    // At this point one last processBlock() should trigger and we can pull out the result.
    return toHex(h0) +
           toHex(h1) +
           toHex(h2) +
           toHex(h3) +
           toHex(h4);
  }

  // We have a full block to process.  Let's do it!
  function processBlock() {
    // Extend the sixteen 32-bit words into eighty 32-bit words:
    for (let i = 16; i < 80; i++) {
      const w = block[i - 3] ^ block[i - 8] ^ block[i - 14] ^ block[i - 16];
      block[i] = (w << 1) | (w >>> 31);
    }

    // log(block);

    // Initialize hash value for this chunk:
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f, k;

    // Main loop:
    for (let i = 0; i < 80; i++) {
      if (i < 20) {
        f = d ^ (b & (c ^ d));
        k = 0x5A827999;
      }
      else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ED9EBA1;
      }
      else if (i < 60) {
        f = (b & c) | (d & (b | c));
        k = 0x8F1BBCDC;
      }
      else {
        f = b ^ c ^ d;
        k = 0xCA62C1D6;
      }
      const temp = (a << 5 | a >>> 27) + f + e + k + (block[i]|0);
      e = d;
      d = c;
      c = (b << 30 | b >>> 2);
      b = a;
      a = temp;
    }

    // Add this chunk's hash to result so far:
    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;

    // The block is now reusable.
    offset = 0;
    for (let i = 0; i < 16; i++) {
      block[i] = 0;
    }
  }

  function toHex(word : number) {
    let hex = "";
    for (let i = 28; i >= 0; i -= 4) {
      hex += ((word >> i) & 0xf).toString(16);
    }
    return hex;
  }

}