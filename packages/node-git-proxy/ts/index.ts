import * as http from 'http';
import * as https from 'https';


export default async function proxy(req : http.ClientRequest, res : http.ServerResponse) {
  const request : https.RequestOptions = {
    method: req.method,
    protocol: 'https',
    host: req.host,
    path: req.path,
    headers: {
      ...req.getHeaders(),
      host: req.host
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
