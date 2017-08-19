// https://github.com/git/git/blob/master/Documentation/technical/protocol-common.txt
import { NEWLINE, toHexChar, encode } from '@es-git/core';

export default function pktLine(line : Uint8Array | string | null, newline=true){
  if(line === null){
    return new Uint8Array([0x30, 0x30, 0x30, 0x30]);
  }

  const buffer = new Uint8Array(4 + line.length + (newline ? 1 : 0));
  buffer[0] = toHexChar(buffer.length >>> 12);
  buffer[1] = toHexChar((buffer.length >>> 8) & 0xf);
  buffer[2] = toHexChar((buffer.length >>> 4) & 0xf);
  buffer[3] = toHexChar(buffer.length & 0xf);

  if(typeof(line) === 'string'){
    buffer.set(encode(line), 4);
  }else{
    buffer.set(line, 4);
  }

  if(newline){
    buffer[4 + line.length] = NEWLINE;
  }

  return buffer;
}