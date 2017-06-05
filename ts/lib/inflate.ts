import * as pako from 'pako';
import {Binary} from 'bodec';

export default Binary === Uint8Array
  ? pako.inflate
  : function inflate(value : Uint8Array) {
    return new Binary(pako.inflate(new Uint8Array(value)));
  };
