import pktLine from './pkt-line';
import { UploadRequest, ClientCaps } from './types';

export default function *composeWantRequest(request : UploadRequest, capabilities : ClientCaps) {
  const[hash, ...wants] = request.wants;
  yield pktLine(`want ${hash} ${composeCaps(capabilities)}`);

  for(const hash of request.wants){
    yield pktLine(`want ${hash}`);
  }

  //yield shallows
  //yield deepens

  yield pktLine(null);

  for(const hash of request.haves){
    yield pktLine(`have ${hash}`);
  }

  if(request.done){
    yield pktLine('done');
  }
}

function composeCaps(caps : {[k : string] : string | boolean}){
  return Object.keys(caps).filter(k => caps[k]).map(k => caps[k] === true ? k : `${k}=${caps[k]}`).join(' ');
}