import {$log} from 'ts-log-debug';
import {Server} from './Server';
import 'reflect-metadata';
import {createConnection} from 'typeorm';
import {retry} from './util/retry';

/**
 * Setup connection with a retry (if database container starts after self container)
 */
const setupConnection = async () => {
  await retry({
    remaining: 10, delay: 2000, callback: async () => {
      $log.info('Start createConnection...');
      await createConnection();
    },
  }) ;
}

const init = async () => {
  try {
    await setupConnection();
    $log.info('Start server...');
    await new Server().start();
  } catch (e) {
    $log.error( e );
    process.exit(1);
  }
};

init();
