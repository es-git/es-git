export default function defer<T>(){
  let resolve = (v? : T) => {};
  let reject = (e? : any) => {};
  return {
    promise: new Promise<T>((res, rej) => {resolve = res; reject = rej}),
    resolve,
    reject
  }
}