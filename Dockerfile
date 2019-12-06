# NOTE : We are grouping here client & server in the same container
# Setup and build the client
FROM node:10.12.0-alpine as client

WORKDIR /app/client/
COPY services/webapp/package*.json ./
RUN rm -rf ./node_modules
RUN npm install -g react-scripts
RUN npm ci
COPY services/webapp/ ./
RUN npm run build

# Setup the server
FROM node:10.12.0-alpine

WORKDIR /app/
COPY --from=client /app/client/build/ ./client/build/

WORKDIR /app/server/
COPY services/api/package*.json ./
RUN rm -rf ./node_modules
RUN npm ci
COPY services/api/ ./
RUN npm run build
ENV PORT 9090
EXPOSE 9090

