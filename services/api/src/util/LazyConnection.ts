import {createConnection, getConnection as originalGetConnection} from 'typeorm';

let pool = null ;

/**
 * Initialize connection pool lazily
 */
export const getConnection = async () => {
    if (pool == null) {
        pool = await createConnection();
    }
    return originalGetConnection();
};

