import { Mode } from '@es-git/core';
import mix from '@es-git/mix';
import MemoryRepo from '@es-git/memory-repo';
import object, { Person } from '@es-git/object-mixin';
import walkers from '@es-git/walkers-mixin';
import checkout from '@es-git/checkout-mixin';
import commit, { Folder } from '@es-git/commit-mixin';
import fetchMixin from '@es-git/fetch-mixin';
import pushMixin from '@es-git/push-mixin';
import Terminal from '@es-git/terminal';

(async function(){

  const url = 'github.com/es-git/test-push';
  const user = {
    username: '...',
    password: '...'
  };
  const contentElm = document.querySelector<HTMLInputElement>('#content') as HTMLInputElement;
  const messageElm = document.querySelector<HTMLInputElement>('#message') as HTMLInputElement;
  const nameElm = document.querySelector<HTMLInputElement>('#name') as HTMLInputElement;
  const emailElm = document.querySelector<HTMLInputElement>('#email') as HTMLInputElement;
  const outputElm = document.querySelector<HTMLPreElement>('pre') as HTMLPreElement;
  const formElm = document.querySelector<HTMLFormElement>('form') as HTMLFormElement;
  const pushElm = document.querySelector<HTMLButtonElement>('#push') as HTMLButtonElement;

  const Repo = mix(MemoryRepo)
  .with(object)
  .with(walkers)
  .with(checkout)
  .with(commit)
  .with(fetchMixin, fetch)
  .with(pushMixin, fetch)
  const terminal = new Terminal(m => outputElm.innerText = m);

  terminal.logLine('Creating local repo');

  const repo = new Repo();
  terminal.logLine(`Fetching from ${url}.git`);
  const result = await repo.fetch(`/proxy/${url}.git`, {
    refspec: 'refs/heads/master:refs/heads/master',
    progress: message => terminal.log(message)
  })

  for(const ref of result){
    terminal.logLine(`* ${ref.name} -> ${ref.to}`);
  }

  terminal.logLine('');
  terminal.logLine('Done!');

  const originalCommit = await repo.checkout('refs/heads/master');
  contentElm.value = originalCommit.files['readme.md'].text;

  formElm.addEventListener('submit', async e => {
    e.preventDefault();

    const text = contentElm.value;
    if(!text){
      terminal.logLine('Content needed');
      return;
    }

    const newCommit : Folder = {
      folders: originalCommit.folders,
      files: {
        ...originalCommit.files,
        'readme.md': {
          text
        }
      }
    }

    const author : Person = {
      name: nameElm.value,
      email: emailElm.value,
      date: new Date()
    };

    const hash = await repo.commit('refs/heads/master', newCommit, messageElm.value, author);

    terminal.logLine(`Commited, new hash ${hash}`);

  });

  pushElm.addEventListener('click', async e => {
    e.preventDefault();

    terminal.logLine('Starting push');
    await repo.push(`/proxy/${url}.git`, 'refs/heads/master', user, { progress: message => terminal.log(message) })

    terminal.logLine('Push completed');
  });

})().then(_ => console.log('success!'), e => console.error(e));
