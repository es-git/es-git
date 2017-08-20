import mix from '@es-git/mix';
import MemoryRepo from '@es-git/memory-repo';
import object from '@es-git/object-mixin';
import walkers from '@es-git/walkers-mixin';
import fetchMixin from '@es-git/fetch-mixin';

(async function(){

  const url = new URL(document.location.href).searchParams.get('repo');
  const match = url && /^\https:\/\/(.*)$/.exec(url);
  if(!match){
    document.location.search = '?repo=https://github.com/es-git/test-pull';
    return;
  }
  (document.querySelector('#repo') as any).value = 'https://'+match[1];

  const Repo = mix(MemoryRepo)
  .with(object)
  .with(walkers)
  .with(fetchMixin, fetch);

  const repo = new Repo();
  await repo.fetch(`/proxy/${match[1]}.git`);

})().then(_ => console.log('success!'), e => console.error(e));
