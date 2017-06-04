import pako from 'pako';
import {Binary} from 'bodec';

export default Binary === Uint8Array
  ? pako.deflate
  : function deflate(value) {
    return new Binary(pako.deflate(new Uint8Array(value)));
  };
