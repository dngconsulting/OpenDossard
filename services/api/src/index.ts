import {$log} from 'ts-log-debug';
import {Server} from './Server';
import 'reflect-metadata';
import {createConnection} from 'typeorm';

const init = async () => {
  try {
    $log.info('Start createConnection...');
    await createConnection();
    $log.info('Start server...');
    await new Server().start();
  } catch (e) {
    $log.error( e );
    process.exit(1);
  }
};

init();
