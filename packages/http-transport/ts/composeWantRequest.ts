import pktLine from './pkt-line';
import { UploadRequest, ClientCaps } from './types';

export default function *composeWantRequest(request : UploadRequest, capabilities : ClientCaps) {
  const[hash, ...wants] = request.wants;
  yield pktLine(`want ${hash} ${composeCaps(capabilities)}`);

  for(const hash of wants){
    yield pktLine(`want ${hash}`);
  }

  for(const shallow of request.shallows){
    yield pktLine(`shallow ${shallow}`);
  }

  if(request.depth){
    yield pktLine(`deepen ${request.depth}`, false);
  }

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