"use strict";

import makeChannel from 'culvert';
import wrapHandler from '../lib/wrap-handler';
import bodec from 'bodec';
export default fetchPack;

function fetchPack(transport, onError) {

  if (!onError) onError = throwIt;

  // Wrap our handler functions to route errors properly.
  onRef = wrapHandler(onRef, onError);
  onWant = wrapHandler(onWant, onError);
  onNak = wrapHandler(onNak, onError);
  onMore = wrapHandler(onMore, onError);
  onReady = wrapHandler(onReady, onError);

  let caps = null;
  let capsSent = false;
  const refs = {};
  const haves = {};
  let havesCount = 0;

  // Create a duplex channel for talking with the agent.
  const libraryChannel = makeChannel();
  const agentChannel = makeChannel();
  const api = {
    put: libraryChannel.put,
    drain: libraryChannel.drain,
    take: agentChannel.take
  };

  // Start the connection and listen for the response.
  const socket = transport("git-upload-pack", onError);
  socket.take(onRef);

  // Return the other half of the duplex API channel.
  return {
    put: agentChannel.put,
    drain: agentChannel.drain,
    take: libraryChannel.take
  };

  function onRef(line) {
    if (line === undefined) {
      throw new Error("Socket disconnected");
    }
    if (line === null) {
      api.put(refs);
      api.take(onWant);
      return;
    }
    else if (!caps) {
      caps = {};
      Object.defineProperty(refs, "caps", {value: caps});
      Object.defineProperty(refs, "shallows", {value:[]});
      const index = line.indexOf("\0");
      if (index >= 0) {
        line.substring(index + 1).split(" ").forEach(cap => {
          const i = cap.indexOf("=");
          if (i >= 0) {
            caps[cap.substring(0, i)] = cap.substring(i + 1);
          }
          else {
            caps[cap] = true;
          }
        });
        line = line.substring(0, index);
      }
    }
    const match = line.match(/(^[0-9a-f]{40}) (.*)$/);
    if (!match) {
      if (typeof line === "string" && /^ERR/i.test(line)) {
        throw new Error(line);
      }
      throw new Error("Invalid line: " + JSON.stringify(line));
    }
    refs[match[2]] = match[1];
    socket.take(onRef);
  }

  let packChannel;
  let progressChannel;
  let errorChannel;

  function onWant(line) {
    if (line === undefined) return socket.put();
    if (line === null) {
      socket.put(null);
      return api.take(onWant);
    }
    if (line.deepen) {
      socket.put("deepen " + line.deepen + "\n");
      return api.take(onWant);
    }
    if (line.have) {
      haves[line.have] = true;
      havesCount++;
      socket.put("have " + line.have + "\n");
      return api.take(onWant);
    }
    if (line.want) {
      let extra = "";
      if (!capsSent) {
        capsSent = true;
        if (caps["ofs-delta"]) extra += " ofs-delta";
        if (caps["thin-pack"]) extra += " thin-pack";
        // if (caps["multi_ack_detailed"]) extra += " multi_ack_detailed";
        // else if (caps["multi_ack"]) extra +=" multi_ack";
        if (caps["side-band-64k"]) extra += " side-band-64k";
        else if (caps["side-band"]) extra += " side-band";
        // if (caps["agent"]) extra += " agent=" + agent;
        if (caps.agent) extra += " agent=" + caps.agent;
      }
      extra += "\n";
      socket.put("want " + line.want + extra);
      return api.take(onWant);
    }
    if (line.done) {
      socket.put("done\n");
      return socket.take(onNak);
    }
    throw new Error("Invalid have/want command");
  }

  function onNak(line) {
    if (line === undefined) return api.put();
    if (line === null) return socket.take(onNak);
    if (bodec.isBinary(line) || line.progress || line.error) {
      packChannel = makeChannel();
      progressChannel = makeChannel();
      errorChannel = makeChannel();
      api.put({
        pack: { take: packChannel.take },
        progress: { take: progressChannel.take },
        error: { take: errorChannel.take },
      });
      return onMore(null, line);
    }
    let match = line.match(/^shallow ([0-9a-f]{40})$/);
    if (match) {
      refs.shallows.push(match[1]);
      return socket.take(onNak);
    }
    match = line.match(/^ACK ([0-9a-f]{40})$/);
    if (match) {
      return socket.take(onNak);
    }
    if (line === "NAK") {
      return socket.take(onNak);
    }
    throw new Error("Expected NAK, but got " + JSON.stringify(line));
  }

  function onMore(line) {

    if (line === undefined) {
      packChannel.put();
      progressChannel.put();
      errorChannel.put();
      return api.put();
    }
    if (line === null) {
      api.put(line);
    }
    else {
      if (line.progress) {
        progressChannel.put(line.progress);
      }
      else if (line.error) {
        errorChannel.put(line.error);
      }
      else {
        if (!packChannel.put(line)) {
          return packChannel.drain(onReady);
        }
      }
    }
    socket.take(onMore);
  }

  function onReady() {
    socket.take(onMore);
  }

}

import defer from 'js-git/lib/defer';
function throwIt(err) {
  defer(() => {
    throw err;
  });
  // throw err;
}
