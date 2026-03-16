import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import {
  UpdateClosingDetailSchema,
  UpdateChecklistItemSchema,
} from "@/lib/schemas/loan-application";
import { z } from "zod/v4";

const DEFAULT_CHECKLIST_ITEMS = [
  "Title of Office",
  "Hazard Insurance",
  "Flood Certification",
  "Credit Report",
  "Appraisal",
  "Survey",
  "Pest Inspection",
  "Home Inspection",
  "Attorney Review",
  "Loan Documents Signed",
];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.list")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let closingDetail = await prisma.closingDetail.findUnique({
    where: { applicationId: id },
    include: { checklistItems: { orderBy: { createdAt: "asc" } } },
  });

  // Auto-create closing detail with default checklist on first access
  if (!closingDetail) {
    closingDetail = await prisma.closingDetail.create({
      data: {
        applicationId: id,
        checklistItems: {
          create: DEFAULT_CHECKLIST_ITEMS.map((name) => ({ name })),
        },
      },
      include: { checklistItems: { orderBy: { createdAt: "asc" } } },
    });
  }

  return NextResponse.json(closingDetail);
}

const PutBodySchema = z.object({
  detail: UpdateClosingDetailSchema.optional(),
  checklistUpdates: z.array(UpdateChecklistItemSchema).optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = PutBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { detail, checklistUpdates } = parsed.data;

  // Upsert the closing detail
  const closingDetail = await prisma.closingDetail.upsert({
    where: { applicationId: id },
    create: {
      applicationId: id,
      ...detail,
    },
    update: detail ?? {},
  });

  // Update checklist items if provided
  if (checklistUpdates && checklistUpdates.length > 0) {
    for (const item of checklistUpdates) {
      await prisma.closingChecklistItem.update({
        where: { id: item.id },
        data: {
          completed: item.completed,
          completedAt: item.completed ? new Date() : null,
        },
      });
    }
  }

  // Return full updated data
  const result = await prisma.closingDetail.findUnique({
    where: { applicationId: id },
    include: { checklistItems: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json(result);
}
