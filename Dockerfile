FROM node:15-alpine

WORKDIR /app

ADD package.json package-lock.json ./

RUN npm install

COPY ./booking-manager .

EXPOSE 3000
CMD [ "node", "index.js" ]