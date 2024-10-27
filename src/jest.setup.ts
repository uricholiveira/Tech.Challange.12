jest.mock('../prisma/prisma.service');
jest.mock('./logger/logger.service');
jest.mock('bull', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
  })),
}));
