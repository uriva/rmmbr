import {
  ConnInfo,
  Handler,
} from "https://deno.land/std@0.182.0/http/server.ts";

type MethodHandler = { POST?: Handler; GET?: Handler };

interface Router {
  [index: string]: MethodHandler;
}

const appHandler =
  (routes: Array<[RegExp, MethodHandler]>) =>
  (request: Request, connInfo: ConnInfo): Response | Promise<Response> => {
    for (const [pattern, methodHandler] of routes) {
      if (!new URL(request.url).pathname.match(pattern)) {
        continue;
      }
      const requestHandler =
        methodHandler[request.method as keyof MethodHandler];
      if (!requestHandler) {
        continue;
      }
      return requestHandler(request, connInfo);
    }
    return Response404();
  };

export const app = (router: Router): Handler =>
  appHandler(
    Object.entries(router).map(([urlPattern, handler]) => [
      new RegExp(`^${urlPattern}$`),
      handler,
    ]),
  );

export const Response404 = () => new Response("Not Found", { status: 404 });

type RequestAuthenticator<Auth> = (
  request: Request,
) => Auth | null | Promise<Auth | null>;

export type AuthenticatedHandler<Auth> = (
  request: Request,
  auth: NonNullable<Awaited<Auth>>,
  connInfo: ConnInfo,
) => Response | Promise<Response>;

export const authenticated =
  <T>(
    authenticator: RequestAuthenticator<T>,
    handler: AuthenticatedHandler<T>,
  ): Handler =>
  async (request, connInfo) => {
    const auth = await authenticator(request);
    return auth
      ? await handler(request, auth, connInfo)
      : new Response("Authentication needed", { status: 401 });
  };
