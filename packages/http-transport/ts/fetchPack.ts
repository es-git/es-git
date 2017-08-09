
export type Fetch = (url : string, init? : RequestInit) => Promise<Response>;
export interface RequestInit {
  method? : string
  headers? : {
    [key : string] : string
  },
  body? : string
}
export interface Response {
  readonly status : number
  readonly statusText : string
  buffer() : Promise<Uint8Array>
}

export default async function fetchPack(url : string, body : string, fetch : Fetch){
  const service = 'git-upload-pack';
  const res = await fetch(`${url}/${service}`, {
    method: 'POST',
    headers: {
      'Content-Type': `application/x-${service}-request`,
      'Accept': `application/x-${service}-response`
    },
    body
  });
  if(res.status !== 200) throw new Error(`fetch failed ${res.status} ${res.statusText}`);
  return await res.buffer();
}