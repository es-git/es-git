// https://github.com/git/git/blob/master/Documentation/technical/protocol-common.txt
import { NEWLINE, toHexChar } from '@es-git/core';

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

export function pktLines(lines : (string|null)[]){
  let buffer = '';
  for(const line of lines){
    if(line === null){
      buffer += '0000';
    }else{
      const length = 4 + line.length + 1;
      buffer += length.toString(16).padStart(4, '0');
      buffer += line;
      buffer += '\n';
    }
  }
  return buffer;
}
