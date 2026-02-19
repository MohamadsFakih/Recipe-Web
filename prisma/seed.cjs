require("dotenv").config({ path: ".env" });
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@admin.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error("ADMIN_PASSWORD is required in .env. Add: ADMIN_PASSWORD=your-secure-password");
  process.exit(1);
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN", disabled: false, passwordHash, name: existing.name || "Admin" },
    });
    console.log("Admin user updated. Email:", ADMIN_EMAIL, "(password synced from .env)");
    return;
  }
  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash,
      name: "Admin",
      role: "ADMIN",
      disabled: false,
    },
  });
  console.log("Admin user created. Email:", ADMIN_EMAIL);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
