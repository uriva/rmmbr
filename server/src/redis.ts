import { Buffer } from "node:buffer";
import net from "node:net";

const encodeCommand = (args: (string | number)[]): Buffer => {
  const parts: Buffer[] = [Buffer.from(`*${args.length}\r\n`, "utf8")];
  for (const arg of args) {
    const b = Buffer.from(String(arg), "utf8");
    parts.push(
      Buffer.from(`$${b.length}\r\n`, "utf8"),
      b,
      Buffer.from("\r\n", "utf8"),
    );
  }
  return Buffer.concat(parts);
};

const parseResp = (
  buf: Buffer,
  offset = 0,
  // deno-lint-ignore no-explicit-any
): { value: any; nextOffset: number } | null => {
  if (offset >= buf.length) return null;
  const lineEnd = buf.indexOf("\r\n", offset);
  if (lineEnd === -1) return null;
  const type = buf[offset];
  const header = buf.subarray(offset + 1, lineEnd).toString("utf8");
  const nextLine = lineEnd + 2;
  if (type === 43) return { value: header, nextOffset: nextLine };
  if (type === 45) return { value: new Error(header), nextOffset: nextLine };
  if (type === 58) return { value: Number(header), nextOffset: nextLine };
  if (type === 36) {
    const len = Number(header);
    if (len === -1) return { value: null, nextOffset: nextLine };
    const end = nextLine + len;
    if (buf.length < end + 2) return null;
    return {
      value: buf.subarray(nextLine, end).toString("utf8"),
      nextOffset: end + 2,
    };
  }
  if (type === 42) {
    const count = Number(header);
    if (count === -1) return { value: null, nextOffset: nextLine };
    // deno-lint-ignore no-explicit-any
    const items: any[] = [];
    let cur = nextLine;
    for (let i = 0; i < count; i++) {
      const parsed = parseResp(buf, cur);
      if (!parsed) return null;
      items.push(parsed.value);
      cur = parsed.nextOffset;
    }
    return { value: items, nextOffset: cur };
  }
  throw new Error(`Unknown RESP byte: ${type}`);
};

// deno-lint-ignore no-explicit-any
const execRedis = (commands: (string | number)[][]): Promise<any[]> =>
  new Promise((resolve, reject) => {
    const host = Deno.env.get("REDIS_URL") || "127.0.0.1";
    const port = Number(Deno.env.get("REDIS_PORT") || 6379);
    const password = Deno.env.get("REDIS_PASSWORD");
    const allCommands: (string | number)[][] = [
      ...(password ? [["AUTH", password]] : []),
      ...commands,
    ];
    const expectedCount = allCommands.length;
    const payload = Buffer.concat([
      ...allCommands.map(encodeCommand),
      encodeCommand(["QUIT"]),
    ]);
    const socket = net.connect(port, host);
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error("Redis connection timed out"));
    }, 10000);
    let recvBuf = Buffer.alloc(0);
    const tryParse = () => {
      // deno-lint-ignore no-explicit-any
      const results: any[] = [];
      let offset = 0;
      while (results.length < expectedCount) {
        const parsed = parseResp(recvBuf, offset);
        if (!parsed) return;
        if (parsed.value instanceof Error) {
          clearTimeout(timeout);
          socket.destroy();
          reject(parsed.value);
          return;
        }
        results.push(parsed.value);
        offset = parsed.nextOffset;
      }
      clearTimeout(timeout);
      socket.destroy();
      resolve(password ? results.slice(1) : results);
    };
    socket.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    socket.once("connect", () => {
      socket.write(payload);
    });
    socket.on("data", (chunk: Buffer) => {
      recvBuf = Buffer.concat([recvBuf, Buffer.from(chunk)]);
      tryParse();
    });
  });

export const redisClient = {
  get: (key: string): Promise<string | null> =>
    execRedis([["GET", key]]).then((r) => r[0] ?? null),
  set: (
    key: string,
    value: string,
    opts?: { ex?: number },
  ): Promise<string> =>
    execRedis([
      opts?.ex ? ["SET", key, value, "EX", opts.ex] : ["SET", key, value],
    ]).then((r) => r[0]),
  del: (key: string): Promise<number> =>
    execRedis([["DEL", key]]).then((r) => Number(r[0] ?? 0)),
  mget: (...keys: string[]): Promise<(string | null)[]> =>
    keys.length === 0
      ? Promise.resolve([])
      : execRedis([["MGET", ...keys]]).then((r) => r[0] ?? []),
  lrange: (key: string, start: number, stop: number): Promise<string[]> =>
    execRedis([["LRANGE", key, start, stop]]).then((r) => r[0] ?? []),
  tx: () => {
    const queued: (string | number)[][] = [];
    return {
      rpush: (key: string, value: string) => {
        queued.push(["RPUSH", key, value]);
      },
      set: (key: string, value: string) => {
        queued.push(["SET", key, value]);
      },
      lrem: (key: string, count: number, value: string) => {
        queued.push(["LREM", key, count, value]);
      },
      del: (key: string) => {
        queued.push(["DEL", key]);
      },
      flush: () =>
        execRedis([["MULTI"], ...queued, ["EXEC"]]).then(
          (r) => r[r.length - 1],
        ),
    };
  },
};
