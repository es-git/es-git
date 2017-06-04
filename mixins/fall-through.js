import modes from '../lib/modes';

export default function (local, remote) {
  const loadAs = local.loadAs;
  local.loadAs = newLoadAs;
  function newLoadAs(type, hash, callback) {
    if (!callback) return newLoadAs.bind(local. type, hash);
    loadAs.call(local, type, hash, (err, body) => {
      if (err) return callback(err);
      if (body === undefined) return remote.loadAs(type, hash, callback);
      callback(null, body);
    });
  }

  const readRef = local.readRef;
  local.readRef = newReadRef;
  function newReadRef(ref, callback) {
    if (!callback) return newReadRef.bind(local. ref);
    readRef.call(local, ref, (err, body) => {
      if (err) return callback(err);
      if (body === undefined) return remote.readRef(ref, callback);
      callback(null, body);
    });
  }

};
