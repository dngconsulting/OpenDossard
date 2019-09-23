#!/bin/sh

start() {
    docker-compose up -d
}

stop() {
    docker-compose down
}

clean() {
    rm -rf ./services/api/node_modules/
    rm -rf ./services/webapp/node_modules/
}

install() {
    docker-compose run --rm -v "$HOME/.npm:/root/.npm" api npm install
    docker-compose run --rm -v "$HOME/.npm:/root/.npm" webapp npm install
}

installci() {
    docker-compose run --rm -v "$HOME/.npm:/root/.npm" api npm ci
    docker-compose run --rm -v "$HOME/.npm:/root/.npm" webapp npm ci
}

log() {
    docker logs -f $1
}

$@

