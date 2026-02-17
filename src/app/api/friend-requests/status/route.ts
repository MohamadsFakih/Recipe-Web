import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const friends = await prisma.friend.findUnique({
    where: {
      userId_friendId: { userId: session.user.id, friendId: userId },
    },
  });
  const friendsReverse = await prisma.friend.findUnique({
    where: {
      userId_friendId: { userId, friendId: session.user.id },
    },
  });
  if (friends || friendsReverse) {
    return NextResponse.json({ status: "friends" as const });
  }

  const sent = await prisma.friendRequest.findUnique({
    where: {
      fromUserId_toUserId: { fromUserId: session.user.id, toUserId: userId },
    },
  });
  if (sent) {
    return NextResponse.json({ status: "sent" as const });
  }

  const received = await prisma.friendRequest.findFirst({
    where: {
      fromUserId: userId,
      toUserId: session.user.id,
    },
  });
  if (received) {
    return NextResponse.json({ status: "received" as const, requestId: received.id });
  }

  return NextResponse.json({ status: "none" as const });
}
