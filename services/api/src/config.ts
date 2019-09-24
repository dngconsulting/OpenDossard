import * as convict from 'convict';

const config = convict({
    server: {
            default: 'Server initialized',
            env: 'SERVER_READY',
            format: String,
    },
});

export interface Iconfig {
    server: string;
}

export default config.getProperties() as Iconfig;
