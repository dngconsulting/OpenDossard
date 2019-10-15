create type licence_fede_enum as enum ('FSGT', 'UFOLEP', 'FFC', 'Non Licencié');

alter type licence_fede_enum owner to dossarduser;

create type competition_fede_enum as enum ('FSGT', 'UFOLEP', 'FFC', 'Non Licencié');

alter type competition_fede_enum owner to dossarduser;

create table licence
(
	id serial not null
		constraint "PK_3b4f2cda4a38b8026e4c700844c"
			primary key,
	"licenceNumber" varchar,
	name varchar,
	"firstName" varchar,
	gender varchar,
	club varchar,
	dept varchar,
	"birthYear" varchar,
	catea varchar,
	catev varchar,
	fede licence_fede_enum default 'Non Licencié'::licence_fede_enum
);

alter table licence owner to dossarduser;

create table club
(
	id serial not null
		constraint "PK_79282481e036a6e0b180afa38aa"
			primary key,
	"longName" varchar not null,
	dept varchar,
	"shortName" varchar
);

alter table club owner to dossarduser;

create table competition
(
	id serial not null
		constraint "PK_23c5c77cf9b2f87186a42c8ed11"
			primary key,
	name varchar,
	categories text not null,
	"eventDate" timestamp not null,
	fede competition_fede_enum default 'Non Licencié'::competition_fede_enum,
	"clubId" integer
		constraint "FK_6f77790f439124a20b189e5bad4"
			references club,
	"zipCode" varchar not null,
	info varchar,
	observations varchar,
	pricing text not null,
    races text not null,
    "competitionType" varchar
);

alter table competition owner to dossarduser;

create table race
(
	id serial not null
		constraint "PK_bf95180dd756fd204fb01ce4916"
			primary key,
	"raceCode" varchar not null,
	"riderNumber" integer,
    catev varchar,
	"rankingScratch" integer,
	"numberMin" integer,
	"numberMax" integer,
	surclassed boolean,
	"competitionId" integer
		constraint "FK_c2f200c86d364f440af1feda535"
			references competition,
	"licenceId" integer
		constraint "FK_093f17c2dd6b28ea95b06329f07"
			references licence
);

alter table race owner to dossarduser;

