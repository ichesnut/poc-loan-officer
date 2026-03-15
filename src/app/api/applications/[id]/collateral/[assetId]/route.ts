import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { UpdateCollateralAssetSchema } from "@/lib/schemas/loan-application";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { assetId } = await params;
  const body = await req.json();
  const parsed = UpdateCollateralAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const asset = await prisma.collateralAsset.update({
    where: { id: assetId },
    data: parsed.data,
  });

  return NextResponse.json(asset);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user.role, "loans.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { assetId } = await params;
  await prisma.collateralAsset.delete({ where: { id: assetId } });

  return NextResponse.json({ success: true });
}
