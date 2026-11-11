import { Request, Response } from 'express';

import { HelloAssoPaymentReturnController } from './helloasso-payment-return.controller';
import { HelloAssoPaymentReturnService } from './helloasso-payment-return.service';

function makeController() {
  const paymentReturn = { confirmFromReturnUrl: jest.fn() };
  const controller = new HelloAssoPaymentReturnController(
    paymentReturn as unknown as HelloAssoPaymentReturnService,
  );
  return { controller, paymentReturn };
}

function makeReq(originalUrl: string, query: Record<string, unknown>): Request {
  return { originalUrl, query } as unknown as Request;
}

describe('HelloAssoPaymentReturnController', () => {
  const successUrl =
    '/payment/success?paymentId=1413&checkoutIntentId=8211204&code=succeeded&orderId=197921544';
  const successQuery = {
    paymentId: '1413',
    checkoutIntentId: '8211204',
    code: 'succeeded',
    orderId: '197921544',
  };

  it('redirige vers le deep link puis lance la confirmation avec les paramètres reçus', () => {
    const m = makeController();
    // Confirmation qui ne se termine jamais : la redirection ne doit pas l'attendre.
    m.paymentReturn.confirmFromReturnUrl.mockReturnValue(new Promise(() => undefined));
    const res = { redirect: jest.fn() };

    m.controller.paymentSuccess(makeReq(successUrl, successQuery), res as unknown as Response);

    expect(res.redirect).toHaveBeenCalledWith(
      302,
      'dossardeur://payment/success?paymentId=1413&checkoutIntentId=8211204&code=succeeded&orderId=197921544',
    );
    expect(m.paymentReturn.confirmFromReturnUrl).toHaveBeenCalledWith('1413', '8211204');
  });

  it.each([
    ['paymentError', 'error'],
    ['paymentCancelled', 'cancelled'],
  ] as const)('%s redirige sans rien confirmer', (method, variant) => {
    const m = makeController();
    const res = { redirect: jest.fn() };

    m.controller[method](
      makeReq(`/payment/${variant}?paymentId=1413`, { paymentId: '1413' }),
      res as unknown as Response,
    );

    expect(res.redirect).toHaveBeenCalledWith(
      302,
      `dossardeur://payment/${variant}?paymentId=1413`,
    );
    expect(m.paymentReturn.confirmFromReturnUrl).not.toHaveBeenCalled();
  });
});
