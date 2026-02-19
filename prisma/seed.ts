import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "P@ssw0rd768P@ssw0rd768";

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    if (existing.role === "ADMIN") {
      console.log("Admin user already exists.");
      return;
    }
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN", disabled: false, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10) },
    });
    console.log("Updated existing user to admin.");
    return;
  }
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash,
      name: "Admin",
      role: "ADMIN",
      disabled: false,
    },
  });
  console.log("Admin user created. Email:", ADMIN_EMAIL, "Password: (see README)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
