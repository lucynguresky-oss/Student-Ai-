import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { createServer, Server as HttpServer } from 'http';

/**
 * Custom Socket.io adapter for NestJS + Fastify.
 *
 * The default IoAdapter tries to attach to the HTTP server that the
 * NestJS app exposes, but Fastify wraps Node's http.Server in a way
 * that is incompatible with socket.io's `new Server(httpServer)`.
 *
 * This adapter creates a **standalone HTTP server** on a dedicated
 * port (default 4001) and binds Socket.io to it, side-stepping the
 * Fastify compatibility issue entirely.
 */
export class SocketIoAdapter extends IoAdapter {
  private standaloneHttpServer: HttpServer;

  constructor(
    app: INestApplicationContext,
    private readonly wsPort: number = 4001,
  ) {
    super(app);
    this.standaloneHttpServer = createServer();
  }

  createIOServer(_port: number, options?: Partial<ServerOptions>): Server {
    const server = new Server(this.standaloneHttpServer, {
      ...options,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.standaloneHttpServer.listen(this.wsPort, () => {
      console.log(`🔌 Socket.io server listening on port ${this.wsPort}`);
    });

    return server;
  }
}
