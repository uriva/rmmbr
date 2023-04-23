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
    return new Response("Not Found", { status: 404 });
  };
};
