type Handler = (request: Request) => Response | Promise<Response>;

type MethodHandler = Record<string, Handler>;

type Route = [string, MethodHandler];

const matchHandler =
  ({ url, method }: Request) => ([pattern, methodHandler]: Route) =>
    new URL(url).pathname.match(new RegExp(`^${pattern}$`)) &&
    method in methodHandler;

export const app =
  (routes: Record<string, MethodHandler>) =>
  (request: Request): Response | Promise<Response> => {
    const matched = Object.entries(routes).find(matchHandler(request));
    return matched
      ? (matched[1][request.method])(request)
      : Response404();
  };

export const Response404 = () => new Response("Not Found", { status: 404 });
const badAuth = () => new Response("Authentication needed", { status: 401 });

type RequestAuthenticator<T> = (token: string) => T | null | Promise<T | null>;

export type AuthenticatedHandler<T> = (
  request: Request,
  auth: NonNullable<Awaited<T>>,
) => Response | Promise<Response>;

const getBearer = (request: Request) =>
  request.headers.get("Authorization")?.split("Bearer ")[1];

export const authenticated = <T>(
  authenticator: RequestAuthenticator<T>,
  handler: AuthenticatedHandler<T>,
): Handler =>
async (request) => {
  const token = getBearer(request);
  if (!token) return badAuth();
  const auth = await authenticator(token);
  return auth ? await handler(request, auth) : badAuth();
};
