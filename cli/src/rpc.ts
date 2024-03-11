const serverURL = Deno.env.get("RMMBR_SERVER");

export const callServer = (
  path: string,
  method: "GET" | "POST",
  body: any,
) =>
(accessToken: string) =>
  fetch(
    `${serverURL}/${path}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      method,
      body: JSON.stringify(body),
    },
  ).then(
    async (response) =>
      response.status === 200
        ? response.json()
        : Promise.reject(await response.text()),
  );
