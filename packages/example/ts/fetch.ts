import mix from '@es-git/mix';
import MemoryRepo from '@es-git/memory-repo';
import object from '@es-git/object-mixin';
import walkers from '@es-git/walkers-mixin';
import fetchMixin from '@es-git/fetch-mixin';
import Terminal from '@es-git/terminal';

const formElm = document.querySelector<HTMLFormElement>('form') as HTMLFormElement;
const inputElm = document.querySelector<HTMLInputElement>('#repo') as HTMLInputElement;
const outputElm = document.querySelector<HTMLPreElement>('pre') as HTMLPreElement;

formElm.addEventListener('submit', async e => {
  e.preventDefault();

  const url = inputElm.value;
  const match = url && /^\https:\/\/(.*)$/.exec(url);
  if(!match){
    outputElm.innerText = 'not a valid url';
    return;
  }

  const Repo = mix(MemoryRepo)
  .with(object)
  .with(walkers)
  .with(fetchMixin, fetch);
  const terminal = new Terminal(m => outputElm.innerText = m);

  terminal.logLine('Creating local repo');

  const repo = new Repo();
  terminal.logLine(`Fetching from ${url}.git`);
  const result = await repo.fetch(`/proxy/${match[1]}.git`, 'refs/heads/*:refs/heads/*', {
    progress: message => terminal.log(message)
  })

  for(const ref of result){
    terminal.logLine(`* ${ref.name} -> ${ref.hash}`);
  }

  terminal.logLine('');
  terminal.logLine('Done!');
});
