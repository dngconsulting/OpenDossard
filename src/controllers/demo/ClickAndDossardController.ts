/**
 * Demo Controller file.
 *
 * created by Sean Maxwell Jan 21, 2019
 */

import { OK, BAD_REQUEST } from 'http-status-codes';
import { Controller, Get } from '@overnightjs/core';
import { Logger } from '@overnightjs/logger';
import { Request, Response } from 'express';

@Controller('api/say-hello')
class ClickAndDossardController {
    public static readonly SUCCESS_MSG = 'Salut ';

    @Get(':name')
    private sayHello(req: Request, res: Response) {
        try {
            const { name } = req.params;
            if (name === 'make_it_fail') {
                throw Error('User triggered failure');
            }
            Logger.Info(ClickAndDossardController.SUCCESS_MSG  + name);
            return res.status(OK).json({
                message: ClickAndDossardController.SUCCESS_MSG + name,
            });
        } catch (err) {
            Logger.Err(err, true);
            return res.status(BAD_REQUEST).json({
                error: err.message,
            });
        }
    }
}

export default ClickAndDossardController;
