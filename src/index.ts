import {$log} from "ts-log-debug";
import {Server} from "./Server";
import "reflect-metadata";
import "reflect-metadata";
import {createConnection} from "typeorm";
import {Licence} from "./entity/Licence";

$log.debug("Start server...");
new Server().start().catch((er) => {
  $log.error(er);
});

