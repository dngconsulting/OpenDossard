import {$log} from 'ts-log-debug';
import {Server} from './Server';
import 'reflect-metadata';

$log.debug("Start server...");
new Server().start().catch((er) => {
  $log.error(er);
});

