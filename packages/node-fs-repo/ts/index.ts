import { promisify } from 'util';
import * as fsCallback from 'fs';
import ByoFsRepo from '@es-git/byo-fs-repo';

const fs = {
  writeFile: promisify(fsCallback.writeFile),
  readFile: promisify(fsCallback.readFile),
  exists: promisify(fsCallback.exists),
  readDir: promisify(fsCallback.readdir),
  unlink: promisify(fsCallback.unlink),
  stat: promisify(fsCallback.stat),
  mkdir: promisify(fsCallback.mkdir)
}

export default class NodeFsRepo extends ByoFsRepo {
  constructor(path : string) {
    super(fs, path);
  }
}