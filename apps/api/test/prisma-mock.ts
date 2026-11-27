import { PrismaService } from "../src/prisma/prisma.service";

function modelMock() {
  return {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  };
}

interface PrismaShape {
  user: ModelMock;
  vacationRequest: ModelMock;
  notification: ModelMock;
  publicHoliday: ModelMock;
  document: ModelMock;
  $transaction: jest.Mock;
}

type ModelMock = ReturnType<typeof modelMock>;

export function createPrismaMock() {
  const prisma = {
    user: modelMock(),
    vacationRequest: modelMock(),
    notification: modelMock(),
    publicHoliday: modelMock(),
    document: modelMock(),
    $transaction: jest.fn(),
  };
  return resetPrismaMock(prisma);
}

export type PrismaMock = ReturnType<typeof createPrismaMock>;

export function resetPrismaMock<T extends PrismaShape>(prisma: T): T {
  for (const model of [
    prisma.user,
    prisma.vacationRequest,
    prisma.notification,
    prisma.publicHoliday,
    prisma.document,
  ]) {
    Object.values(model).forEach((method) => method.mockReset());
  }
  prisma.publicHoliday.findMany.mockResolvedValue([]);
  prisma.$transaction
    .mockReset()
    .mockImplementation((work: (transaction: T) => unknown) => work(prisma));
  return prisma;
}

export function asPrismaService(prisma: PrismaMock): PrismaService {
  return prisma as unknown as PrismaService;
}
