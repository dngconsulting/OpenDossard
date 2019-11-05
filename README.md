<img width="447" height="107" src="website/assets/images/logocolor.svg">
Open Dossard V0.1 est une application à destination d'organisateurs d'évènement sportifs.
Elle est constituée d'une API et d'un front en ReactJS.

### Installation en mode développement 

```
./od.sh install        # install dependencies
./od.sh start          # start all services
./od.sh stop           # stop all services
```

- Pour accéder à la Webapp : http://localhost:3000
- Pour accéder à l'API du Backend : http://localhost:8080/api

### Afficher les logs applicatif

```
./od.sh log api
./od.sh log webapp
```

### Base de données Postgres 

Les fichiers d'initialisation de la base (schéma + chargement initial des données) sont situés dans le répertoire `services/api/sql/init`
Il est possible de configurer la base de données manuellement ou automatiquement via :
```
./od.sh installdb
```

### Other resources

- [TS Lint configuration](documentation/tslint.md)

