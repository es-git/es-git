
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