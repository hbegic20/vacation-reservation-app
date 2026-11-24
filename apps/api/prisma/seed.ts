import { AbsenceType, PrismaClient, UserRole, VacationStatus } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

const fixedDateHolidays = [
  { month: 1, day: 1, name: 'New Year' },
  { month: 1, day: 2, name: 'New Year (second day)' },
  { month: 3, day: 1, name: 'Independence Day' },
  { month: 5, day: 1, name: 'Labour Day' },
  { month: 5, day: 2, name: 'Labour Day (second day)' }
];

async function main() {
  const adminPassword = await hash('admin1234', 10);
  const employeePassword = await hash('employee1234', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      firstName: 'Default',
      lastName: 'Admin',
      department: 'HR',
      password: adminPassword,
      role: UserRole.ADMIN,
      vacationDaysTotal: 30,
      vacationDaysUsed: 2
    }
  });

  await prisma.user.upsert({
    where: { email: 'operations.admin@company.com' },
    update: {},
    create: {
      email: 'operations.admin@company.com',
      firstName: 'Operations',
      lastName: 'Admin',
      department: 'Operations',
      password: adminPassword,
      role: UserRole.ADMIN,
      vacationDaysTotal: 30,
      vacationDaysUsed: 0
    }
  });

  const employee = await prisma.user.upsert({
    where: { email: 'john.employee@company.com' },
    update: {},
    create: {
      email: 'john.employee@company.com',
      firstName: 'John',
      lastName: 'Employee',
      department: 'Engineering',
      password: employeePassword,
      role: UserRole.EMPLOYEE,
      vacationDaysTotal: 25,
      vacationDaysUsed: 8
    }
  });

  await prisma.vacationRequest.upsert({
    where: { id: 'seed-approved-request' },
    update: {},
    create: {
      id: 'seed-approved-request',
      userId: employee.id,
      startDate: new Date('2026-03-10'),
      endDate: new Date('2026-03-14'),
      reason: 'Family trip',
      workingDays: 4,
      absenceType: AbsenceType.VACATION,
      status: VacationStatus.APPROVED,
      adminComment: 'Approved. Enjoy your vacation.'
    }
  });

  await prisma.vacationRequest.upsert({
    where: { id: 'seed-pending-request' },
    update: {},
    create: {
      id: 'seed-pending-request',
      userId: employee.id,
      startDate: new Date('2026-04-22'),
      endDate: new Date('2026-04-24'),
      reason: 'Personal errands',
      workingDays: 3,
      absenceType: AbsenceType.VACATION,
      status: VacationStatus.PENDING,
      adminComment: null
    }
  });

  await prisma.vacationRequest.upsert({
    where: { id: 'seed-sick-request' },
    update: {},
    create: {
      id: 'seed-sick-request',
      userId: employee.id,
      startDate: new Date('2026-02-12'),
      endDate: new Date('2026-02-12'),
      reason: 'Flu',
      workingDays: 1,
      absenceType: AbsenceType.SICK,
      status: VacationStatus.APPROVED,
      adminComment: 'Marked as sick leave by admin.'
    }
  });

  for (const year of [2026, 2027]) {
    for (const holiday of fixedDateHolidays) {
      const date = new Date(Date.UTC(year, holiday.month - 1, holiday.day));
      await prisma.publicHoliday.upsert({
        where: { date },
        update: {},
        create: { date, name: holiday.name }
      });
    }
  }

  console.log(`Seeded admin: ${admin.email}`);
  console.log(`Seeded employee: ${employee.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
