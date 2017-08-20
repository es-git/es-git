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
  const url = new URL(document.location.href).searchParams.get('repo');
  const match = url && /^\https:\/\/(.*)$/.exec(url);
  if(!match){
    document.location.search = '?repo=https://github.com/es-git/test-pull';
    return;
  }

  (document.querySelector('#repo') as any).value = 'https://'+match[1];

  await repo.fetch(`/proxy/${match[1]}.git`);

  const refs = new Map(await repo.listRefs().then(refs => Promise.all(refs.map(async ref => [await repo.getRef(ref), ref] as [string, string]))));

  const nodes = new Map<string, Node>();
  const edges = [];
  let y = 0;
  const hashes = [await repo.getRef('refs/remotes/origin/master') as string];
  for await(const {hash, commit: {body: commit}} of repo.walkCommits(...hashes)){
    nodes.set(hash, {
      index: hash,
      label: commit.message,
      children: [],
      parents: [],
      x: hashes.indexOf(hash),
      y
    });
    y++;
    hashes.splice(hashes.indexOf(hash), 1, ...commit.parents);
    for(const parent of commit.parents){
      edges.push({source: hash, target: parent});
    }
  }

  const dagNodes = [...nodes.values()];

  const dagLinks = edges.map(e => ({
    source: nodes.get(e.source) as Node,
    target: nodes.get(e.target) as Node
  }));

  dagLinks.forEach(function(link) {
    var sourceNode = link.source
    var targetNode = link.target;
    sourceNode.children.push(targetNode);
    targetNode.parents.push(sourceNode);
  });

  const svg = d3.select('svg');

  const group = svg
    .append("g");

  svg.append("rect")
    .attr("width", 960)
    .attr("height", 700)
    .style("fill", "none")
    .style("pointer-events", "all")
    .call(d3.zoom()
      .scaleExtent([1 / 8, 4])
      .on("zoom", zoom(group)));

  var svgDagEdges = group.selectAll('.daglink')
    .data(dagLinks)
    .enter().append('path')
      .attr('class', 'daglink')
      .attr('d', d => {
        const x1 = d.source.x * 50 + 50;
        const y1 = d.source.y * 50 + 50;
        const x2 = d.target.x * 50 + 50;
        const y2 = d.target.y * 50 + 50;
        return `M ${x1} ${y1} C ${x1} ${y1+25}, ${x2} ${y1+25}, ${x2} ${y1+50} L ${x2} ${y2}`;
      });

  var svgDagNodes = group.selectAll('.dagnode')
    .data(dagNodes)
    .enter().append('g')
      .attr('transform', d => `translate(${d.x*50 + 50},${d.y*50 + 50})`);
  svgDagNodes.append('circle')
    .attr('class', 'dagnode')
    .attr('r', 5);
  svgDagNodes.append('text')
    .attr('transform', 'translate(6,0)')
    .text(d => d.label);

})().then(_ => console.log('success!'), e => console.error(e));


interface Node {
  index : string
  x : number
  y : number
  children : Node[]
  parents : Node[]
  label : string
}

interface Link {
  source : Node
  target : Node
}


function zoom(group : any) {
  return () => group.attr("transform", d3.event.transform);
}