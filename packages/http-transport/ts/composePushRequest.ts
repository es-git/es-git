import pktLine from './pkt-line';

export interface CreateCommand {
  readonly type : 'create'
  readonly ref : string
  readonly hash : string
}

export interface DeleteCommand {
  readonly type : 'delete'
  readonly ref : string
  readonly hash : string
}

export interface UpdateCommand {
  readonly type : 'update'
  readonly ref : string
  readonly oldHash : string
  readonly newHash : string
}

export type Command =
  CreateCommand |
  DeleteCommand |
  UpdateCommand;

export default function *composePushRequest(packfile : Uint8Array, commands : Command[]){
  const [command, ...remainingCommands] = commands;
  yield pktLine(encodeCommand(command) + '\0 report-status side-band-64k agent=es-git');

  for(const command of remainingCommands){
    yield pktLine(encodeCommand(command));
  }

  yield pktLine(null);

  yield packfile;
}

export function encodeCommand(command : Command){
  switch(command.type){
    case 'create':
      return `0000000000000000000000000000000000000000 ${command.hash} ${command.ref}`;
    case 'delete':
      return `${command.hash} 0000000000000000000000000000000000000000 ${command.ref}`;
    case 'update':
      return `${command.oldHash} ${command.newHash} ${command.ref}`;
    default:
      throw new Error(`Unknown command`);
  }
}