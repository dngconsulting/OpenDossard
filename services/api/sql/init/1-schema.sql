create table licence
(
	id serial not null
		constraint "PK_3b4f2cda4a38b8026e4c700844c"
			primary key,
	licenceNumber varchar,
	nom varchar,
	prenom varchar,
	genre varchar,
	club varchar,
	dept varchar,
	age varchar,
	catea varchar,
	catev varchar,
	fede licence_fede_enum default 'Non Licencié'::licence_fede_enum
);

alter table licence owner to postgres;

create table club
(
	id serial not null
		constraint "PK_79282481e036a6e0b180afa38aa"
			primary key,
	nomLong varchar not null,
	dept varchar,
	nomCourt varchar
);

alter table club owner to postgres;

create table epreuve
(
	id serial not null
		constraint "PK_23c5c77cf9b2f87186a42c8ed11"
			primary key,
	nom varchar,
	categoriesEpreuve text not null,
	dateEpreuve timestamp not null,
	fede epreuve_fede_enum default 'Non Licencié'::epreuve_fede_enum,
	clubOrganisateurId integer
		constraint "FK_6f77790f439124a20b189e5bad4"
			references club,
	codePostal varchar not null,
	infoCircuit varchar,
	observations varchar,
	tarifs text not null
);

alter table epreuve owner to postgres;

create table course
(
	id serial not null
		constraint "PK_bf95180dd756fd204fb01ce4916"
			primary key,
	nom varchar not null,
	dossard integer,
	classementScratch integer,
	closed boolean,
	dossardCourseMin integer,
	dossardCourseMax integer,
	surclassed boolean,
	epreuveId integer
		constraint "FK_c2f200c86d364f440af1feda535"
			references epreuve,
	licenceId integer
		constraint "FK_093f17c2dd6b28ea95b06329f07"
			references licence
);

alter table course owner to postgres;

