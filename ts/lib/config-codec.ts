"use strict";

import { StringMap } from '../types';

// This is for working with git config files like .git/config and .gitmodules.
// I believe this is just INI format.

export interface Config {
  [key : string] : StringMap | ObjectMap
}

export interface ObjectMap {
  [key : string] : StringMap
}

export function encode(config : Config) {
  const lines : string[] = [];
  Object.keys(config).forEach(name => {
    const obj = config[name];
    const deep : ObjectMap = {};
    const values : StringMap = {};
    let hasValues = false;
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (typeof value === 'object') {
        deep[key] = value;
      }
      else {
        hasValues = true;
        values[key] = value;
      }
    });
    if (hasValues) {
      encodeBody('[' + name + ']', values);
    }

    Object.keys(deep).forEach(sub => {
      const child = deep[sub];
      encodeBody('[' + name + ' "' + sub + '"]', child);
    });
  });

  return lines.join("\n") + "\n";

  function encodeBody(header : string, obj : StringMap) {
    lines.push(header);
    Object.keys(obj).forEach(name => {
      lines.push( "\t" + name + " = " + obj[name]);
    });
  }

}


export function decode(text : string) {
  const config : Config = {};
  let section : ObjectMap | StringMap;
  text.split(/[\r\n]+/).forEach(line => {
    let match = line.match(/\[([^ \t"\]]+) *(?:"([^"]+)")?\]/);
    if (match) {
      section = config[match[1]] || (config[match[1]] = {});
      if (match[2]) {
        section = section[match[2]] = {};
      }
      return;
    }
    match = line.match(/([^ \t=]+)[ \t]*=[ \t]*(.+)/);
    if (match) {
      section[match[1]] = match[2];
    }
  });
  return config;
}
