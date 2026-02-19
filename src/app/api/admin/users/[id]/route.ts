import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const disabled = body.disabled;

  if (typeof disabled !== "boolean") {
    return NextResponse.json(
      { error: "Invalid input: disabled must be boolean" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.role === "ADMIN" && target.id !== session!.user.id) {
    return NextResponse.json(
      { error: "Cannot modify another admin" },
      { status: 403 }
    );
  }

  await prisma.user.update({
    where: { id },
    data: { disabled },
  });
  return NextResponse.json({ success: true, disabled });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.role === "ADMIN" && target.id !== session!.user.id) {
    return NextResponse.json(
      { error: "Cannot delete another admin" },
      { status: 403 }
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
