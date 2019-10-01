
const util = require('util');
const sleep = util.promisify(setTimeout);

interface IOptions {
    remaining: number;
    delay: number;
    callback: () => Promise<any>;
}

export const retry = async (options: IOptions) => {
    try {
        return await options.callback();
    } catch (e) {
        if (options.remaining === 0) {
            throw e;
        }
        await sleep(options.delay);
        options.remaining = options.remaining - 1 ;
        await retry(options);
    }
};
