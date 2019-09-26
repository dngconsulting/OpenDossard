export const TEST_ACTION = 'TEST_ACTION';

export function setTest(value: string) {
    return {
        type: TEST_ACTION,
        payload: {test: value}
    }
}

