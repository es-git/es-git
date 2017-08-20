FROM node

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV production
COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/
RUN npm install --only=production && npm cache clean --force
COPY . /usr/src/app

CMD [ "npm", "start" ]

EXPOSE 8080