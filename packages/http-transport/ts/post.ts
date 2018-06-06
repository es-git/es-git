import streamToAsyncIterator from './utils/streamToAsyncIterator';
import asyncIteratorToBuffer from './utils/asyncIteratorToBuffer';

export type Fetch = (url : string, init? : RequestInit) => Promise<Response>;
export interface RequestInit {
  method? : string
  headers? : {
    [key : string] : string
  },
  body? : ArrayBuffer
}

export interface StreamResponse {
  readonly body : NodeJS.ReadableStream | ReadableStream
}

export interface BufferResponse {
  arrayBuffer() : Promise<ArrayBuffer>
}

export type Response = {
  readonly status : number
  readonly statusText : string
} & (StreamResponse | BufferResponse);

export type Auth = {username : string, password : string};

export default async function* post(url : string, service : string, body : AsyncIterableIterator<Uint8Array>, fetch : Fetch, auth? : Auth) : AsyncIterableIterator<Uint8Array> {
  const res = await fetch(`${url}/${service}`, {
    method: 'POST',
    headers: {
      'Content-Type': `application/x-${service}-request`,
      'Accept': `application/x-${service}-result`,
      ...authorization(auth)
    },
    body: await asyncIteratorToBuffer(body)
  });
  if(res.status !== 200) throw new Error(`POST ${url}/${service} failed ${res.status} ${res.statusText}`);
  yield* isModern(res) ? streamToAsyncIterator(res.body) : streamify(res.arrayBuffer());
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

function isModern(res : StreamResponse | BufferResponse) : res is StreamResponse {
  return 'body' in res;
}

async function* streamify(arrayBuffer : Promise<ArrayBuffer>){
  yield new Uint8Array(await arrayBuffer);
}