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
