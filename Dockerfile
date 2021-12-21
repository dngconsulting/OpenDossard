# NOTE : We are grouping here client & server in the same container
# Setup and build the client
FROM node:14-alpine as client

WORKDIR /app/client/
COPY services/webapp/package*.json ./
RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh
RUN rm -rf ./node_modules
RUN npm install -g react-scripts
RUN npm install
RUN npm install workbox-cli --global
COPY services/webapp/ ./
RUN npx workbox generateSW
ARG MAX_OLD_SPACE_SIZE=8192
ENV NODE_OPTIONS=--max_old_space_size=${MAX_OLD_SPACE_SIZE}
RUN npm run build

# Setup the server
FROM node:14-alpine

WORKDIR /app/
COPY --from=client /app/client/build/ ./client/build/

WORKDIR /app/server/
COPY services/api/package*.json ./
RUN rm -rf ./node_modules
RUN npm install
COPY services/api/ ./
RUN npm run build
ENV PORT 9090
EXPOSE 9090

