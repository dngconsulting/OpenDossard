ClickAndDossard repository is composed by :
- services API
- Front React Application

### Quick start

```
./cad.sh install        # install dependencies
./cad.sh start          # start all services
./cad.sh stop           # stop all services
```

- Webapp : http://localhost:3000
- Backend api : http://localhost:8080/api-docs

### logs

```
./cad.sh log api
./cad.sh log webapp
```


### Postgres Database : 

IntelliJ Settings

![IntelliJ DB Settings](documentation/img/intellij-dbsettings.png)

DB Init files are located in /sql/init/1-schema.sql for the db shema creation
Please run the other files in the right order 2-club.sql followed by 3-licence.sql and so forth

### Other resources

- [TS Lint configuration](documentation/tslint.md)

