declare module 'text-encoding' {
  interface TextEncoder {
    new() : TextEncoder;
    readonly encoding : string;
    encode(input? : string) : Uint8Array;
  }

  type TextDecoderOptions = {
    fatal : boolean;
    ignoreBOM : boolean;
  };

  type TextDecodeOptions = {
    stream : boolean;
  };

  interface TextDecoder
  {
    new(label? : string, options? : TextDecoderOptions) : TextDecoder;
    readonly encoding : string;
    readonly fatal : boolean;
    readonly ignoreBOM : boolean;
    decode(input? : BufferSource, options? : TextDecodeOptions) : string;
  }

  export var TextEncoder : TextEncoder;
  export var TextDecoder : TextDecoder;
}

declare module "git-sha1" {
  export interface Sha1 {
    update(buffer : Uint8Array | string) : void
    digest() : string
  }

  export default function sha1(buffer : Uint8Array | string) : string;
  export default function sha1() : Sha1;
}