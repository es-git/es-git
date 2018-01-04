# terminal

This is part of the [ES-Git](https://github.com/es-git/es-git) project.

## Install

```bash
npm install --save @es-git/terminal
```

## Usage

```ts
import Teminal from '@es-git/terminal';

//Create a terminal, and log to the console
const terminal = new Terminal(m => console.log(m));

//log normal text
terminal.log('ready');//ready

//carriage return (\r) will reset cursor to start of line
terminal.log('\rset\r');//set

//append newline at end of line
terminal.logLine('go!!!');//go!!!

console.log(terminal.content); //go!!!

```