"use strict";

export default request;

function request(method, url, headers, body) {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url, true);
  xhr.responseType = "arraybuffer";

  Object.keys(headers).forEach(name => {
    xhr.setRequestHeader(name, headers[name]);
  });
  xhr.send(body);

  return new Promise((res, rej) => {
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;
      const resHeaders = {};
      xhr.getAllResponseHeaders().trim().split("\r\n").forEach(line => {
        const index = line.indexOf(":");
        resHeaders[line.substring(0, index).toLowerCase()] = line.substring(index + 1).trim();
      });

      res({
        statusCode: xhr.status,
        headers: resHeaders,
        body: xhr.response && new Uint8Array(xhr.response)
      });
    };
    xhr.onerror = rej;
  });
}
