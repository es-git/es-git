import { pack, Progress, HashBlob } from '@es-git/packfile';

import composePushRequest, { Command } from './composePushRequest';
import post, { Fetch, Auth } from './post';
import parsePackResponse from './parsePackResponse';

export { Command, Auth };

export interface Objects {
  readonly count : number
  readonly stream : AsyncIterableIterator<HashBlob>
}

export default async function push(url : string, fetch : Fetch, commands : Command[], objects : Objects, auth? : Auth, progress? : Progress){
  const packfile = pack(objects.stream, objects.count);
  const body = composePushRequest(packfile, commands);
  const response = post(url, 'git-receive-pack', body, fetch, auth);
  for await(const parsed of parsePackResponse(response)){
    switch(parsed.type){
      case 'progress':
        if(progress) progress(parsed.message);
        break;
      case 'error':
        if(progress) progress(parsed.message);
        break;
    }
  }
}