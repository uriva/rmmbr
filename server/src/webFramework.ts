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
const badAuth = new Response("Authentication needed", { status: 401 });

type RequestAuthenticator<T> = (token: string) => T | null | Promise<T | null>;

export type AuthenticatedHandler<T> = (
  request: Request,
  auth: NonNullable<Awaited<T>>,
  connInfo: ConnInfo,
) => Response | Promise<Response>;

const getBearer = (request: Request) =>
  request.headers.get("Authorization")?.split("Bearer ")[1];

export const authenticated = <T>(
  authenticator: RequestAuthenticator<T>,
  handler: AuthenticatedHandler<T>,
): Handler =>
async (request, connInfo) => {
  const token = getBearer(request);
  if (!token) return badAuth;
  const auth = await authenticator(token);
  return auth ? await handler(request, auth, connInfo) : badAuth;
};
