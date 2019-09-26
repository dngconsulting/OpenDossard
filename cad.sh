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

# usage :
#       cad installci                  # install all
#       cad installci api|webapp       # install api or webapp only
installci() {
    if [ -z "$1" ]
    then
        docker-compose run --rm -v "$HOME/.npm:/root/.npm" api npm ci
        docker-compose run --rm -v "$HOME/.npm:/root/.npm" webapp npm ci
    else
        docker-compose run --rm -v "$HOME/.npm:/root/.npm" $1 npm ci
    fi
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

