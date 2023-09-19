# BunsterJs
    Minimalistic. Robust. Efficient. Your go-to JSON REST API framework.

### Why BunsterJS?
    🚀 Streamlined Experience: Specifically tailored for JSON REST APIs. No more, no less.
    📊 Winston Logger: Track every request, spot errors, and optimize performance without breaking a sweat.
    🔄 Daily Log Rotation: Say goodbye to overwhelming log files. BunsterJS keeps them in check.
    🎯 Opinionated, Yet Flexible: We made some decisions for you, so you can focus on what truly matters.

### Quickstart

    import { BunsterServer, BunsterRouter } from 'bunster';

    const router = new BunsterRouter();
    router.get('/', (ctx) => {
    return { message: 'Welcome to Bunster!' };
    });

    const server = new BunsterServer();
    server.use(router);
    server.listen(3000);