import pako from 'pako';
import {Binary} from 'bodec';

export default Binary === Uint8Array
  ? pako.inflate
  : function inflate(value) {
    return new Binary(pako.inflate(new Uint8Array(value)));
  };
