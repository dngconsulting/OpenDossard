import {Unauthorized} from "ts-httpexceptions";
import {IMiddleware, EndpointInfo, Req, Middleware} from "@tsed/common";

@Middleware()
export class AuthenticatedMiddleware implements IMiddleware {
  public use(@Req() request: Req, @EndpointInfo() endpoint: EndpointInfo) {
    const options = endpoint.get(AuthenticatedMiddleware) || {};
    // @ts-ignore
    if (!request.isAuthenticated(options)) {
      throw new Unauthorized("Unauthorized");
    }
  }
}
