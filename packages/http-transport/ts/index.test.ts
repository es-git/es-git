import test from 'ava';
import fetch from 'node-fetch';

import {
  decode
} from '@es-git/core';

import {
  UploadRequest,
  ClientCaps
} from './types';
import parseRemoteRefs from "./parseRefsResponse";
import negotiatePack from "./negotiatePack";
import composeWantRequest from "./composeWantRequest";
import parseWantResponse from './parseWantResponse';
import capabilities from "./capabilities";

import { unpack } from '@es-git/packfile';

test('fetch refs', async t => {
  //const url = 'https://github.com/es-git/test-pull.git';
  const url = 'https://github.com/creationix/js-git.git';
  const serverCaps = new Map<string, string | boolean>();
  const remoteRefs = [...(await lsRemote(url, serverCaps))].map(x => x.hash);
  console.log(remoteRefs.join('\n'));
  const localRefs : string[] = [
    '74da7a62ca44ae320394624168bd752c2faacd6e',
    //'02476c1450dd3772d2910080c0d454df898c67a2',
    //'931935b3d196d0334bc144b2c79b0a9f2d978049'
  ];
  //const localRefs : string[] = ['931935b3d196d0334bc144b2c79b0a9f2d978049'];
  const wantedRefs : string[] = ['082a1e604e568f2a853bfbb4725ef71c0dc9425a'];
  const negotiate = negotiatePack(remoteRefs, localRefs, remoteRefs)
  await bleh(url, negotiate, capabilities(serverCaps));
  t.pass();
});

async function bleh(url : string, negotiate : Iterator<UploadRequest>, capabilities : ClientCaps){
  let acks : string[] = [];
  while(true){
    const request = negotiate.next(acks);
    const body = composeWantRequest(request.value, capabilities);
    const response = await downloadPackfile(url, body);
    let parsedResponse = parseWantResponse(response);
    if(parsedResponse.type === 'pack'){

      for(const entry of unpack(parsedResponse.pack)){
        console.log(entry.type, entry.hash);
      }
      return
    }else{
      acks = parsedResponse.acks;
    }
  }
}

async function lsRemote(url : string, capabilites : Map<string, string | boolean>){
  const service = 'git-upload-pack';
  const res = await fetch(`${url}/info/refs?service=${service}`);
  console.log('===lsRemote===');
  console.log(res.status, res.statusText);
  const refs = await res.text();
  return parseRemoteRefs(refs, service, capabilites);
}

async function downloadPackfile(url : string, body : string){
  const service = 'git-upload-pack';
  console.log('===[gitUploadPack]===');
  const res = await fetch(`${url}/${service}`, {
    method: 'POST',
    headers: {
      'Content-Type': `application/x-${service}-request`,
      'Accept': `application/x-${service}-response`
    },
    body
  });
  console.log(body);
  console.log(res.status, res.statusText);
  //const data = await res.text();
  //console.log(data);
  //return data;
  const data = await res.buffer();
  //console.log(decoder.decode(data));
  return (data) as Uint8Array;
}