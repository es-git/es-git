import {Inflate} from 'pako';
import {Binary} from 'bodec';

// Byte oriented inflate stream.  Wrapper for pako's Inflate.
//
//   const inf = inflate();
//   inf.write(byte) -> more - Write a byte to inflate's state-machine.
//                             Returns true if more data is expected.
//   inf.recycle()           - Reset the internal state machine.
//   inf.flush() -> data     - Flush the output as a binary buffer.
//
export default function inflateStream() {
  let inf = new Inflate();
  const b = new Uint8Array(1);
  const empty = new Binary(0);

  return {
    write: write,
    recycle: recycle,
    flush: Binary === Uint8Array ? flush : flushConvert
  };

  function write(byte : number) {
    b[0] = byte;
    inf.push(b);
    return !(inf as any).ended;
  }

  function recycle() { inf = new Inflate(); }

  function flush() { return inf.result as Uint8Array || empty; }

  function flushConvert() {
    return inf.result ? new Binary((inf as any).result) : empty;
  }
};
