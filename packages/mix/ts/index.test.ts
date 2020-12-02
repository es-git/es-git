import mix, { Constructor } from './index';

test('mix', () => {
  const Result = mix(class B {
    test(){
      return 'test';
    }
  }).with(b => (class M extends b {
    test(){
      return `${super.test()} enhanced`;
    }
  }));

  const result = new Result();
  expect(result.test()).toBe('test enhanced');
});

test('mix with parameter', () => {
  const Result = mix(class B {
    test(){
      return 'test';
    }
  }).with(paramMixin, 'param');

  const result = new Result();
  expect(result.test()).toBe('test enhanced with param');
});

function paramMixin(b : Constructor<any>, p : string){
  return class M extends b {
    test(){
      return `${super.test()} enhanced with ${p}`;
    }
  };
}