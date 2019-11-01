
# Open Dossard

### Database

Open Dossard codebase uses [Typeorm](http://typeorm.io/) with a Postgres database.

### Docker 

- Db schema is installed automatically thru Docker Compose and `od.sh`
- Init data is located in `sql/init` folder

----------

## Start API

- After typing `od.sh start` the API is available online on port 3000 in dev mode 
- Test api with `http://localhost:3000/api/` in your favourite browser

----------

## Authentication
 
This applications uses Passport to handle authentication with a basic Http Session cookie.  

----------
 
## Swagger API docs

This example repo uses the NestJS swagger module for API documentation. [NestJS Swagger](https://github.com/nestjs/swagger) - [www.swagger.io](https://swagger.io/)        
