import test from 'ava';

import mix, { Constructor } from './index';

test('mix', t => {
  const Result = mix(class B {
    test(){
      return 'test';
    }
  }).with(b => class M extends b {
    test(){
      return `${super.test()} enhanced`;
    }
  });

  const result = new Result();
  t.is(result.test(), 'test enhanced');
});

test('mix with parameter', t => {
  const Result = mix(class B {
    test(){
      return 'test';
    }
  }).with(paramMixin, 'param');

  const result = new Result();
  t.is(result.test(), 'test enhanced with param');
});

function paramMixin(b : Constructor<any>, p : string){
  return class M extends b {
    test(){
      return `${super.test()} enhanced with ${p}`;
    }
  };
}