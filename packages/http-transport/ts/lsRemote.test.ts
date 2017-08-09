import test from 'ava';
import * as sinon from 'sinon';
import 'sinon-stub-promise';
const sinonStubPromise = require('sinon-stub-promise');

import lsRemote from './lsRemote';

sinonStubPromise(sinon);

test(async t => {
  const fetch = sinon.stub();
  const response = {
    text: sinon.stub().resolves(responseText),
    status: 200,
    statusText: 'OK'
  };
  fetch.resolves(response);
  const result = await lsRemote('https://github.com/my/repo.git', fetch);
  t.is(fetch.firstCall.args[0], 'https://github.com/my/repo.git/info/refs?service=git-upload-pack');
  t.deepEqual(Array.from(result.capabilities), [
    ['multi_ack', true],
    ['thin-pack', true],
    ['side-band', true],
    ['side-band-64k', true],
    ['ofs-delta', true],
    ['shallow', true],
    ['deepen-since', true],
    ['deepen-not', true],
    ['deepen-relative', true],
    ['no-progress', true],
    ['include-tag', true],
    ['multi_ack_detailed', true],
    ['no-done', true],
    ['symref', 'HEAD:refs/heads/master'],
    ['agent', 'git/github-g7db9c1d60']
  ]);
  t.deepEqual(result.remoteRefs, [
    {hash:'40b3732b3b1fc87e625b107cd55c68cd1ba4470f', name:'HEAD'},
    {hash:'9c696ae2d1ffdbed22f8bf64745d3d2483f40b3c', name:'refs/current'},
    {hash:'0e76e6214dbba347a4f24497261a1bd71aac8347', name:'refs/heads/clean'},
    {hash:'5e87db001a45b8db45eba2f9c83d5a47882f1940', name:'refs/heads/doc'},
    {hash:'ae5b8f244fb5245fc3670a65ebb542130de5d9af', name:'refs/heads/legacy'},
    {hash:'40b3732b3b1fc87e625b107cd55c68cd1ba4470f', name:'refs/heads/master'},
    {hash:'c367dee7abfd655208ad495877acfb05f83bebbe', name:'refs/heads/phase2'},
    {hash:'ff690e8d8c2ab3f3ce9c1cde34503c61bf1986cc', name:'refs/pull/102/head'},
    {hash:'ab50767ab50c83d2af65be8e6f72baff6ce68d9f', name:'refs/pull/104/head'},
    {hash:'dabe3683d59f0f92ec77afd0e63a02910c53dfaa', name:'refs/pull/108/head'},
    {hash:'016cb40c4328f56adf1af846713132b231ea54c7', name:'refs/pull/110/head'},
    {hash:'f1740f50eda2d161524f80399f8e1f2a946f005a', name:'refs/pull/111/head'},
    {hash:'9136d27220f83f75ecf324c4b26e4020fc964eb6', name:'refs/pull/112/head'},
    {hash:'d4a1d6db1c059eb4f8f951e3c2835a84ad68427d', name:'refs/pull/113/head'},
    {hash:'01abd3194eaacb6ea57abee94d169d01e5960a9a', name:'refs/pull/114/head'},
    {hash:'0c92c7823b04d5c951d465c93a83dc35bb26cd95', name:'refs/pull/118/head'},
    {hash:'126fb88be921a80ee84ff39e98217b4981b017db', name:'refs/pull/119/head'},
    {hash:'221ca1b2a3059b28f036db9166d2457da2baff49', name:'refs/pull/121/head'},
    {hash:'57adccc9f3c194a08b91f6fd279ef6121f653381', name:'refs/pull/123/head'},
    {hash:'88c4573771c1d4e2ddf90232bbb576311f82a358', name:'refs/pull/123/merge'},
    {hash:'4380bf9b9ade4908753d1f7616d4f6ea54a1eb5d', name:'refs/pull/127/head'},
    {hash:'df5688681bcfb1d25f1735b7ded03a2275f5c7fb', name:'refs/pull/129/head'},
    {hash:'26577802397b1c865d79cf2b4f1e81a51f141e23', name:'refs/pull/129/merge'},
    {hash:'a455a8e283092103da87b8c9ce32c628c969edc1', name:'refs/pull/135/head'},
    {hash:'bdea7c8c0b043ee6c0bc0273705fc6bb9b145d71', name:'refs/pull/14/head'},
    {hash:'8d690a57a5aeefa2985f3fbff7fb420c896cdac9', name:'refs/pull/14/merge'},
    {hash:'a61ad52468e9efcc335502e5a3bb0446ec43016f', name:'refs/pull/15/head'},
    {hash:'e560787b85ab62db8a80e016d4372eebc2925c0f', name:'refs/pull/15/merge'},
    {hash:'95df3b8d82ac5df01df168c875c6f42784e04332', name:'refs/pull/18/head'},
    {hash:'68e300b0befd6781306450016557b74bd02603e7', name:'refs/pull/18/merge'},
    {hash:'bbe4beeb6f34b477ef5ffd6e3af7963093251fa0', name:'refs/pull/21/head'},
    {hash:'a094f210217a04b73154b61e1e59af53c3af7f2f', name:'refs/pull/21/merge'},
    {hash:'44f9deff485f83b9042dd02239a3665415a9d6e2', name:'refs/pull/56/head'},
    {hash:'b5fe74b794c24cc28a2f28e717cbb2da6828b452', name:'refs/pull/56/merge'},
    {hash:'bfb2575225701d7d32d30b3243bee942a49a1370', name:'refs/pull/69/head'},
    {hash:'f68737d67ee88bfc42b27fd2c12c62de577d9a0c', name:'refs/pull/71/head'},
    {hash:'5fdce0cc713390cdcc7eb24a85864d07ddc3068f', name:'refs/pull/71/merge'},
    {hash:'4f06a7e31f2ebc6fb4abfc6255290c6883916fe0', name:'refs/pull/82/head'},
    {hash:'93669de7bce48c9525ce84902df10fa7eb1ab63e', name:'refs/pull/86/head'},
    {hash:'552116a881f9c405a9c3699096808282968c97ae', name:'refs/pull/86/merge'},
    {hash:'30a3468c1c4710ff65038a16efafcd76ee909ecd', name:'refs/pull/87/head'},
    {hash:'2df2ba72f94915d6f273faa29c47f78602beafed', name:'refs/pull/90/head'},
    {hash:'8d879a826c451780e61cced91c75864e8ba4b57b', name:'refs/pull/95/head'},
    {hash:'92a94b28cf963e8318fde84a61b9912e15ac4eaa', name:'refs/pull/97/head'},
    {hash:'42d1fd4a1bbd6ff177434ad0eabbca8ecc6eeb0f', name:'refs/pull/97/merge'},
    {hash:'fecb23dce5ed0ccab18cb95d141e2694dc8b2763', name:'refs/pull/98/head'},
    {hash:'4b7fa6d4f384017f64d47f0aaf68a02fb29fe58c', name:'refs/pull/99/head'},
    {hash:'525af9de1e1a98b6723ce109ae13bc1455af2883', name:'refs/tags/0.0.1'},
    {hash:'dd63c427173810677705a1c1abca3e39bd4338e9', name:'refs/tags/0.2.0'},
    {hash:'3c4e5f2da0870692227febbc6ca1473d9a42c98d', name:'refs/tags/0.2.1'},
    {hash:'4dbeb69883264c2b87ba84adb67fa048397b3600', name:'refs/tags/0.2.2'},
    {hash:'e01229a1bd654109fc055a8be751c46c2d3930cb', name:'refs/tags/0.2.3'},
    {hash:'e6e08587d666fa04f08d82c971fc722b2c8280f5', name:'refs/tags/0.2.4'},
    {hash:'a3025aa5db0d2167da946d9565a610b10f196620', name:'refs/tags/0.2.5'},
    {hash:'7c9b204411219099d27844cbfa0706d4e685cc4f', name:'refs/tags/0.3.0'},
    {hash:'60478cc8107510f56a30c69ea09190ad715d1d66', name:'refs/tags/0.3.1'},
    {hash:'d9c04323272568da750c3bf548dff99fb4218717', name:'refs/tags/0.3.2'},
    {hash:'c3fe5b62c226f726cbb8a2345a69c7d78faaeb37', name:'refs/tags/0.3.3'},
    {hash:'0e76e6214dbba347a4f24497261a1bd71aac8347', name:'refs/tags/0.4.0'},
    {hash:'db477a765427f13e16b4185dd66750126f2a0dcd', name:'refs/tags/0.4.1'},
    {hash:'c1ef9cdf801fcbc47133b2aa73a1da1aed4231dc', name:'refs/tags/0.4.2'},
    {hash:'659438e9fd166caeed6172b64b20342165521508', name:'refs/tags/0.5.0'},
    {hash:'7857e79c9f011a6f302e4ff23d3103f376fd4fe9', name:'refs/tags/0.5.1'},
    {hash:'d32d42fd38f8dc01333d512a0a73d2ddd9c23ae0', name:'refs/tags/0.5.2'},
    {hash:'bb18d064bf79320c5719a648fd0f749b82d9ee9f', name:'refs/tags/0.5.4'},
    {hash:'df273f9107df5b64b2ea86f87f3bd0e5737800bd', name:'refs/tags/0.6.0'},
    {hash:'843c9839c7693d0d805e902111583a08a71be95c', name:'refs/tags/0.6.1'},
    {hash:'ae5b8f244fb5245fc3670a65ebb542130de5d9af', name:'refs/tags/0.6.2'},
    {hash:'96909a556176abf005b4d7deef992db6326194aa', name:'refs/tags/0.7.1'},
    {hash:'7e6022791f1227f1d5c6317c0e7b24974d855d99', name:'refs/tags/0.7.2'},
    {hash:'b5897ce2f71374b5e16ef58a5d12e4ad0ea68e39', name:'refs/tags/0.7.3'},
    {hash:'6dd92da330671e0b4209c9fcab6660902d0061f7', name:'refs/tags/0.7.4'},
    {hash:'1369459488a5b0a565f10be19b7a6fd07d4436b5', name:'refs/tags/0.7.5'},
    {hash:'9c696ae2d1ffdbed22f8bf64745d3d2483f40b3c', name:'refs/tags/0.7.6'},
    {hash:'4ca86be0bf3a5e57f53c44491838955d3201a8ff', name:'refs/tags/0.7.7'},
    {hash:'d78da0138969a368da74d0dfb9e3c5d88114b152', name:'refs/tags/0.7.8'},
    {hash:'e0947d61f70bd4cf354e74edb027ae783c5891fb', name:'refs/tags/current'},
  ])
});

const responseText = `001e# service=git-upload-pack
0000010540b3732b3b1fc87e625b107cd55c68cd1ba4470f HEAD\0multi_ack thin-pack side-band side-band-64k ofs-delta shallow deepen-since deepen-not deepen-relative no-progress include-tag multi_ack_detailed no-done symref=HEAD:refs/heads/master agent=git/github-g7db9c1d60
003a9c696ae2d1ffdbed22f8bf64745d3d2483f40b3c refs/current
003e0e76e6214dbba347a4f24497261a1bd71aac8347 refs/heads/clean
003c5e87db001a45b8db45eba2f9c83d5a47882f1940 refs/heads/doc
003fae5b8f244fb5245fc3670a65ebb542130de5d9af refs/heads/legacy
003f40b3732b3b1fc87e625b107cd55c68cd1ba4470f refs/heads/master
003fc367dee7abfd655208ad495877acfb05f83bebbe refs/heads/phase2
0040ff690e8d8c2ab3f3ce9c1cde34503c61bf1986cc refs/pull/102/head
0040ab50767ab50c83d2af65be8e6f72baff6ce68d9f refs/pull/104/head
0040dabe3683d59f0f92ec77afd0e63a02910c53dfaa refs/pull/108/head
0040016cb40c4328f56adf1af846713132b231ea54c7 refs/pull/110/head
0040f1740f50eda2d161524f80399f8e1f2a946f005a refs/pull/111/head
00409136d27220f83f75ecf324c4b26e4020fc964eb6 refs/pull/112/head
0040d4a1d6db1c059eb4f8f951e3c2835a84ad68427d refs/pull/113/head
004001abd3194eaacb6ea57abee94d169d01e5960a9a refs/pull/114/head
00400c92c7823b04d5c951d465c93a83dc35bb26cd95 refs/pull/118/head
0040126fb88be921a80ee84ff39e98217b4981b017db refs/pull/119/head
0040221ca1b2a3059b28f036db9166d2457da2baff49 refs/pull/121/head
004057adccc9f3c194a08b91f6fd279ef6121f653381 refs/pull/123/head
004188c4573771c1d4e2ddf90232bbb576311f82a358 refs/pull/123/merge
00404380bf9b9ade4908753d1f7616d4f6ea54a1eb5d refs/pull/127/head
0040df5688681bcfb1d25f1735b7ded03a2275f5c7fb refs/pull/129/head
004126577802397b1c865d79cf2b4f1e81a51f141e23 refs/pull/129/merge
0040a455a8e283092103da87b8c9ce32c628c969edc1 refs/pull/135/head
003fbdea7c8c0b043ee6c0bc0273705fc6bb9b145d71 refs/pull/14/head
00408d690a57a5aeefa2985f3fbff7fb420c896cdac9 refs/pull/14/merge
003fa61ad52468e9efcc335502e5a3bb0446ec43016f refs/pull/15/head
0040e560787b85ab62db8a80e016d4372eebc2925c0f refs/pull/15/merge
003f95df3b8d82ac5df01df168c875c6f42784e04332 refs/pull/18/head
004068e300b0befd6781306450016557b74bd02603e7 refs/pull/18/merge
003fbbe4beeb6f34b477ef5ffd6e3af7963093251fa0 refs/pull/21/head
0040a094f210217a04b73154b61e1e59af53c3af7f2f refs/pull/21/merge
003f44f9deff485f83b9042dd02239a3665415a9d6e2 refs/pull/56/head
0040b5fe74b794c24cc28a2f28e717cbb2da6828b452 refs/pull/56/merge
003fbfb2575225701d7d32d30b3243bee942a49a1370 refs/pull/69/head
003ff68737d67ee88bfc42b27fd2c12c62de577d9a0c refs/pull/71/head
00405fdce0cc713390cdcc7eb24a85864d07ddc3068f refs/pull/71/merge
003f4f06a7e31f2ebc6fb4abfc6255290c6883916fe0 refs/pull/82/head
003f93669de7bce48c9525ce84902df10fa7eb1ab63e refs/pull/86/head
0040552116a881f9c405a9c3699096808282968c97ae refs/pull/86/merge
003f30a3468c1c4710ff65038a16efafcd76ee909ecd refs/pull/87/head
003f2df2ba72f94915d6f273faa29c47f78602beafed refs/pull/90/head
003f8d879a826c451780e61cced91c75864e8ba4b57b refs/pull/95/head
003f92a94b28cf963e8318fde84a61b9912e15ac4eaa refs/pull/97/head
004042d1fd4a1bbd6ff177434ad0eabbca8ecc6eeb0f refs/pull/97/merge
003ffecb23dce5ed0ccab18cb95d141e2694dc8b2763 refs/pull/98/head
003f4b7fa6d4f384017f64d47f0aaf68a02fb29fe58c refs/pull/99/head
003d525af9de1e1a98b6723ce109ae13bc1455af2883 refs/tags/0.0.1
003ddd63c427173810677705a1c1abca3e39bd4338e9 refs/tags/0.2.0
003d3c4e5f2da0870692227febbc6ca1473d9a42c98d refs/tags/0.2.1
003d4dbeb69883264c2b87ba84adb67fa048397b3600 refs/tags/0.2.2
003de01229a1bd654109fc055a8be751c46c2d3930cb refs/tags/0.2.3
003de6e08587d666fa04f08d82c971fc722b2c8280f5 refs/tags/0.2.4
003da3025aa5db0d2167da946d9565a610b10f196620 refs/tags/0.2.5
003d7c9b204411219099d27844cbfa0706d4e685cc4f refs/tags/0.3.0
003d60478cc8107510f56a30c69ea09190ad715d1d66 refs/tags/0.3.1
003dd9c04323272568da750c3bf548dff99fb4218717 refs/tags/0.3.2
003dc3fe5b62c226f726cbb8a2345a69c7d78faaeb37 refs/tags/0.3.3
003d0e76e6214dbba347a4f24497261a1bd71aac8347 refs/tags/0.4.0
003ddb477a765427f13e16b4185dd66750126f2a0dcd refs/tags/0.4.1
003dc1ef9cdf801fcbc47133b2aa73a1da1aed4231dc refs/tags/0.4.2
003d659438e9fd166caeed6172b64b20342165521508 refs/tags/0.5.0
003d7857e79c9f011a6f302e4ff23d3103f376fd4fe9 refs/tags/0.5.1
003dd32d42fd38f8dc01333d512a0a73d2ddd9c23ae0 refs/tags/0.5.2
003dbb18d064bf79320c5719a648fd0f749b82d9ee9f refs/tags/0.5.4
003ddf273f9107df5b64b2ea86f87f3bd0e5737800bd refs/tags/0.6.0
003d843c9839c7693d0d805e902111583a08a71be95c refs/tags/0.6.1
003dae5b8f244fb5245fc3670a65ebb542130de5d9af refs/tags/0.6.2
003d96909a556176abf005b4d7deef992db6326194aa refs/tags/0.7.1
003d7e6022791f1227f1d5c6317c0e7b24974d855d99 refs/tags/0.7.2
003db5897ce2f71374b5e16ef58a5d12e4ad0ea68e39 refs/tags/0.7.3
003d6dd92da330671e0b4209c9fcab6660902d0061f7 refs/tags/0.7.4
003d1369459488a5b0a565f10be19b7a6fd07d4436b5 refs/tags/0.7.5
003d9c696ae2d1ffdbed22f8bf64745d3d2483f40b3c refs/tags/0.7.6
003d4ca86be0bf3a5e57f53c44491838955d3201a8ff refs/tags/0.7.7
003dd78da0138969a368da74d0dfb9e3c5d88114b152 refs/tags/0.7.8
003fe0947d61f70bd4cf354e74edb027ae783c5891fb refs/tags/current
0000`;