create schema public;

comment on schema public is 'standard public schema';

alter schema public owner to dossarduser;

create type licence_fede_enum as enum ('FSGT', 'UFOLEP', 'FFC', 'Non Licencié');

alter type licence_fede_enum owner to dossarduser;

create type competition_fede_enum as enum ('FSGT', 'UFOLEP', 'FFC', 'Non Licencié');

alter type competition_fede_enum owner to dossarduser;

create type competition_competitiontype_enum as enum ('CX', 'ROUTE', 'VTT');

alter type competition_competitiontype_enum owner to dossarduser;

CREATE EXTENSION if not exists unaccent  ;

create table licence
(
    id serial not null
        constraint "PK_3b4f2cda4a38b8026e4c700844c"
            primary key,
    name varchar,
    gender varchar,
    club varchar,
    dept varchar,
    catea varchar,
    catev varchar,
    fede licence_fede_enum default 'Non Licencié'::licence_fede_enum,
    "licenceNumber" varchar,
    "firstName" varchar,
    "birthYear" varchar
);

alter table licence owner to dossarduser;

create index "IDX_e62e017155b8751be42561d1ed"
    on licence (name);

create index "IDX_54fa0dbc335679c550be2935f8"
    on licence ("licenceNumber");

create index "IDX_df23ce0dadd5fe1d80eb000702"
    on licence ("firstName");

create table club
(
    id serial not null
        constraint "PK_79282481e036a6e0b180afa38aa"
            primary key,
    "shortName" varchar,
    dept varchar,
    "longName" varchar not null
);

alter table club owner to dossarduser;

create index "IDX_47b6110deb68dcb4c65b42d0c7"
    on club ("shortName");

create table competition
(
    id serial not null
        constraint "PK_a52a6248db574777b226e9445bc"
            primary key,
    "eventDate" timestamp not null,
    name varchar,
    "zipCode" varchar not null,
    info varchar,
    categories text not null,
    observations varchar,
    pricing text not null,
    races text not null,
    fede competition_fede_enum default 'Non Licencié'::competition_fede_enum,
    "competitionType" competition_competitiontype_enum default 'ROUTE'::competition_competitiontype_enum,
    "clubId" integer
        constraint "FK_2fe4d4d220735b50560f03200ed"
            references club
);

alter table competition owner to dossarduser;

create index "IDX_6c79fa1990795d896fcbaa7c16"
    on competition ("eventDate");

create table race
(
    id serial not null
        constraint "PK_a3068b184130d87a20e516045bb"
            primary key,
    "raceCode" varchar,
    catev varchar,
    "riderNumber" integer,
    "rankingScratch" integer,
    "numberMin" integer,
    "numberMax" integer,
    surclassed boolean,
    comment varchar,
    sprintchallenge boolean,
    "competitionId" integer
        constraint "FK_c28e9552520c23513cf5b4aca64"
            references competition,
    "licenceId" integer
        constraint "FK_7a9a2da4692dfe862a9037b80b8"
            references licence
);

alter table race owner to dossarduser;

create index "IDX_ee6c1a4eb355bcd73b893a1f0b"
    on race ("raceCode");

