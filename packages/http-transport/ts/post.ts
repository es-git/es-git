
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
  arrayBuffer() : Promise<ArrayBuffer>
}
export type Auth = {username : string, password : string};

export default async function post(url : string, service : string, body : Uint8Array, fetch : Fetch, auth? : Auth) : Promise<Uint8Array> {
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
  return new Uint8Array(await res.arrayBuffer());
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
