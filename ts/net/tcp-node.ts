"use strict";

import makeChannel from 'culvert';
import wrapHandler from '../lib/wrap-handler';
import net from 'net';
export default connect;

function connect(host, port, onError) {
  port = port|0;
  host = String(host);
  if (!port || !host) throw new TypeError("host and port are required");

  // Wrap event handlers from node stream
  onConnect = wrap(onConnect, onError);
  pump = wrap(pump, onError);
  onEnd = wrap(onEnd, onError);
  onDrain = wrap(onDrain, onError);

  // Wrap event handlers from culvert socket
  onTake = wrapHandler(onTake, onError);

  const serverChannel = makeChannel();
  const clientChannel = makeChannel();
  const socket = {
    put: serverChannel.put,
    drain: serverChannel.drain,
    take: clientChannel.take
  };

  const client = net.connect({ host: host, port: port }, onConnect);
  if (onError) client.on("error", onError);

  return {
    put: clientChannel.put,
    drain: clientChannel.drain,
    take: serverChannel.take
  };

  function onConnect() {
    socket.take(onTake);
    client.on("end", onEnd);
    client.on("readable", pump);
    client.on("drain", onDrain);
    client.on("error", onError);
  }

  function pump() {
    let chunk;
    do {
      chunk = client.read();
      if (!chunk) return;
    } while (socket.put(chunk));
    socket.drain(pump);
  }

  function onEnd() {
    socket.put();
  }

  function onTake(data) {
    if (data === undefined) {
      client.end();
    }
    else if (client.write(data)) {
      socket.take(onTake);
    }
  }

  function onDrain() {
    socket.take(onTake);
  }

}

function wrap(fn, onError) {
  return function () {
    try {
      return fn.apply(this, arguments);
    }
    catch (err) {
      onError(err);
    }
  };
}
