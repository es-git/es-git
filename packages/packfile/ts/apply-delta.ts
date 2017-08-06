import { Buffer } from '@es-git/core';

export default function applyDelta(delta : Uint8Array, base : Uint8Array) {
  const input = new Buffer(delta);

  if (base.length !== readLength(input)) {
    throw new Error("Base length mismatch");
  }

  // Create a new output buffer with length from header.
  const output = new Buffer(new Uint8Array(readLength(input)));

  while (!input.isDone) {
    const byte = input.next();
    // Copy command.  Tells us offset in base and length to copy.
    if (byte & 0x80) {
      let offset = 0;
      let length = 0;
      if (byte & 0x01) offset |= input.next() << 0;
      if (byte & 0x02) offset |= input.next() << 8;
      if (byte & 0x04) offset |= input.next() << 16;
      if (byte & 0x08) offset |= input.next() << 24;
      if (byte & 0x10) length |= input.next() << 0;
      if (byte & 0x20) length |= input.next() << 8;
      if (byte & 0x40) length |= input.next() << 16;
      if (length === 0) length = 0x10000;
      // copy the data
      output.write(base, offset, offset + length);
    }
    // Insert command, opcode byte is length itself
    else if (byte) {
      output.write(input.next(byte));
    }
    else throw new Error('Invalid delta opcode');
  }

  if (output.pos !== output.data.length) {
    throw new Error("Size mismatch in check");
  }

  return output.data;
}

function readLength(buffer : Buffer) {
  let byte = buffer.next();
  let length = byte & 0x7f;
  let shift = 7;
  while (byte & 0x80) {
    byte = buffer.next();
    length |= (byte & 0x7f) << shift;
    shift += 7;
  }
  return length;
}
