
export type Constructor<T> = new(...args: any[]) => T;

export interface ConstructorWith<T> {
  new(...args: any[]) : T;
  with<T2>(mixin : Mixin<T, T2>) : ConstructorWith<T & T2>
  with<T2, TParam>(mixin : MixinWithParam<T, T2, TParam>, param : TParam) : ConstructorWith<T & T2>
};

export type Mixin<T1, T2> = (base : Constructor<T1>) => Constructor<T2> & Constructor<T1>;
export type MixinWithParam<T1, T2, TParam> = (base : Constructor<T1>, param : TParam) => Constructor<T2> & Constructor<T1>;

export default function mix<T>(base : Constructor<T>){
  const baseWith = base as ConstructorWith<T>;

  function mixWith<TWith>(mixin : Mixin<T, TWith>) : ConstructorWith<T & TWith>
  function mixWith<TWith, TParam>(mixin : MixinWithParam<T, TWith, TParam>, param : TParam) : ConstructorWith<T & TWith>
  function mixWith<TWith, TParam>(mixin : any, param? : TParam) : ConstructorWith<T & TWith> {
    if(param){
      return mix<T & TWith>(mixin(base, param));
    }else{
      return mix<T & TWith>(mixin(base));
    }
  }

  baseWith.with = mixWith;

  return baseWith;
}
