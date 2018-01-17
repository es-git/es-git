import { decode } from '@es-git/core';
import { pack, RawObject, Progress } from '@es-git/packfile';

import composePushRequest, { Command } from './composePushRequest';
import post, { Fetch, Auth } from './post';
import parsePackResponse from './parsePackResponse';

export { Command, Auth };

export default async function push(url : string, fetch : Fetch, commands : Command[], objects : Map<string, Uint8Array>, auth? : Auth, progress? : Progress){
  //Delta compression isn't implemented yet
  if(progress) progress('Delta compression using up to 0 therads.\n');
  const packfile = pack(objects.entries());
  const size = (packfile.length/1024)|0;
  if(progress) progress(`Compressing objects: 100% ${size}/${size}, done.\n`);
  const body = composePushRequest(packfile, commands);
  if(progress) progress(`Writing objects: 100% ${size}/${size}, ${size}KiB, done.\n`);
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
  if(progress) progress(`Total ${size} (delta 0), reused 0 (delta 0)\n`);
}