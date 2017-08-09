import unpktLine, { unpktLines } from './unpkt-line';
import { Ref } from './types';

export default function *parseRefsResponse(response : string, service : string, capabilities? : Map<string, string | boolean>) : IterableIterator<Ref> {
  const [line, tail] = unpktLine(response);
  if(line !== `# service=${service}`) throw new Error('unknown response');
  for(const line of unpktLines(tail)){
    if(line.indexOf('\0') > 0){
      const [idObj, caps] = line.split('\0');
      parseCaps(caps, capabilities);
      yield parseIdObj(idObj);
    }else{
      yield parseIdObj(line);
    }
  }
}

export function parseCaps(caps : string, capabilities? : Map<string, string | boolean>) {
  if(!capabilities) return;

  for(const cap of caps.split(' ')){
    if(cap.indexOf('=') > 0){
      const [key, ...value] = cap.split('=');
      capabilities.set(key, value.join('='));
    }else{
      capabilities.set(cap, true);
    }
  }
}

export function parseIdObj(idObj : string) : Ref {
  const match = idObj.match(/(^[0-9a-f]{40}) (.*)$/);
  if(!match) throw new Error(`Could not parse ${idObj}`);
  return {
    hash: match[1],
    name: match[2]
  };
}