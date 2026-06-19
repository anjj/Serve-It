import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create Developer User
  const devUser = await prisma.user.upsert({
    where: { email: "dev@example.com" },
    update: {},
    create: {
      email: "dev@example.com",
      name: "Developer User",
      isAdmin: true,
    },
  });
  console.log("Created user:", devUser.email);

  // 2. Create Test Customer
  const testCustomer = await prisma.customer.upsert({
    where: { slug: "test-workspace" },
    update: {},
    create: {
      name: "Test Workspace",
      slug: "test-workspace",
      isActive: true,
    },
  });
  console.log("Created customer workspace:", testCustomer.slug);

  // 3. Map User to Customer Workspace
  const userCustomer = await prisma.userCustomer.upsert({
    where: {
      userId_customerId: {
        userId: devUser.id,
        customerId: testCustomer.id,
      },
    },
    update: {},
    create: {
      userId: devUser.id,
      customerId: testCustomer.id,
    },
  });
  console.log("Mapped user to customer workspace");

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
