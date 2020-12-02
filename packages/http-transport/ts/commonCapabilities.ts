// https://github.com/git/git/blob/master/Documentation/technical/protocol-capabilities.txt

import { ClientCaps, EditableClientCaps, ServerCaps } from './types';

export default function commonCapabilities(server : ServerCaps) : ClientCaps {
  const client : Partial<EditableClientCaps> = {};

  //set('multi_ack_detailed') || set('multi_ack');

  //set('no-done');

  //set('thin-pack');

  set('side-band-64k') || set('side-band');

  set('ofs-delta');

  //const dSince = set('deepen-since');
  //const dNot = set('deepen-not');
  //if(!dSince && ! dNot){
  //  set('shallow') || set('deepen-relative');
  //}

  //set('no-progress');

  set('include-tag');

  set('report-status');

  //set('delete-refs');

  set('quiet');

  set('atomic');

  //set('push-options');

  //set('allow-tip-sha1-in-want');

  //set('allow-reachable-sha1-in-want');

  //set('push-cert', 'nonce');

  set('agent', 'es-git');

  return client as ClientCaps;

  function set<Key extends keyof ClientCaps>(feature : Key, value : ClientCaps[Key] = (true as (ClientCaps[Key] extends boolean ? ClientCaps[Key] : never))){
    if(server.has(feature)){
      client[feature] = value;
      return true;
    }else{
      return false;
    }
  }
}