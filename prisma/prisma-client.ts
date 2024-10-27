import { PrismaClient } from '@prisma/client';

export function makeTestDbClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://myuser:mypassword@localhost:5432/mydatabase?schema=public',
      },
    },
  });
}
