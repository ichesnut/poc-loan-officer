import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import {
  CreateLiabilitySchema,
  UpdateCreditSummarySchema,
} from "@/lib/schemas/loan-application";
import { z } from "zod/v4";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.list")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [liabilities, creditSummary] = await Promise.all([
    prisma.liability.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.creditSummary.findUnique({
      where: { applicationId: id },
    }),
  ]);

  return NextResponse.json({ liabilities, creditSummary });
}

const PostBodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("addLiability"), data: CreateLiabilitySchema }),
  z.object({ action: z.literal("updateSummary"), data: UpdateCreditSummarySchema }),
]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  if (parsed.data.action === "addLiability") {
    const liability = await prisma.liability.create({
      data: { ...parsed.data.data, applicationId: id },
    });
    return NextResponse.json(liability, { status: 201 });
  }

  // updateSummary
  const summary = await prisma.creditSummary.upsert({
    where: { applicationId: id },
    create: { applicationId: id, ...parsed.data.data },
    update: parsed.data.data,
  });
  return NextResponse.json(summary);
}
