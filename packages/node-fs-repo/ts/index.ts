import { promises } from 'fs';
import ByoFsRepo from '@es-git/byo-fs-repo';

const fs = {
  writeFile: promises.writeFile,
  readFile: promises.readFile,
  readDir: promises.readdir,
  unlink: promises.unlink,
  stat: promises.stat,
  mkdir: promises.mkdir,

  exists: async function (path: string) : Promise<boolean> {
    let result = true;
    const stats = await promises.stat(path).catch((e) => {
      result = false;
    });

    return result;
  },
}
export default class NodeFsRepo extends ByoFsRepo {
  constructor(path : string) {
    super(fs, path);
  }
}

