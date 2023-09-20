# BunsterJs
    Simple rest api framework for bun.

## Features
- Focus on simple and easy to use.
- Fast Performance.
- Built-in Zod input validator.
- Built-in logger based on winston with log rotation.

### Quickstart

    const app = new Bunster();

    app.get("/", (ctx) => ctx.sendText("Hi"));

    app.post("/json", (ctx) => ctx.sendJson(ctx.body));

    const inputSchema = {
        query: z.object({
            name: z.string(),
        }),
        params: z.object({
            id: z.coerce.number(),
        }),
    };

    app.get("/id/:id",(ctx) => {
        ctx.setHeader("x-powered-by", xPoweredBy);
        return ctx.sendText(`${ctx.params.id} ${ctx.query.name}`);
        },
        {
            input: inputSchema,
        }
    );

    app.serve({
        port: 4000,
    });

