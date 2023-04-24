import {
  ConnInfo,
  Handler,
} from "https://deno.land/std@0.182.0/http/server.ts";

type MethodHandler = { POST?: Handler; GET?: Handler };

interface Router {
  [index: string]: MethodHandler;
}

export const app = (router: Router): Handler => {
  const routes: Array<[RegExp, MethodHandler]> = Object.entries(router).map(
    ([url_pattern, handler]) => [new RegExp(`^${url_pattern}$`), handler]
  );

  return (
    request: Request,
    connInfo: ConnInfo
  ): Response | Promise<Response> => {
    for (const route of routes) {
      const [pattern, methodHandler] = route;
      const pathname = new URL(request.url).pathname;
      const myMatch = pathname.match(pattern);
      if (myMatch == undefined) {
        continue;
      }
      const requestHandler =
        methodHandler[request.method as keyof MethodHandler];
      if (requestHandler == undefined) {
        continue;
      }
      return requestHandler(request, connInfo);
    }
    return Response404();
  };
};

export const Response401 = () =>
  new Response("Authentication needed", { status: 401 });

export const Response404 = () => new Response("Not Found", { status: 404 });

type RequestAuthenticator<Auth> = (
  request: Request
) => Auth | null | Promise<Auth> | Promise<null>;

export type AuthenticatedHandler<Auth> = (
  request: Request,
  auth: NonNullable<Awaited<Auth>>,
  connInfo: ConnInfo
) => Response | Promise<Response>;

export const authenticated =
  <T>(authenticator: RequestAuthenticator<T>) =>
  (handler: AuthenticatedHandler<T>): Handler =>
  async (request, conn_info) => {
    const auth = await authenticator(request);
    if (auth == null) {
      return Response401();
    }
    return await handler(request, auth, conn_info);
  };
