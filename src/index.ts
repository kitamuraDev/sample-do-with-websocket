import { DurableObject } from "cloudflare:workers";

export class OumuGaeshi extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const websocketPair = new WebSocketPair();
    const [client, server] = Object.values(websocketPair);

    this.ctx.acceptWebSocket(server);
    await this.broadcast('connected');

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    await this.broadcast(message);
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    await this.broadcast('disconnected');
  }

  /**
   * 接続しているすべてのクライアントにメッセージをブロードキャストする
   * @param message 送信するメッセージ
   */
  private async broadcast(message: string | ArrayBuffer) {
    for (const ws of this.ctx.getWebSockets()) {
      ws.send(message);
    }
  }
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
    // オウム返しをするサンプル（`npx wscat -c ws://localhost:8787/ws`）
    if (request.method === 'GET' && request.url.endsWith('/ws')) {
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

      const id = env.OUMU_GAESHI.idFromName("oumu_gaeshi");
      const stub = env.OUMU_GAESHI.get(id);

      return stub.fetch(request);
    }

    return new Response("Hello World!");
	},
} satisfies ExportedHandler<Env>;
