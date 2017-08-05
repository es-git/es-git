export default function unpktLine(line : string){
  const size = fromHex(line);
  const length = size - 4 - (line[size - 1] === '\n' ? 1 : 0);
  return line.substr(4, length);
}

export function fromHex(line : string){
  let size = 0;
  for(let i=0; i<4; i++){
    size = (size<<4) | parseInt(line[i], 16);
  }
  return size;
}