import {CallHandler, ExecutionContext, Logger, NestInterceptor} from '@nestjs/common';
import {Observable} from 'rxjs';

export class RlogInterceptor implements NestInterceptor {
    constructor(
        private readonly value: any,
    ) {
    }

    /**
     * Cet intercepteur est mis à titre indicatif, n'hésitez pas à le modifier
     * pour y rajouter des infos supplémentaires.
     * Il est aussi possible de passer par le concept de Middleware
     * @param context
     * @param next
     */
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        Logger.log('--------------------------------------------------------');
        Logger.log(context.switchToHttp().getRequest().method + ' ' +
            context.switchToHttp().getRequest().url);
        Logger.log('User  ' + JSON.stringify(context.switchToHttp().getRequest().user));
        Logger.log('Request Body  ' + JSON.stringify(context.switchToHttp().getRequest().body));
        Logger.log('Request Headers ' + JSON.stringify(context.switchToHttp().getRequest().headers));
        Logger.log('Response ' + JSON.stringify(context.switchToHttp().getResponse().statusCode));
        return next.handle();
    }
}
