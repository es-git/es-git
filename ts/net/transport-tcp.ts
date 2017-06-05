"use strict";

import makeChannel from 'culvert';
import bodec from 'bodec';
import pktLine from '../lib/pkt-line';
import wrapHandler from '../lib/wrap-handler';

export default function (connect) {

  return function tcpTransport(path, host, port) {
    port = (port|0) || 9418;
    if (!path || !host) throw new Error("path and host are required");

    return (serviceName, onError) => {

      onData = wrapHandler(onData, onError);
      onDrain = wrapHandler(onDrain, onError);

      const socket = connect(host, port, onError);
      const inter = makeChannel();
      inter.put = pktLine.deframer(inter.put);

      socket.put = pktLine.framer(socket.put);
      const greeting = bodec.fromRaw(serviceName + " " + path + "\0host=" + host + "\0");
      socket.put(greeting);

      // Pipe socket to inter with backpressure
      socket.take(onData);
      function onData(chunk) {
        if (inter.put(chunk)) {
          socket.take(onData);
        }
        else {
          inter.drain(onDrain);
        }
      }
      function onDrain() {
        socket.take(onData);
      }

      return {
        put: socket.put,
        drain: socket.drain,
        take: inter.take
      };
    };
  };
};
