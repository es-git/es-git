import { decode } from '@es-git/core';
import { pack, RawObject } from '@es-git/packfile';

import composePushRequest, { Command } from './composePushRequest';
import post, { Fetch, Auth } from './post';

export { Command, Auth };

export default async function* push(url : string, fetch : Fetch, commands : Command[], objects : Map<string, Uint8Array>, auth? : Auth){
  const packfile = pack(objects.entries());
  const body = composePushRequest(packfile, commands);
  for await(const result of post(url, 'git-receive-pack', body, fetch, auth)){
    yield decode(result);
  }
}