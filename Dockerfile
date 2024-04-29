# NOTE : We are grouping here client & server in the same container
# Setup and build the client
FROM node:18-alpine3.19 as client

WORKDIR /app/client/
COPY services/webapp/package*.json ./
RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh
RUN rm -rf ./node_modules
RUN npm install -g react-scripts
RUN npm ci
COPY services/webapp/ ./
RUN npx workbox-cli generateSW
ARG MAX_OLD_SPACE_SIZE=3048
ENV NODE_OPTIONS=--max_old_space_size=${MAX_OLD_SPACE_SIZE}
ENV GENERATE_SOURCEMAP=false
ENV TSC_COMPILE_ON_ERROR=true
ENV DISABLE_ESLINT_PLUGIN=true
RUN npm run build

# Setup the server
FROM node:18-alpine3.19

WORKDIR /app/
COPY --from=client /app/client/build/ ./client/build/

WORKDIR /app/server/
COPY services/api/package*.json ./
RUN rm -rf ./node_modules
RUN npm ci
COPY services/api/ ./
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build
ENV PORT 9090
EXPOSE 9090

