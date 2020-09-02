INSERT INTO "user" (id,first_name,last_name,"password",email,roles,phone) VALUES (1,'Admin','ADMIN','$2y$12$U3TVC0ujYMJlM8X8imF6ZuheX.0HN1StSzkwqXskHa0XwPDQnUvtS','admin@opendossard.com','ADMIN',NULL);
INSERT INTO "user" (id,first_name,last_name,"password",email,roles,phone) VALUES (2,'Orga','ORGA','$2y$12$5P7/.3FOZ7xz9LjM4zN6KuFrITvNqP5o0PEvpvQ57LLvc3ra2J01q','orga@opendossard.com','ORGANISATEUR',NULL);
INSERT INTO "user" (id,first_name,last_name,"password",email,roles,phone) VALUES (3,'Mobile','MOBILE','$2y$12$V/Cnbycqan/VNAvTj7lbmus23zThKL4mBSZW8c4GtmZnuT8pLbD56','mobile@mobile.com','MOBILE',NULL);
SELECT setval('user_id_seq', (SELECT MAX(id) from "user"));
;
