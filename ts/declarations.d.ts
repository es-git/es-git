declare module "bodec" {

  const Binary : Uint8ArrayConstructor

  export function create(length : number) : Uint8Array
  export function copy(from : Uint8Array, to : Uint8Array, offset : number) : void
  export function isBinary(value : any) : value is Uint8Array
  export function encodeUtf8(unicode : string) : string
  export function decodeHex(hex : string) : string
  export function toHex(value : Uint8Array, start? : number, end? : number) : string
  export function fromHex(value : string) : Uint8Array
  export function toUnicode(value : Uint8Array, start? : number, end? : number) : string
  export function fromRaw(raw : string, binary? : Uint8Array, offset? : number) : Uint8Array
  export function toRaw(value : Uint8Array, start? : number, end? : number) : string
  export function fromUnicode(unicode : string, binary? : Uint8Array, offset? : number) : Uint8Array
  export function join(chunks : Uint8Array[]) : Uint8Array
  export function slice(buffer : Uint8Array, start? : number, end? : number) : Uint8Array
  export function fromArray(array : number[], binary? : Uint8Array, offset? : number) : Uint8Array
  export function subarray(binary : Uint8Array, i : number) : Uint8Array
  export {Binary}
}

declare type Constructor<T> = new(...args: any[]) => T;

declare interface Array<T> {
    filter<U extends T>(pred: (a: T, i : number, e : Array<T>) => a is U): U[];
}

declare module "git-sha1" {
  export interface Sha1 {
    update(chunk : Uint8Array) : void
    digest() : string
  }

  export default function sha1() : Sha1;
  export default function sha1(raw : Uint8Array) : string;
}