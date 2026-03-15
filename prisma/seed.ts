import "dotenv/config";
import { PrismaClient, Role } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SEED_USERS = [
  { email: "admin@loanofficer.dev", name: "System Admin", role: "admin" as Role, password: "admin123" },
  { email: "manager@loanofficer.dev", name: "Jane Manager", role: "branch_manager" as Role, password: "manager123" },
  { email: "officer@loanofficer.dev", name: "John Officer", role: "loan_officer" as Role, password: "officer123" },
  { email: "processor@loanofficer.dev", name: "Pat Processor", role: "processor" as Role, password: "processor123" },
  { email: "underwriter@loanofficer.dev", name: "Uma Underwriter", role: "underwriter" as Role, password: "underwriter123" },
];

const SEED_GROUPS = [
  { name: "Branch A", description: "Main branch team" },
  { name: "Underwriting Team", description: "Loan underwriting specialists" },
];

const SEED_PERMISSIONS = [
  { action: "users.list", description: "View user list" },
  { action: "users.create", description: "Create new users" },
  { action: "users.update", description: "Update user details" },
  { action: "users.delete", description: "Delete users" },
  { action: "users.view", description: "View user profiles" },
  { action: "groups.list", description: "View group list" },
  { action: "groups.create", description: "Create new groups" },
  { action: "groups.update", description: "Update groups" },
  { action: "groups.delete", description: "Delete groups" },
  { action: "loans.list", description: "View loan applications" },
  { action: "loans.create", description: "Create loan applications" },
  { action: "loans.update", description: "Update loan applications" },
  { action: "loans.approve", description: "Approve/deny loans" },
  { action: "loans.transition", description: "Transition loan application status" },
  { action: "loans.delete", description: "Delete loan applications" },
  { action: "offers.create", description: "Create loan offers" },
  { action: "offers.update", description: "Update loan offers" },
  { action: "offers.review", description: "Review and approve/reject loan offers" },
  { action: "offers.generate", description: "Generate AI-assisted loan offers" },
  { action: "system.config", description: "Manage system configuration" },
  { action: "system.dashboard", description: "View admin dashboard" },
  { action: "reports.view", description: "View reports" },
];

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: SEED_PERMISSIONS.map((p) => p.action),
  branch_manager: [
    "users.list", "users.view", "groups.list",
    "loans.list", "loans.create", "loans.update", "loans.approve", "loans.transition",
    "offers.create", "offers.update", "offers.review", "offers.generate",
    "system.dashboard", "reports.view",
  ],
  loan_officer: ["loans.list", "loans.create", "loans.update", "loans.transition", "offers.create", "offers.update", "offers.generate"],
  processor: ["loans.list", "loans.update", "loans.transition"],
  underwriter: ["loans.list", "loans.approve", "loans.transition", "offers.review"],
};

const SEED_CONFIGS = [
  { key: "app.name", value: "Loan Officer" },
  { key: "app.maxLoanAmount", value: "500000" },
  { key: "app.defaultCurrency", value: "USD" },
];

async function main() {
  console.log("Seeding database...");

  // Create users
  for (const u of SEED_USERS) {
    const passwordHash = await hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash },
      create: { email: u.email, name: u.name, role: u.role, passwordHash },
    });
    console.log(`  User: ${u.email} (${u.role})`);
  }

  // Create permissions
  for (const p of SEED_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { action: p.action },
      update: { description: p.description },
      create: { action: p.action, description: p.description },
    });
  }
  console.log(`  Permissions: ${SEED_PERMISSIONS.length} created`);

  // Create role-permission mappings
  for (const [role, actions] of Object.entries(ROLE_PERMISSIONS)) {
    for (const action of actions) {
      const permission = await prisma.permission.findUnique({ where: { action } });
      if (permission) {
        await prisma.rolePermission.upsert({
          where: { role_permissionId: { role: role as Role, permissionId: permission.id } },
          update: {},
          create: { role: role as Role, permissionId: permission.id },
        });
      }
    }
  }
  console.log("  Role-permission mappings created");

  // Create groups
  const admin = await prisma.user.findUnique({ where: { email: "admin@loanofficer.dev" } });
  const officer = await prisma.user.findUnique({ where: { email: "officer@loanofficer.dev" } });
  const underwriter = await prisma.user.findUnique({ where: { email: "underwriter@loanofficer.dev" } });

  for (const g of SEED_GROUPS) {
    const group = await prisma.group.upsert({
      where: { name: g.name },
      update: { description: g.description },
      create: { name: g.name, description: g.description },
    });

    // Add members
    if (g.name === "Branch A" && admin && officer) {
      for (const userId of [admin.id, officer.id]) {
        await prisma.groupMember.upsert({
          where: { userId_groupId: { userId, groupId: group.id } },
          update: {},
          create: { userId, groupId: group.id },
        });
      }
    }
    if (g.name === "Underwriting Team" && underwriter) {
      await prisma.groupMember.upsert({
        where: { userId_groupId: { userId: underwriter.id, groupId: group.id } },
        update: {},
        create: { userId: underwriter.id, groupId: group.id },
      });
    }
    console.log(`  Group: ${g.name}`);
  }

  // Create system configs
  for (const c of SEED_CONFIGS) {
    await prisma.systemConfig.upsert({
      where: { key: c.key },
      update: { value: c.value },
      create: { key: c.key, value: c.value },
    });
  }
  console.log(`  System configs: ${SEED_CONFIGS.length} created`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
