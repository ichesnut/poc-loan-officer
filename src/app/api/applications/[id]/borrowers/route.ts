import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { CreateBorrowerSchema } from "@/lib/schemas/loan-application";

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
  const parsed = CreateBorrowerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const borrower = await prisma.borrower.create({
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      applicationId: id,
    },
  });

  return NextResponse.json(borrower, { status: 201 });
}
