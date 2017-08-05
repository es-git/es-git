import { pktLines } from './pkt-line';
import { Hash, UploadRequest } from './types';

export default function composeWantRequest(request : UploadRequest, capabilities : {[k : string] : string | boolean}) : string {
  const lines = [
    ...request.wants.map((hash, index) => want(hash, index === 0 ? composeCaps(capabilities) : undefined)),
    ...(request.done ? [null] : []),
    ...request.haves.map(hash => have(hash)),
    'done'
  ];

  return pktLines(lines);
}

function want(hash : string, caps? : string){
  if(caps){
    return `want ${hash} ${caps}`;
  }else{
    return `want ${hash}`;
  }
}

function have(hash : string){
  return `have ${hash}`;
}

function composeCaps(caps : {[k : string] : string | boolean}){
  return Object.keys(caps).filter(k => caps[k]).map(k => caps[k] === true ? k : `${k}=${caps[k]}`).join(' ');
}