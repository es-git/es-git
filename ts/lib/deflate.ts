import * as pako from 'pako';
import {Binary} from 'bodec';

export default Binary === Uint8Array
  ? pako.deflate
  : function deflate(value : Uint8Array) {
    return new Binary(pako.deflate(new Uint8Array(value)));
  };
