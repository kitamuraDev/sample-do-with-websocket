import { DurableObject } from "cloudflare:workers";

export class MyDurableObject extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const websocketPair = new WebSocketPair();
    const [client, server] = Object.values(websocketPair);

    this.ctx.acceptWebSocket(server);
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    ws.send(`[Durable Object] message: ${message}, connections: ${this.ctx.getWebSockets().length}`);
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    console.log(`WebSocket closed: code=${code}, reason=${reason}, wasClean=${wasClean}`);
  }
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
    if (request.method === "GET" && request.url.endsWith("/websocket")) {
      const upgradeHeader = request.headers.get("Upgrade");
      if (!upgradeHeader || upgradeHeader !== "websocket") {
        return new Response(null, {
          status: 426,
          statusText: "Durable Object expected Upgrade: websocket",
          headers: {
            "Content-Type": "text/plain",
          },
        });
      }

      const id = env.MY_DURABLE_OBJECT.idFromName("foo");
      const stub = env.MY_DURABLE_OBJECT.get(id);

      return stub.fetch(request);
    }

    return new Response("Hello World!");
	},
} satisfies ExportedHandler<Env>;
