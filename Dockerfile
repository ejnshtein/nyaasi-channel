FROM node:16-alpine3.12

WORKDIR /app

ADD ./src ./src
ADD ./package.json ./yarn.lock ./tsconfig.json ./forever.json ./

RUN yarn --frozen-lockfile --network-timeout 100000

RUN yarn build-ts

CMD ["yarn", "start"]