export const NEWLINE = '\n'.charCodeAt(0);

export default function pktLine(line : Uint8Array){
  const buffer = new Uint8Array(4 + line.length + 1);
  buffer[0] = toHexChar(buffer.length >>> 12);
  buffer[1] = toHexChar((buffer.length >>> 8) & 0xf);
  buffer[2] = toHexChar((buffer.length >>> 4) & 0xf);
  buffer[3] = toHexChar(buffer.length & 0xf);
  buffer.set(line, 4);
  buffer[4 + line.length] = NEWLINE;
  return buffer;
}

export function toHexChar(val : number) {
  return val < 0x0a ? val + 0x30 : val + 0x57;
}