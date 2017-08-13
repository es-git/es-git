import { Mode, mix } from '@es-git/core';
import MemoryRepo from '@es-git/memory-repo';
import objectMixin from '@es-git/object-mixin';
import saveAsMixin from '@es-git/save-as-mixin';
import loadAsMixin from '@es-git/load-as-mixin';

async function test(){
  // Create the repository in memory and
  // enhance it using three mixins
  class Repo extends mix(MemoryRepo)
                    .with(objectMixin)
                    .with(saveAsMixin)
                    .with(loadAsMixin) {}

  // Create an instance of the repository
  const repo = new Repo();

  // Save a text file in the repo with the contents `hello`
  const hash = await repo.saveText('hello');

  // Save a folder with one file, the one we created above
  const tree = await repo.saveTree({
    'file.txt': {
      mode: Mode.file,
      hash
    }
  });

  // Commit the file and folder to the repo
  const commitHash = await repo.saveCommit({
    author: {
      name: 'Tim Caswell',
      email: 'tim@creationix.com',
      date: new Date()
    },
    committer: {
      name: 'Marius Gundersen',
      email: 'me@mariusgundersen.net',
      date: new Date()
    },
    message: 'initial commit',
    tree,
    parents: []
  });

  // Point the master branch to the commit
  await repo.setRef('refs/heads/master', commitHash);

  // Get the hash that the master branch points to
  const refHash = await repo.getRef('refs/heads/master');
  if(!refHash) throw new Error('branch does not exist');

  // Get the commit (the hash of the tree and the message) using the hash
  const {tree: treeHash, message} = await repo.loadCommit(refHash);
  console.log(message); // `initial commit`

  // Get the hash to the `file.txt' file in the tree
  const {'file.txt': {hash: fileHash}} = await repo.loadTree(treeHash);

  // Get the content of the file as a string
  const content = await repo.loadText(fileHash);
  console.log(content) // `hello`
};

test();