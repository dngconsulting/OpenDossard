import * as convict from 'convict';

const config = convict({
    db: {
        host: {
            default: 'dossarddb',
            doc: 'Database host',
            env: 'POSTGRES_HOST',
            format: String,
        },
        port: {
            default: 5432,
            doc: 'Database port',
            env: 'POSTGRES_PORT',
            format: Number,
        },
        username: {
            default: 'dossarduser',
            doc: 'Database user',
            env: 'POSTGRES_USER',
            format: String,
        },
        password: {
            default: '#####',
            doc: 'Database password',
            env: 'POSTGRES_PASSWORD',
            format: String,
        },
        database: {
            default: 'dossarddb',
            doc: 'Database schema',
            env: 'POSTGRES_DB',
            format: String,
        },
    },
    app: {
        jwtSecret: {
            default: 'jwtSecret',
            doc: 'Secret JWT',
            env: 'JWT_SECRET',
            format: String,
        },
        jwtExpires: {
            default: '360000',
            doc: 'Toke Expiration time',
            env: 'JWT_EXPIRE_SECONDS',
            format: String,
        },
        env: {
            default: 'dev',
            doc: 'environment',
            env: 'ENV',
            format: String,
        },
    },
});

export interface IConfig {
    db: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
    };
    app: {
        jwtSecret: string;
        jwtExpires: string;
        env: string;
    };
}

export default config.getProperties() as IConfig;
