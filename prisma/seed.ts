import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  log: ['error'],
});

async function main() {
  const services = await Promise.all([
    prisma.service.upsert({
      where: { code: 'OIL' },
      create: {
        code: 'OIL',
        name: 'Oil Change',
        description: 'Engine oil and filter replacement',
        durationMin: 60,
        priceEstimate: 180,
      },
      update: {},
    }),
    prisma.service.upsert({
      where: { code: 'BRAKE' },
      create: {
        code: 'BRAKE',
        name: 'Brake Inspection',
        description: 'Brake pads and braking system diagnostics',
        durationMin: 90,
        priceEstimate: 220,
      },
      update: {},
    }),
    prisma.service.upsert({
      where: { code: 'DIAG' },
      create: {
        code: 'DIAG',
        name: 'Full Diagnostics',
        description: 'ECU scan and maintenance checks',
        durationMin: 120,
        priceEstimate: 260,
      },
      update: {},
    }),
  ]);

  const agencies = await Promise.all([
    prisma.agency.upsert({
      where: { id: 'cma01kiaagencya0000000001' },
      create: {
        id: 'cma01kiaagencya0000000001',
        name: 'Kia Tunis Lac',
        city: 'Tunis',
        address: 'Les Berges du Lac 1, Tunis',
        latitude: 36.846,
        longitude: 10.2729,
        phone: '+21670001001',
      },
      update: {},
    }),
    prisma.agency.upsert({
      where: { id: 'cma01kiaagencyb0000000002' },
      create: {
        id: 'cma01kiaagencyb0000000002',
        name: 'Kia Sfax Centre',
        city: 'Sfax',
        address: 'Route de Gremda, Sfax',
        latitude: 34.7406,
        longitude: 10.7603,
        phone: '+21670001002',
      },
      update: {},
    }),
    prisma.agency.upsert({
      where: { id: 'cma01kiaagencyc0000000003' },
      create: {
        id: 'cma01kiaagencyc0000000003',
        name: 'Kia Sousse Corniche',
        city: 'Sousse',
        address: 'Avenue Habib Bourguiba, Sousse',
        latitude: 35.8256,
        longitude: 10.6369,
        phone: '+21670001003',
      },
      update: {},
    }),
  ]);

  for (const agency of agencies) {
    for (const service of services) {
      await prisma.agencyService.upsert({
        where: {
          agencyId_serviceId: {
            agencyId: agency.id,
            serviceId: service.id,
          },
        },
        create: {
          agencyId: agency.id,
          serviceId: service.id,
        },
        update: {},
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
