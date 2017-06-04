"use strict";

import * as codec from '../lib/object-codec.js';
import bodec from 'bodec';
import inflate from '../lib/inflate';
import deflate from '../lib/deflate';
import sha1 from 'git-sha1';
import modes from '../lib/modes.js';
let db;

export default function mixin(repo, prefix) {
  if (!prefix) throw new Error("Prefix required");
  repo.refPrefix = prefix;
  repo.saveAs = saveAs;
  repo.saveRaw = saveRaw;
  repo.loadAs = loadAs;
  repo.loadRaw = loadRaw;
  repo.readRef = readRef;
  repo.updateRef = updateRef;
  repo.hasHash = hasHash;
}

export function init(callback) {

  db = openDatabase('tedit', '1.0', 'tedit local data', 10 * 1024 * 1024);
  db.transaction(tx => {
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS objects (hash unique, body blob)'
    );
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS refs (path unique, value text)'
    );
  }, (...args) => {
    console.error(args);
    callback(new Error("Problem initializing database"));
  }, () => {
    callback();
  });
}

export function saveAs(type, body, callback) {
  /*jshint: validthis: true */
  if (!callback) return saveAs.bind(this, type, body);
  let hash, buffer;
  try {
    buffer = codec.frame({type:type,body:body});
    hash = sha1(buffer);
  }
  catch (err) { return callback(err); }
  this.saveRaw(hash, buffer, callback);
}

export function saveRaw(hash, buffer, callback) {
  /*jshint: validthis: true */
  if (!callback) return saveRaw.bind(this, hash, buffer);
  const sql = 'INSERT INTO objects (hash, body) VALUES (?, ?)';
  db.transaction(tx => {
    let text;
    try {
      text = bodec.toBase64(deflate(buffer));
    }
    catch (err) {
      return callback(err);
    }
    tx.executeSql(sql, [hash, text], () => {
      callback(null, hash);
    });
  });
}

export function loadAs(type, hash, callback) {
  /*jshint: validthis: true */
  if (!callback) return loadAs.bind(this, type, hash);
  loadRaw(hash, (err, buffer) => {
    if (!buffer) return callback(err);
    let parts, body;
    try {
      parts = codec.deframe(buffer);
      if (parts.type !== type) throw new Error("Type mismatch");
      body = codec.decoders[type](parts.body);
    }
    catch (err) {
      return callback(err);
    }
    callback(null, body);
  });
}

export function loadRaw(hash, callback) {
  /*jshint: validthis: true */
  if (!callback) return loadRaw.bind(this, hash);
  const sql = 'SELECT * FROM objects WHERE hash=?';
  db.readTransaction(tx => {
    tx.executeSql(sql, [hash], (tx, result) => {
      if (!result.rows.length) return callback();
      const item = result.rows.item(0);
      let buffer;
      try {
        buffer = inflate(bodec.fromBase64(item.body));
      }
      catch (err) {
        return callback(err);
      }
      callback(null, buffer);
    }, (tx, error) => {
      callback(new Error(error.message));
    });
  });
}

function hasHash(type, hash, callback) {
  /*jshint: validthis: true */
  loadAs(type, hash, (err, value) => {
    if (err) return callback(err);
    if (value === undefined) return callback(null, false);
    if (type !== "tree") return callback(null, true);
    const names = Object.keys(value);
    next();
    function next() {
      if (!names.length) return callback(null, true);
      const name = names.pop();
      const entry = value[name];
      hasHash(modes.toType(entry.mode), entry.hash, (err, has) => {
        if (err) return callback(err);
        if (has) return next();
        callback(null, false);
      });
    }
  });
}

function readRef(ref, callback) {
  /*jshint: validthis: true */
  const key = this.refPrefix + "/" + ref;
  const sql = 'SELECT * FROM refs WHERE path=?';
  db.transaction(tx => {
    tx.executeSql(sql, [key], (tx, result) => {
      if (!result.rows.length) return callback();
      const item = result.rows.item(0);
      callback(null, item.value);
    }, (tx, error) => {
      callback(new Error(error.message));
    });
  });
}

function updateRef(ref, hash, callback) {
  /*jshint: validthis: true */
  const key = this.refPrefix + "/" + ref;
  const sql = 'INSERT INTO refs (path, value) VALUES (?, ?)';
  db.transaction(tx => {
    tx.executeSql(sql, [key, hash], () => {
      callback();
    }, (tx, error) => {
      callback(new Error(error.message));
    });
  });
}
