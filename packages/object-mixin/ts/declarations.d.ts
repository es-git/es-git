declare module "git-sha1" {
  export interface Sha1 {
    update(buffer : Uint8Array | string) : void
    digest() : string
  }

  export default function sha1(buffer : Uint8Array | string) : string;
  export default function sha1() : Sha1;
}