import {GlobalAcceptMimesMiddleware, ServerLoader, ServerSettings} from '@tsed/common';
import '@tsed/swagger';
import '@tsed/typeorm';
import {$log} from 'ts-log-debug';
import config from './config';
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compress = require('compression');
const methodOverride = require('method-override');
const rootDir = __dirname;

@ServerSettings({
    rootDir,
    typeorm: [
        {
            type: 'postgres',
            host: config.db.host,
            port: config.db.port,
            username: config.db.username,
            password: config.db.password,
            database: config.db.database,
            synchronize: false,
            logging: true,
            entities: [
                `${__dirname}/entity/**/*.ts`,
            ],
            migrations: [
                `${__dirname}/migration/**/*.ts`,
            ],
            subscribers: [
                `${__dirname}/subscriber/**/*.ts`,
            ],
            cli: {
                entitiesDir: `${__dirname}/entity`,
                migrationsDir: `${__dirname}/migration`,
                subscribersDir: `${__dirname}/subscriber`,
            },
        },
    ],
    acceptMimes: ['application/json'],
    logger: {
        debug: true,
        logRequest: true,
        requestFields: ['reqId', 'method', 'url', 'headers', 'query', 'params', 'duration'],
    },
    swagger: {
        path: '/api-docs',
        doc : 'api-v2',
        spec : {swagger: '2.0'},
        showExplorer: true,
        operationIdFormat: '%m',
    },
    calendar: {
        token: true,
    },
    passport: {},
    mount: {
        '/api': '${rootDir}/controllers/**/*.ts', // support ts with ts-node then fallback to js
    },
    debug: true,
})
export class Server extends ServerLoader {
    /**
     * This method let you configure the middleware required by your application to works.
     * @returns {Server}
     */
    $onMountingMiddlewares(): void | Promise<any> {
        this
            .use(GlobalAcceptMimesMiddleware)
            .use(cookieParser())
            .use(compress({}))
            .use(methodOverride())
            .use(bodyParser.json())
            .use(bodyParser.urlencoded({
                extended: true,
            }))
            .use(session({
                secret: 'mysecretkey',
                resave: true,
                saveUninitialized: true,
                maxAge: 36000,
                cookie: {
                    path: '/',
                    httpOnly: true,
                    secure: false,
                    maxAge: null,
                },
            }));

        return null;
    }

    $onServerInitError(error): any {
        $log.error('Server encounter an error =>', error);
    }
}
