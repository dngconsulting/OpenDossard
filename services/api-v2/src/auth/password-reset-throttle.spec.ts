import { Logger } from '@nestjs/common';

import { parseThrottleLimit } from './password-reset-throttle';

describe('parseThrottleLimit', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('absente → 5, sans erreur', () => {
    expect(parseThrottleLimit(undefined)).toBe(5);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it.each([['1000'], [' 20 ']])('%s → valeur lue', raw => {
    expect(parseThrottleLimit(raw)).toBe(Number(raw.trim()));
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it.each([[''], ['abc'], ['0'], ['-3'], ['2.5'], ['99999999999999999999']])(
    '%s → erreur loguée et repli sur 5, sans throw',
    raw => {
      expect(parseThrottleLimit(raw)).toBe(5);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(String((errorSpy.mock.calls as unknown[][])[0][0])).toContain(
        'PASSWORD_RESET_THROTTLE_LIMIT invalide',
      );
    },
  );
});
