export const PrismaServiceMock = {
  transaction: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  account: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $executeRaw: jest.fn(),
  $transaction: jest.fn((cb) =>
    cb({
      account: PrismaServiceMock.account,
      transaction: PrismaServiceMock.transaction,
      $executeRaw: PrismaServiceMock.$executeRaw,
      $transaction: jest.fn(),
    }),
  ),
};
