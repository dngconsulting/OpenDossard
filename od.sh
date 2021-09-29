#!/bin/sh

goprod() {
    git pull
    docker-compose -f docker-compose.prod.yml down --remove-orphans
    docker-compose -f docker-compose.prod.yml build --no-cache --force-rm --parallel
    docker-compose -f docker-compose.prod.yml up --force-recreate --remove-orphans
}

start() {
    docker-compose up --remove-orphans -d
}

stop() {
    docker-compose down --remove-orphans
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
#       od installci                  # install all
#       od installci api|webapp       # install api or webapp only
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

dropdb() {
    read -r -d '' GENQUERY << EOM
    select 'drop table if exists "' || tablename || '" cascade;'
    from pg_tables
    where schemaname = 'public';
EOM

    DROPQUERY=$(docker exec dossarddb psql -U dossarduser dossarddb -t -c "$GENQUERY")
    docker exec dossarddb psql -U dossarduser dossarddb -c "$DROPQUERY"

    read -r -d '' GENQUERY << EOM
select distinct 'DROP TYPE "' || t.typname || '";'as enum_name
from pg_type t
   join pg_enum e on t.oid = e.enumtypid
   join pg_catalog.pg_namespace n ON n.oid = t.typnamespace
EOM

    DROPQUERY=$(docker exec dossarddb psql -U dossarduser dossarddb -t -c "$GENQUERY")
    docker exec dossarddb psql -U dossarduser dossarddb -c "$DROPQUERY"
}

installdb() {
    dropdb
    cat services/api/sql/init/* > services/api/sql/init/all.sql
    docker cp services/api/sql/init/all.sql dossarddb:/all.sql
    docker exec dossarddb psql -U dossarduser dossarddb -f '/all.sql'
    rm services/api/sql/init/all.sql
}

buildsdk() {
    cd services/webapp/sdk && . ./build.sh
}

$@

