# terminal

This is part of the [ES-Git](https://github.com/es-git/es-git) project.

## Install

```bash
npm install --save @es-git/terminal
```

## Usage

```ts
import Teminal from '@es-git/terminal';

const terminal = new Terminal();

terminal.log('ready');
terminal.content;//ready
terminal.log('\rset\r');
terminal.content;//set
terminal.log('go!!!');
terminal.content;//go!!!
``