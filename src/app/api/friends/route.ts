import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const addFriendSchema = z.object({
  email: z.string().email().optional(),
  userId: z.string().min(1).optional(),
}).refine((d) => d.email ?? d.userId, { message: "Provide email or userId" });

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const asUserId = await prisma.friend.findMany({
    where: { userId: session.user.id },
    include: { friend: { select: { id: true, email: true, name: true, image: true } } },
  });
  const asFriendId = await prisma.friend.findMany({
    where: { friendId: session.user.id },
    include: { user: { select: { id: true, email: true, name: true, image: true } } },
  });

  const list = [
    ...asUserId.map((f) => ({ id: f.id, friend: f.friend })),
    ...asFriendId.map((f) => ({ id: f.id, friend: f.user })),
  ];
  const seen = new Set<string>();
  const unique = list.filter(({ friend }) => {
    if (seen.has(friend.id)) return false;
    seen.add(friend.id);
    return true;
  });

  return NextResponse.json(unique);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = addFriendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    let other: { id: string; email: string; name: string | null } | null = null;
    if (parsed.data.userId) {
      other = await prisma.user.findUnique({
        where: { id: parsed.data.userId },
        select: { id: true, email: true, name: true },
      });
    } else if (parsed.data.email) {
      other = await prisma.user.findUnique({
        where: { email: parsed.data.email },
        select: { id: true, email: true, name: true },
      });
    }
    if (!other) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    if (other.id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot add yourself" },
        { status: 400 }
      );
    }

    const alreadyFriends =
      (await prisma.friend.findUnique({
        where: { userId_friendId: { userId: session.user.id, friendId: other.id } },
      })) ||
      (await prisma.friend.findUnique({
        where: { userId_friendId: { userId: other.id, friendId: session.user.id } },
      }));
    if (alreadyFriends) {
      return NextResponse.json(
        { error: "Already friends with this user" },
        { status: 409 }
      );
    }

    const alreadyPending =
      (await prisma.friendRequest.findFirst({
        where: { fromUserId: session.user.id, toUserId: other.id },
      })) ||
      (await prisma.friendRequest.findFirst({
        where: { fromUserId: other.id, toUserId: session.user.id },
      }));
    if (alreadyPending) {
      return NextResponse.json(
        { error: "Friend request already sent or received" },
        { status: 409 }
      );
    }

    await prisma.friendRequest.create({
      data: { fromUserId: session.user.id, toUserId: other.id },
    });

    return NextResponse.json({
      success: true,
      message: "Friend request sent",
      toUser: { id: other.id, email: other.email, name: other.name },
    });
  } catch (e) {
    console.error("Add friend error:", e);
    return NextResponse.json(
      { error: "Failed to add friend" },
      { status: 500 }
    );
  }
}
