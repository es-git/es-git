"use strict";

import sha1 from 'git-sha1';
import applyDelta from '../lib/apply-delta.js';
import * as codec from '../lib/object-codec.js';
import {decodePack} from '../lib/pack-codec.js';
import {encodePack} from '../lib/pack-codec.js';
import makeChannel from 'culvert';

export default function (repo) {
  // packChannel is a writable culvert channel {put,drain} containing raw packfile binary data
  // opts can contain "onProgress" or "onError" hook functions.
  // callback will be called with a list of all unpacked hashes on success.
  repo.unpack = unpack; // (packChannel, opts) => hashes

  // hashes is an array of hashes to pack
  // packChannel will be a readable culvert channel {take} containing raw packfile binary data
  repo.pack = pack;     // (hashes, opts) => packChannel
};

function unpack(packChannel, opts, callback) {
  /*jshint validthis:true*/
  if (!callback) return unpack.bind(this, packChannel, opts);

  packChannel = applyParser(packChannel, decodePack, callback);

  const repo = this;

  let version, num, numDeltas = 0, count = 0, countDeltas = 0;
  let done, startDeltaProgress = false;

  // hashes keyed by offset for ofs-delta resolving
  const hashes = {};
  // key is hash, boolean is cached "has" value of true or false
  const has = {};
  // key is hash we're waiting for, value is array of items that are waiting.
  const pending = {};

  return packChannel.take(onStats);

  function onDone(err) {
    if (done) return;
    done = true;
    if (err) return callback(err);
    return callback(null, values(hashes));
  }

  function onStats(err, stats) {
    if (err) return onDone(err);
    version = stats.version;
    num = stats.num;
    packChannel.take(onRead);
  }

  function objectProgress(more) {
    if (!more) startDeltaProgress = true;
    const percent = Math.round(count / num * 100);
    return opts.onProgress("Receiving objects: " + percent + "% (" + (count++) + "/" + num + ")   " + (more ? "\r" : "\n"));
  }

  function deltaProgress(more) {
    if (!startDeltaProgress) return;
    const percent = Math.round(countDeltas / numDeltas * 100);
    return opts.onProgress("Applying deltas: " + percent + "% (" + (countDeltas++) + "/" + numDeltas + ")   " + (more ? "\r" : "\n"));
  }

  function onRead(err, item) {
    if (err) return onDone(err);
    if (opts.onProgress) objectProgress(item);
    if (item === undefined) return onDone();
    if (item.size !== item.body.length) {
      return onDone(new Error("Body size mismatch"));
    }
    if (item.type === "ofs-delta") {
      numDeltas++;
      item.ref = hashes[item.offset - item.ref];
      return resolveDelta(item);
    }
    if (item.type === "ref-delta") {
      numDeltas++;
      return checkDelta(item);
    }
    return saveValue(item);
  }

  function resolveDelta(item) {
    if (opts.onProgress) deltaProgress();
    return repo.loadRaw(item.ref, (err, buffer) => {
      if (err) return onDone(err);
      if (!buffer) return onDone(new Error("Missing base image at " + item.ref));
      const target = codec.deframe(buffer);
      item.type = target.type;
      item.body = applyDelta(item.body, target.body);
      return saveValue(item);
    });
  }

  function checkDelta(item) {
    const hasTarget = has[item.ref];
    if (hasTarget === true) return resolveDelta(item);
    if (hasTarget === false) return enqueueDelta(item);
    return repo.hasHash(item.ref, (err, value) => {
      if (err) return onDone(err);
      has[item.ref] = value;
      if (value) return resolveDelta(item);
      return enqueueDelta(item);
    });
  }

  function saveValue(item) {
    const buffer = codec.frame(item);
    const hash = sha1(buffer);
    hashes[item.offset] = hash;
    has[hash] = true;
    if (hash in pending) {
      // I have yet to come across a pack stream that actually needs this.
      // So I will only implement it when I have concrete data to test against.
      console.error({
        list: pending[hash],
        item: item
      });
      throw "TODO: pending value was found, resolve it";
    }
    return repo.saveRaw(hash, buffer, onSave);
  }

  function onSave(err) {
    if (err) return callback(err);
    packChannel.take(onRead);
  }

  function enqueueDelta(item) {
    const list = pending[item.ref];
    if (!list) pending[item.ref] = [item];
    else list.push(item);
    packChannel.take(onRead);
  }

}

// TODO: Implement delta refs to reduce stream size
function pack(hashes, opts, callback) {
  /*jshint validthis:true*/
  if (!callback) return pack.bind(this, hashes, opts);
  const repo = this;
  let i = 0;
  let first = true;
  const done = false;
  return callback(null, applyParser({ take: take }, encodePack));

  function take(callback) {
    if (done) return callback();
    if (first) return readFirst(callback);
    const hash = hashes[i++];
    if (hash === undefined) {
      return callback();
    }
    repo.loadRaw(hash, (err, buffer) => {
      if (err) return callback(err);
      if (!buffer) return callback(new Error("Missing hash: " + hash));
      // Reframe with pack format header
      callback(null, codec.deframe(buffer));
    });
  }

  function readFirst(callback) {
    first = false;
    callback(null, {num: hashes.length});
  }
}

function values(object) {
  const keys = Object.keys(object);
  const length = keys.length;
  const out = new Array(length);
  for (let i = 0; i < length; i++) {
    out[i] = object[keys[i]];
  }
  return out;
}


function applyParser(stream, parser, onError) {
  const extra = makeChannel();
  extra.put = parser(extra.put);
  stream.take(onData);

  function onData(err, item) {
    if (err) return onError(err);
    let more;
    try { more = extra.put(item); }
    catch (err) { return onError(err); }
    if (more) stream.take(onData);
    else extra.drain(onDrain);
  }

  function onDrain(err) {
    if (err) return onError(err);
    stream.take(onData);
  }

  return { take: extra.take };
}
