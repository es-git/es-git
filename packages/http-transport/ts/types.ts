export type Hash = string;

export interface Ref {
  readonly hash : Hash
  readonly name : string
}

export interface UploadRequest {
  readonly done : boolean
  readonly wants : Hash[]
  readonly shallows : Hash[]
  readonly depth? : number
  readonly haves : Hash[]
}

export type ServerCaps = Map<string, string | boolean>;

export interface EditableClientCaps {
  'agent' : string
  'no-progress' : boolean
  'quiet' : boolean
  'atomic' : boolean
  'side-band' : boolean
  'side-band-64k' : boolean
  'multi_ack' : boolean
  'multi_ack_detailed' : boolean
  'no-done' : boolean
  'ofs-delta' : boolean
}

export type ClientCaps = Readonly<EditableClientCaps>;

export type HasObject = (hash : string) => Promise<boolean>;
