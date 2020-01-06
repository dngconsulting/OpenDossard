create table race
(
    id               serial not null
        constraint "PK_a3068b184130d87a20e516045bb"
            primary key,
    "raceCode"       varchar,
    catev            varchar,
    "riderNumber"    integer,
    "rankingScratch" integer,
    "numberMin"      integer,
    "numberMax"      integer,
    surclassed       boolean,
    comment          varchar,
    sprintchallenge  boolean,
    "competitionId"  integer
        constraint "FK_c28e9552520c23513cf5b4aca64"
            references competition,
    "licenceId"      integer
        constraint "FK_7a9a2da4692dfe862a9037b80b8"
            references licence
);

alter table race
    owner to dossarduser;

create index "IDX_ee6c1a4eb355bcd73b893a1f0b"
    on race ("raceCode");

INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (27, '4/5', '4', 7, 1, null, null, null, null, true, 37, 28);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (26, '4/5', '4', 6, null, null, null, null, null, true, 37, 20);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (24, '4/5', '4', 2, 2, null, null, null, null, true, 37, 500);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (25, '4/5', '5', 44, 3, null, null, null, null, true, 37, 218);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (43, '1/2/3', '2', 1, null, null, null, null, null, null, 1, 4651);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (44, '1/2/3', '2', 1, null, null, null, null, null, null, 28, 10075);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (1, '1/2/3', '1', 1, 1, null, null, null, null, null, 37, 8404);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (14, '1/2/3', '1', 21, null, null, null, null, null, null, 7, 2495);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (15, '1/2/3', '2', 2, null, null, null, null, null, null, 27, 2495);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (16, '1/2/3', '5', 23, null, null, null, null, null, null, 27, 1114);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (17, '1/2/3', '3', 12, null, null, null, null, null, null, 29, 2495);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (18, '1/2/3', 'M', 3, null, null, null, null, null, null, 29, 10075);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (19, '1/2/3', '2', 13, null, null, null, null, null, null, 29, 1613);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (13, '1/2/3', '2', 13, null, null, null, null, null, null, 37, 1063);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (12, '1/2/3', '2', 12, null, null, null, null, null, null, 37, 1217);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (9, '1/2/3', '2', 9, null, null, null, null, 'ABD', null, 37, 1034);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (10, '1/2/3', '2', 10, null, null, null, null, 'DSQ', null, 37, 1048);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (20, '1/2/3', '1', 12, null, null, null, null, null, null, 5, 2495);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (21, '1/2/3', '2', 34, null, null, null, null, null, null, 5, 1074);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (22, '1/2/3', 'F', 12, null, null, null, null, null, null, 3, 10075);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (23, '1/2/3', '1', 2, null, null, null, null, null, null, 37, 6421);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (28, '4/5', '4', 222, null, null, null, null, null, null, 37, 31);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (29, '4/5', '4', 777, null, null, null, null, null, null, 37, 22);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (30, '1/2/3', '2', 4, null, null, null, null, null, null, 4, 258);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (31, '1/2/3', '3', 8, null, null, null, null, null, null, 4, 220);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (32, '1/2/3', '2', 7, null, null, null, null, null, null, 4, 14);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (33, '1/2/3', '4', 1, null, null, null, null, null, null, 4, 10);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (34, '1/2/3', '2', 454, null, null, null, null, null, null, 4, 1369);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (35, '1/2/3', '2', 5, null, null, null, null, null, null, 4, 1251);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (36, '1/2/3', '3', 33, null, null, null, null, null, null, 4, 1120);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (37, '1/2/3', '2', 2, null, null, null, null, null, null, 4, 1080);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (58, '1/2/3', '2', 3, null, null, null, null, null, null, 11, 2495);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (60, '1/2/3', '2', 44, null, null, null, null, null, null, 11, 1071);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (61, '1/2/3', '2', 46, null, null, null, null, null, null, 11, 3590);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (62, '1/2/3', '2', 5, null, null, null, null, null, null, 11, 4651);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (63, '1/2/3', '2', 3, null, null, null, null, null, null, 30, 3590);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (64, '1/2/3', '2', 4, null, null, null, null, null, null, 30, 1369);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (65, '1/2/3', '2', 4, 4, null, null, null, null, null, 29, 6781);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (66, '1/2/3', '2', 1, 1, null, null, null, null, null, 23, 4999);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (67, '1/2/3', '2', 2, 2, null, null, null, null, null, 23, 3590);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (68, '1/2/3', '2', 3, 3, null, null, null, null, null, 23, 10075);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (69, '1/2/3', '2', 4, 4, null, null, null, null, null, 23, 13840);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (39, '1/2/3', 'F', 2, null, null, null, null, null, null, 35, 10075);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (70, '4', '2', 2, null, null, null, null, null, null, 32, 10075);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (71, '4', '2', 22, null, null, null, null, null, null, 32, 3590);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (72, '4', '2', 21, null, null, null, null, null, null, 32, 1412);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (73, '1/2/3', '2', 1, 1, null, null, null, null, null, 24, 10075);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (74, '1/2/3', '2', 2, 2, null, null, null, null, null, 24, 13840);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (76, '1/2/3', '2', 3, 3, null, null, null, null, null, 24, 2495);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (6, '1/2/3', '2', 6, 2, null, null, null, null, null, 37, 2495);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (7, '1/2/3', '2', 7, 3, null, null, null, null, null, 37, 4651);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (8, '1/2/3', '2', 8, 4, null, null, null, null, null, 37, 4999);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (5, '1/2/3', '2', 5, 5, null, null, null, null, null, 37, 1074);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (11, '1/2/3', '2', 11, 6, null, null, null, null, true, 37, 1071);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (3, '1/2/3', '3', 3, 7, null, null, null, null, null, 37, 10075);
INSERT INTO public.race (id, "raceCode", catev, "riderNumber", "rankingScratch", "numberMin", "numberMax", surclassed, comment, sprintchallenge, "competitionId", "licenceId") VALUES (4, '1/2/3', '2', 4, 8, null, null, null, null, null, 37, 13840);