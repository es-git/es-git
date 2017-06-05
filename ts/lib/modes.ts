"use strict";

const masks = {
  mask:   parseInt('100000', 8),
  blob:   parseInt('140000', 8),
  file:   parseInt('160000', 8)
};

const modes = {
  isBlob: function (mode : number) {
    return (mode & masks.blob) === masks.mask;
  },
  isFile: function (mode : number) {
    return (mode & masks.file) === masks.mask;
  },
  toType: function (mode : number) {
    if (mode === modes.commit) return "commit";
    if (mode === modes.tree) return "tree";
    if ((mode & masks.blob) === masks.mask) return "blob";
    return "unknown";
  },
  tree:   parseInt( '40000', 8),
  blob:   parseInt('100644', 8),
  file:   parseInt('100644', 8),
  exec:   parseInt('100755', 8),
  sym:    parseInt('120000', 8),
  commit: parseInt('160000', 8)
};

export default modes;