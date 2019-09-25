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
});

export interface IConfig {
    db: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
    };
}

export default config.getProperties() as IConfig;
