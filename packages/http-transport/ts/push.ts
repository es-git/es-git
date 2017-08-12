import { concat, decode } from '@es-git/core';
import { pack, RawObject } from '@es-git/packfile';

import composePushRequest, { Command } from './composePushRequest';
import post, { Fetch, Auth } from './post';

export { Command };

export default async function push(url : string, fetch : Fetch, commands : Command[], objects : Map<string, Uint8Array>, auth? : Auth){
  const packfile = pack(objects.entries());
  const body = concat(...composePushRequest(packfile, commands));
  const result = await post(url, 'git-receive-pack', body, fetch, auth);
  return decode(result);
}