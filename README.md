<img align="left" width="100" height="100" src="https://raw.githubusercontent.com/dngconsulting/OpenDossard/master/services/webapp/src/assets/logos/logo_150.png?token=AA5NBLWUUFCPDAER736YWAC5XQ7IC">
Open Dossard V 0.1  is structured with Services API & Front React Application

### Quick start in Dev mode

```
./od.sh install        # install dependencies
./od.sh start          # start all services
./od.sh stop           # stop all services
```

- Webapp : http://localhost:3000
- Backend api : http://localhost:8080/api

### Logs

```
./od.sh log api
./od.sh log webapp
```


### Postgres Database : 

Database can be initialised with
```
./od.sh installdb
```

IntelliJ Settings

![IntelliJ DB Settings](documentation/img/intellij-dbsettings.png)


### Other resources

- [TS Lint configuration](documentation/tslint.md)

