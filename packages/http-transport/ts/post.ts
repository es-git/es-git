export type Fetch = (url : string, init? : RequestInit) => Promise<Response>;
export interface RequestInit {
  method? : string
  headers? : {
    [key : string] : string
  },
  body? : ArrayBuffer
}
export interface Response {
  readonly status : number
  readonly statusText : string
  readonly body : NodeJS.ReadableStream | ReadableStream
}
export type Auth = {username : string, password : string};

export default async function* post(url : string, service : string, body : Uint8Array, fetch : Fetch, auth? : Auth) : AsyncIterableIterator<Uint8Array> {
  const res = await fetch(`${url}/${service}`, {
    method: 'POST',
    headers: {
      'Content-Type': `application/x-${service}-request`,
      'Accept': `application/x-${service}-result`,
      ...authorization(auth)
    },
    body: body.buffer as ArrayBuffer
  });
  if(res.status !== 200) throw new Error(`POST ${url}/${service} failed ${res.status} ${res.statusText}`);
  const readable = res.body;
  const reader = isBrowser(readable) ? readable.getReader() : toReader(readable);
  while(true){
    const {value, done} = await reader.read() as {value : Uint8Array, done : boolean};
    if(done) return;
    yield value;
  }
}

function isBrowser(body : ReadableStream | NodeJS.ReadableStream) : body is ReadableStream {
  return 'getReader' in body;
}

function authorization(auth? : Auth) : {} {
  if(auth){
    return {
      'Authorization': `Basic ${btoa(`${auth.username}:${auth.password}`)}`
    }
  } else {
    return {};
  }
}

function toReader(stream : NodeJS.ReadableStream){
  let readable = defer<boolean>();
  const onEnd = new Promise<boolean>(res => stream.on('end', () => res(true)));
  stream.on('readable', () => readable.resolve(false));
  return {
    async read() : Promise<{done: false, value: Uint8Array} | {done: true}> {
      console.log('read');
      let value = stream.read() as Buffer | null;
      console.log(value);
      if(value === null){
        readable = defer<boolean>();
        const done = await Promise.race([
          onEnd,
          readable.promise
        ]);
        console.log('done?', done);
        if(done){
          return {done};
        }
        value = stream.read() as Buffer;
        console.log(value);
      }

      return {
        done: false,
        value: new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength))
      };
    }
  }
}

function defer<T>(){
  let resolve = (v? : T) => {};
  let reject = () => {};
  return {
    promise: new Promise<T>((res, rej) => {resolve = res; reject = rej}),
    resolve,
    reject
  }
}