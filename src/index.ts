import { DurableObject } from "cloudflare:workers";

export class MyDurableObject extends DurableObject {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	async sayHello(name: string): Promise<string> {
		return `Hello, ${name}!`;
	}
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const stub = env.MY_DURABLE_OBJECT.getByName("foo");
		const greeting = await stub.sayHello("world");

		return new Response(greeting);
	},
} satisfies ExportedHandler<Env>;
