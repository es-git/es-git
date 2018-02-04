export interface Node {
  readonly row : number;
  readonly col : number;
  readonly hash : string;
}

export default function* walk(template : TemplateStringsArray){
  const rows = toRows(template);
  const queue = [...findStarts(rows)];
  for(const item of queue){
    if((yield item.hash) !== false){
      queue.push(...[...followPath(rows, item.row, item.col, '-')].map(hexify));
    }
  }
}

export function toRows(template : TemplateStringsArray){
  return String.raw(template).replace('\\', '\\').split('\n');
}

export function parse(template : TemplateStringsArray){
  const rows = toRows(template);
  return async function* walk<T>(start='()'){
    const queue = [...findStarts(rows, start)];
    for(const {hash, row, col} of queue){
      const parents = [...followPath(rows, row, col, '-')].map(hexify);
      const commit = {
        hash,
        commit: {
          parents: parents.map(p => p.hash)
        }
      };
      if((yield commit) !== false){
        queue.push(...parents);
      }
    };
  }
}

export function* followPath(rows : string[], row : number, col : number, char = rows[row][col]) : IterableIterator<Node> {
  const [done, node] = nextToken(rows, row, col, char);
  if(done){
    if(node) yield node;
    return;
  }else if(isUp(char)){
    if(row > 0) yield* followUp(rows, row-1, col-1);
  }else if(isLeft(char)){
    if(row > 0) yield* followUp(rows, row-1, col-1);
    yield* followPath(rows, row, col-1);
    if(row+1 < rows.length) yield* followDown(rows, row+1, col-1);
  }else if(isDown(char)){
    if(row+1 < rows.length) yield* followDown(rows, row+1, col-1);
  }
}

export function* followUp(rows : string[], row : number, col : number) : IterableIterator<Node> {
  const char = rows[row][col];
  const [done, node] = nextToken(rows, row, col, char);
  if(done){
    if(node) yield node;
    return;
  }else if(isUp(char)){
    if(row > 0) yield* followUp(rows, row-1, col-1);
  }else if(isLeft(char)){
    if(row > 0) yield* followUp(rows, row-1, col-1);
    yield* followPath(rows, row, col-1);
    if(row+1 < rows.length) yield* followDown(rows, row+1, col-1);
  }
}

export function* followDown(rows : string[], row : number, col : number) : IterableIterator<Node> {
  const char = rows[row][col];
  const [done, node] = nextToken(rows, row, col, char);
  if(done){
    if(node) yield node;
    return;
  }else if(isLeft(char)){
    if(row > 0) yield* followUp(rows, row-1, col-1);
    yield* followPath(rows, row, col-1);
    if(row+1 < rows.length) yield* followDown(rows, row+1, col-1);
  }else if(isDown(char)){
    if(row+1 < rows.length) yield* followDown(rows, row+1, col-1);
  }
}

function nextToken(rows : string[], row : number, col : number, char : string) : [boolean, Node | undefined] {
  if(char === undefined){
    return [true, undefined];
  }else if(char === 'o'){
    return [true, {row, col, hash:char}];
  }else if(isHex(char)){
    const hash = parseHex(rows[row], col);
    return [true, {row, col: col-hash.length+1, hash}];
  }else if(col === 0) {
    return [true, undefined];
  }else{
    return [false, undefined];
  }
}

function isUp(char : string){
  return char === '\\';
}

function isLeft(char : string){
  return char === '-'
      || char === '['
      || char === ']'
      || char === '('
      || char === ')'
      || char === '{'
      || char === '}';
}

function isDown(char : string){
  return char === '/';
}

export function isHex(char : string){
  if(char >= 'a' && char <= 'f') return true;
  if(char >= 'A' && char <= 'F') return true;
  if(char >= '0' && char <= '9') return true;
  return false;
}

export function parseHex(row : string, col : number){
  const result = [];
  do{
    result.unshift(row[col]);
    col--;
  }while(col >= 0 && isHex(row[col]));
  return result.join('');
}

export function hexify(node : Node){
  if(node.hash === 'o'){
    return {
      ...node,
      hash: `${node.row}a${node.col}`
    };
  }else {
    return node;
  }
}

function isValidMatch(match : string){
  const prefix = match[0];
  const suffix = match[match.length-1];
  if(!(prefix === '(' && suffix === ')')
  && !(prefix === '[' && suffix === ']')
  && !(prefix === '{' && suffix === '}')){
    throw new Error('invalid start, must be [*], (*) or {*}');
  }

  if(match[1] === '*' && match.length === 3){
    return true;
  }

  for(let i=1; i<match.length-1; i++){
    if(!isHex(match[i])){
      throw new Error('start must contain a hex');
    }
  }
}

export function* findStarts(rows : string[], match='(*)'){
  isValidMatch(match);
  const prefix = match[0];
  const suffix = match[match.length-1];
  for(const row of rows){
    let pos = row.indexOf(suffix);
    while(pos > -1){
      const hash = parseHex(row, pos-1);
      if(`${prefix}*${suffix}` === match || `${prefix}${hash}${suffix}` === match){
        yield {
          row: rows.indexOf(row),
          col: pos-hash.length,
          hash
        };
      }
      pos = row.indexOf(suffix, pos+1);
    }
  }
}