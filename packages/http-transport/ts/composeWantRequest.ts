import { pktLines } from './pkt-line';
import { Hash, UploadRequest } from './types';

export default function composeWantRequest(request : UploadRequest, capabilities : Map<string, string | boolean>) : string {
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

function composeCaps(caps : Map<string, string | boolean>){
  return Array.from(caps).filter(c => c[1]).map(c => c[1] === true ? `${c[0]}=${c[1]}` : c[0]).join(' ');
}