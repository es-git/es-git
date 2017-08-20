import mix from '@es-git/mix';
import MemoryRepo from '@es-git/memory-repo';
import object from '@es-git/object-mixin';
import walkers from '@es-git/walkers-mixin';
import fetchMixin from '@es-git/fetch-mixin';

(async function(){
  const Repo = mix(MemoryRepo)
  .with(object)
  .with(walkers)
  .with(fetchMixin, fetch);

  const repo = new Repo();
  await repo.fetch('http://localhost:8080/proxy/github.com/es-git/test-pull.git');

})().then(_ => console.log('success!'), e => console.error(e));
