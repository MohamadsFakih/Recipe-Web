import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: friendId } = await params;
  const me = session.user.id;

  await prisma.friend.deleteMany({
    where: {
      OR: [
        { userId: me, friendId },
        { userId: friendId, friendId: me },
      ],
    },
  });

  return NextResponse.json({ success: true });
}
