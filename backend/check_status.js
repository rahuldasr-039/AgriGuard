const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const t = await p.treatment.findMany({ include: { tag: true } });
  const w = await p.withdrawalRecord.findMany({ include: { treatment: { include: { tag: true } } } });
  const v = await p.vaccination.findMany({ include: { tag: true } });

  console.log('Treatments:', t.map(x => ({ med: x.medicineName, tag: x.tag?.tag })));
  console.log('Withdrawals:', w.map(x => ({ prod: x.foodProduct, tag: x.treatment?.tag?.tag, safe: x.safeFromDate })));
  console.log('Vaccinations:', v.map(x => ({ vac: x.vaccineName, tag: x.tag?.tag })));
}

check().catch(console.error).finally(() => p.$disconnect());
