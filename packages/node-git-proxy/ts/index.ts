import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

export default async function proxy(req : http.ServerRequest, res : http.ServerResponse) {
  if(!req.url) throw new Error('no url!');

  const url = new URL(`https://${req.url.substr(1)}`);

  const request : https.RequestOptions = {
    method: req.method,
    protocol: url.protocol,
    host: url.host,
    path: url.pathname+url.search,
    headers: {
      ...req.headers,
      host: url.host
    }
  };

  return new Promise((ok, oops) => req.pipe(https.request(request, response => {
    for(const header of Object.keys(response.headers)){
      res.setHeader(header, response.headers[header] as string);
    }
    res.statusCode = response.statusCode || 500;
    res.statusMessage = response.statusMessage || 'Internal Error';
    response.pipe(res)
      .on('end', ok)
      .on('error', oops);
  })).on('error', oops));
}
