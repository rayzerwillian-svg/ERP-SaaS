import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'node:events';

export type EventEnvelope<T = unknown> = {
  event: string;
  payload: T;
  emittedAt: string;
};

type RedisClient = {
  xadd: (stream: string, id: string, field: string, value: string) => Promise<string>;
  quit: () => Promise<void>;
};

type NatsConnection = {
  publish: (subject: string, data: Uint8Array) => void | Promise<void>;
  drain: () => Promise<void>;
};

@Injectable()
export class EventBusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventBusService.name);
  private readonly emitter = new EventEmitter();
  private redis?: RedisClient;
  private nats?: NatsConnection;
  private stringCodec?: { encode: (input: string) => Uint8Array };

  onModuleInit(): void {
    this.connectNats();
    this.connectRedis();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.nats) {
      await this.nats.drain().catch((error) =>
        this.logger.warn(`Erro ao encerrar conexão NATS: ${error instanceof Error ? error.message : error}`),
      );
      this.nats = undefined;
    }

    if (this.redis) {
      await this.redis.quit().catch((error) =>
        this.logger.warn(`Erro ao encerrar conexão Redis: ${error instanceof Error ? error.message : error}`),
      );
      this.redis = undefined;
    }
  }

  async publish<T = unknown>(event: string, payload: T): Promise<void> {
    const envelope: EventEnvelope<T> = {
      event,
      payload,
      emittedAt: new Date().toISOString(),
    };

    this.emitter.emit(event, envelope);

    if (this.nats && this.stringCodec) {
      try {
        this.nats.publish(event, this.stringCodec.encode(JSON.stringify(envelope)));
      } catch (error) {
        this.logger.error(`Falha ao publicar evento no NATS: ${event}`, error as Error);
      }
    }

    if (this.redis) {
      try {
        const stream = process.env.REDIS_STREAM_NAME ?? 'erp-events';
        await this.redis.xadd(stream, '*', 'event', JSON.stringify(envelope));
      } catch (error) {
        this.logger.error(`Falha ao publicar evento no Redis Stream: ${event}`, error as Error);
      }
    }
  }

  on<T = unknown>(event: string, handler: (envelope: EventEnvelope<T>) => void): void {
    this.emitter.on(event, (envelope) => handler(envelope as EventEnvelope<T>));
  }

  private async connectNats() {
    const servers = process.env.NATS_URL;
    if (!servers) return;

    try {
      const nats = await import('nats');
      this.nats = await nats.connect({ servers: servers.split(',') });
      this.stringCodec = nats.StringCodec();
      this.logger.log(`Conectado ao NATS (${servers})`);
    } catch (error) {
      this.logger.warn(
        `Não foi possível conectar ao NATS (${servers}): ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async connectRedis() {
    const url = process.env.REDIS_STREAM_URL;
    if (!url) return;

    try {
      const { default: Redis } = await import('ioredis');
      const redis = new Redis(url, { lazyConnect: true });
      await redis.connect();
      this.redis = redis;
      this.logger.log(`Conectado ao Redis Streams (${url})`);
    } catch (error) {
      this.logger.warn(
        `Não foi possível conectar ao Redis Streams (${url}): ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
