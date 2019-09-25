#!/bin/sh

start() {
    docker-compose up -d
}

stop() {
    docker-compose down
}

restart() {
    stop
    start
}

clean() {
    rm -rf ./services/api/node_modules/
    rm -rf ./services/webapp/node_modules/
}

install() {
    docker-compose run --rm -v "$HOME/.npm:/root/.npm" api npm install
    docker-compose run --rm -v "$HOME/.npm:/root/.npm" webapp npm install
}

installciwebapp() {
    docker-compose run --rm -v "$HOME/.npm:/root/.npm" webapp npm ci
}

installciapi() {
    docker-compose run --rm -v "$HOME/.npm:/root/.npm" api npm ci
}

log() {
    docker logs -f $1
}

$@

