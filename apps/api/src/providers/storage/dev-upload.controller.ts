import { Controller, Put, Get, Param, Req, Res, Inject } from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { STORAGE_PROVIDER, type StorageProvider, MockStorageProvider } from './storage.provider';
import { Public } from '../../core/tokens/auth.guard';

@Controller()
export class DevUploadController {
  constructor(@Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider) {}

  @Public()
  @Put('dev-upload/:prefix/:userId/:filename')
  async upload(
    @Param('prefix') prefix: string,
    @Param('userId') userId: string,
    @Param('filename') filename: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const key = `${prefix}/${userId}/${filename}`;
    const contentType = req.headers['content-type'] || 'application/octet-stream';
    const buffers: Buffer[] = [];
    
    // Read raw body since Fastify request is a readable stream
    const rawReq = req.raw;
    for await (const chunk of rawReq) {
      buffers.push(chunk as Buffer);
    }
    const data = Buffer.concat(buffers);

    if (this.storage instanceof MockStorageProvider) {
      await this.storage.putObject(key, data, contentType);
    }
    
    res.status(200).send({ ok: true });
  }

  @Public()
  @Get('mock-media/:prefix/:userId/:filename')
  async serve(
    @Param('prefix') prefix: string,
    @Param('userId') userId: string,
    @Param('filename') filename: string,
    @Res() res: FastifyReply,
  ) {
    const key = `${prefix}/${userId}/${filename}`;
    if (this.storage instanceof MockStorageProvider) {
      try {
        const obj = await this.storage.getObject(key);
        res.header('Content-Type', obj.contentType);
        res.status(200).send(obj.data);
        return;
      } catch (e) {
        // Fall through to 404
      }
    }
    res.status(404).send({ error: 'Not found' });
  }
}
