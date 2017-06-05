import modes from '../lib/modes.js';

export default function (repo) {
  repo.logWalk = logWalk;
  repo.treeWalk = treeWalk;
};

export {walk};

import {
  IRepo,
  Type,
  Body,
  CommitBody,
  TreeBody,
  Dict
} from '../types'

export default function mixin(repo : Constructor<IRepo>) : Constructor<IRepo> {
  return class extends repo implements IRepo {

    // (ref) => stream<commit>
    async logWalk(ref : string) {
      let last;
      const seen = {};
      const repo = this;
      if (!repo.readRef) {
        return resolveRef(repo, ref, onHash);
      }else{
        const shallow = await repo.readRef("shallow");
        last = shallow;
        resolveRef(repo, ref, onHash);
      }

      function onHash(err, hash) {
        if (err) return callback(err);
        return repo.loadAs("commit", hash, (err, commit) => {
          if (commit === undefined) return callback(err);
          commit.hash = hash;
          seen[hash] = true;
          return callback(null, walk(commit, scan, loadKey, compare));
        });
      }

      function scan(commit) {
        if (last === commit) return [];
        return commit.parents.filter(hash => !seen[hash]);
      }

      function loadKey(hash, callback) {
        return repo.loadAs("commit", hash, (err, commit) => {
          if (!commit) return callback(err || new Error("Missing commit " + hash));
          commit.hash = hash;
          if (hash === last) commit.last = true;
          return callback(null, commit);
        });
      }
    }

    // (treeHash) => stream<object>
    function treeWalk(hash, callback) {
      if (!callback) return treeWalk.bind(this, hash);
      const repo = this;
      return repo.loadAs("tree", hash, onTree);

      function onTree(err, body) {
        if (!body) return callback(err || new Error("Missing tree " + hash));
        const tree = {
          mode: modes.tree,
          hash: hash,
          body: body,
          path: "/"
        };
        return callback(null, walk(tree, treeScan, treeLoadKey, treeCompare));
      }

      function treeLoadKey(entry, callback) {
        if (entry.mode !== modes.tree) return callback(null, entry);
        const type = modes.toType(entry.mode);
        return repo.loadAs(type, entry.hash, (err, body) => {
          if (err) return callback(err);
          entry.body = body;
          return callback(null, entry);
        });
      }

    }
  }
}

function compare(commit : CommitBody, other : CommitBody) {
  return commit.author.date < other.author.date;
}

function treeScan(object : any) {
  if (object.mode !== modes.tree) return [];
  const tree = object.body;
  return Object.keys(tree).map(name => {
    const entry = tree[name];
    let path = object.path + name;
    if (entry.mode === modes.tree) path += "/";
    return {
      mode: entry.mode,
      hash: entry.hash,
      path: path
    };
  });
}

function treeCompare(first, second) {
  return first.path < second.path;
}

function resolveRef(repo, hashish, callback) {
  if (/^[0-9a-f]{40}$/.test(hashish)) {
    return callback(null, hashish);
  }
  repo.readRef(hashish, (err, hash) => {
    if (!hash) return callback(err || new Error("Bad ref " + hashish));
    callback(null, hash);
  });
}

function walk(seed, scan, loadKey, compare) {
  const queue = [seed];
  let working = 0, error, cb;
  return {read: read, abort: abort};

  function read(callback) {
    if (!callback) return read;
    if (cb) return callback(new Error("Only one read at a time"));
    if (working) { cb = callback; return; }
    const item = queue.shift();
    if (!item) return callback();
    try { scan(item).forEach(onKey); }
    catch (err) { return callback(err); }
    return callback(null, item);
  }

  function abort(callback) { return callback(); }

  function onError(err) {
    if (cb) {
      const callback = cb; cb = null;
      return callback(err);
    }
    error = err;
  }

  function onKey(key) {
    working++;
    loadKey(key, onItem);
  }

  function onItem(err, item) {
    working--;
    if (err) return onError(err);
    let index = queue.length;
    while (index && compare(item, queue[index - 1])) index--;
    queue.splice(index, 0, item);
    if (!working && cb) {
      const callback = cb; cb = null;
      return read(callback);
    }
  }
}
