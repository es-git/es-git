// https://github.com/git/git/blob/master/Documentation/technical/protocol-common.txt

export function *unpktLines(content : string) {
  while(true){
    const [line, tail] = unpktLine(content);
    if(line.length) yield line;
    if(tail.length){
      content = tail;
    }else{
      return;
    }
  }
}

export default function unpktLine(line : string){
  const size = fromHex(line);
  if(size === 0){
    return ['', line.substr(4)];
  }
  const length = size - 4 - (line[size - 1] === '\n' ? 1 : 0);
  return [line.substr(4, length), line.substr(size)];
}

export function fromHex(line : string){
  let size = 0;
  for(let i=0; i<4; i++){
    size = (size<<4) | parseInt(line[i], 16);
  }
  return size;
}