import mix from '@es-git/mix';
import MemoryRepo from '@es-git/memory-repo';
import object, { CommitBody } from '@es-git/object-mixin';
import walkers from '@es-git/walkers-mixin';
import fetchMixin from '@es-git/fetch-mixin';

import * as d3 from 'd3';
(Symbol as any).asyncIterator = (Symbol as any).asyncIterator || Symbol("Symbol.asyncIterator");

(async function(){
  const Repo = mix(MemoryRepo)
  .with(object)
  .with(walkers)
  .with(fetchMixin, fetch);

  const repo = new Repo();
  const url = 'github.com/es-git/test-pull';
  await repo.fetch(`http://localhost:8080/proxy/${url}.git`);

  const refs = new Map(await repo.listRefs().then(refs => Promise.all(refs.map(async ref => [await repo.getRef(ref), ref] as [string, string]))));

  console.log(refs);
  const columns = [...refs.keys()];

  let y = 50;
  const svg = document.querySelector('svg') as SVGSVGElement;
  const parents = new Map<string, {x : number, y : number}[]>();

  for await(const {hash, commit: {body: commit}} of repo.walkCommits(...refs.keys())){
    const column = columns.indexOf(hash);
    const x = column*50 + 50;
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('transform', `translate(${x}, ${y})`);
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    node.setAttribute('r', 10+'');
    group.appendChild(node);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', 15+'');
    text.textContent = commit.message;
    group.appendChild(text);
    svg.appendChild(group);
    columns.splice(column, 1, ...commit.parents);
    for(const parent of commit.parents){
      if(parents.has(parent)){
        (parents.get(parent) as any).push({x, y});
      }else{
        parents.set(parent, [{x, y}]);
      }
    }

    const children = parents.get(hash);
    if(children){
      for(const child of children){
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line') as SVGLineElement;
        line.setAttribute('x1', child.x+'');
        line.setAttribute('y1', child.y+'');
        line.setAttribute('x2', x+'');
        line.setAttribute('y2', y+'');
        svg.appendChild(line);
      }
    }

    y += 50;
  }

})().then(_ => console.log('success!'), e => console.error(e));
