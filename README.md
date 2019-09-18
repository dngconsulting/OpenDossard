# Click & Dossard
Application aimed at managing riders engagement in races

## Commands:
- `npm start`: start the app in production mode. Production code must be built for production first: `npm run build`.
- `npm run start-dev`: start the Express server in dev mode. Will activate TypeScript file-watcher 
and generate  source-maps.
- `npm run build` at _root/_ will build the app for production. Contents are output to _build/_.
- `npm test`: Run back-end unit-tests. If you want to run a specific unit test run `npm run test -- "path to the unit-test file"`, 
i.e. `npm test -- controllers/demo/ClickAndDossardController`. 
Because source-map files are generated for map files too, debugging in IDEs should still work.
