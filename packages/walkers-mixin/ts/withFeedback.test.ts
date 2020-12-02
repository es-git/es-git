import withFeedback from './withFeedback';

test('withFeedback', async() => {
  const iterator = withFeedback(generate(), true);
  let sum = 0;
  for await(const item of iterator){
    sum += item;
  }
  expect(sum).toBe(45);
});

async function* generate(){
  for(let i=0; i<10; i++){
    yield i;
  }
}
