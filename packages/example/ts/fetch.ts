import mix from '@es-git/mix';
import MemoryRepo from '@es-git/memory-repo';
import object from '@es-git/object-mixin';
import walkers from '@es-git/walkers-mixin';
import fetchMixin from '@es-git/fetch-mixin';
import Terminal from '@es-git/terminal';

(async function(){

  const url = new URL(document.location.href).searchParams.get('repo');
  const match = url && /^\https:\/\/(.*)$/.exec(url);
  if(!match){
    document.location.search = '?repo=https://github.com/es-git/test-pull';
    return;
  }
  const inputElm = document.querySelector<HTMLInputElement>('#repo') as HTMLInputElement;
  const outputElm = document.querySelector<HTMLPreElement>('pre') as HTMLPreElement;
  inputElm.value = 'https://'+match[1];

  const Repo = mix(MemoryRepo)
  .with(object)
  .with(walkers)
  .with(fetchMixin, fetch);
  const terminal = new Terminal(m => outputElm.innerText = m);

  terminal.logLine('Creating local repo');

  const repo = new Repo();
  terminal.logLine(`Fetching from ${url}.git`);
  const result = await repo.fetch(`/proxy/${match[1]}.git`, {
    progress: message => terminal.log(message)
  })

  for(const ref of result){
    terminal.logLine(`* ${ref.name} -> ${ref.to}`);
  }

  terminal.logLine('');
  terminal.logLine('Done!');

})().then(_ => console.log('success!'), e => console.error(e));
