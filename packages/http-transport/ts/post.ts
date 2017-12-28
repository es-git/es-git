import { concat } from '@es-git/core';
import streamToAsyncIterator from './utils/streamToAsyncIterator';

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

export default async function* post(url : string, service : string, body : IterableIterator<Uint8Array>, fetch : Fetch, auth? : Auth) : AsyncIterableIterator<Uint8Array> {
  const res = await fetch(`${url}/${service}`, {
    method: 'POST',
    headers: {
      'Content-Type': `application/x-${service}-request`,
      'Accept': `application/x-${service}-result`,
      ...authorization(auth)
    },
    body: concat(...body).buffer as ArrayBuffer
  });
  if(res.status !== 200) throw new Error(`POST ${url}/${service} failed ${res.status} ${res.statusText}`);
  for await(const chunk of streamToAsyncIterator(res.body)){
    yield chunk;
  }
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