
export type Hash = string;

export interface UploadRequest {
  readonly done : boolean
  readonly wants : Hash[]
  readonly shallows : Hash[]
  readonly deepens : Deepen[]
  readonly haves : Hash[]
}

export interface Deepen {
  readonly hash : Hash
  readonly depth : number
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
}

export type ClientCaps = Readonly<EditableClientCaps>;