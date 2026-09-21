import { prisma } from "../config/prisma";
import { AuthenticatedUser } from "../middlewares/auth.middleware";

export interface CreateNotificationInput {
  title: string;
  detail: string;
  issuer?: string;
  tone?: string;
  targetUserId?: string;
  targetRole?: string;
}

export async function getNotificationsService(user: AuthenticatedUser) {
  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.userId,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: {
      userId: user.userId,
      isRead: false,
    },
  });

  return {
    success: true,
    statusCode: 200,
    unreadCount,
    count: notifications.length,
    data: notifications,
  };
}

export async function markNotificationReadService(user: AuthenticatedUser, notifId: string) {
  if (notifId === "all") {
    await prisma.notification.updateMany({
      where: { userId: user.userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true, statusCode: 200, message: "All notifications marked as read." };
  }

  const notification = await prisma.notification.findUnique({
    where: { id: notifId },
  });

  if (!notification || notification.userId !== user.userId) {
    return { success: false, statusCode: 404, message: "Notification not found." };
  }

  const updated = await prisma.notification.update({
    where: { id: notifId },
    data: { isRead: true },
  });

  return { success: true, statusCode: 200, data: updated };
}

export async function createNotificationService(user: AuthenticatedUser, data: CreateNotificationInput) {
  let recipientUserIds: string[] = [];

  if (data.targetUserId) {
    recipientUserIds.push(data.targetUserId);
  } else if (data.targetRole) {
    const users = await prisma.user.findMany({
      where: { role: data.targetRole as any },
      select: { id: true },
    });
    recipientUserIds = users.map((u) => u.id);
  } else {
    recipientUserIds.push(user.userId);
  }

  if (recipientUserIds.length === 0) {
    recipientUserIds.push(user.userId);
  }

  const createdNotifications = await Promise.all(
    recipientUserIds.map((userId) =>
      prisma.notification.create({
        data: {
          title: data.title,
          detail: data.detail,
          issuer: data.issuer || user.email,
          tone: data.tone || "info",
          userId: userId,
        },
      })
    )
  );

  return {
    success: true,
    statusCode: 201,
    message: `Created ${createdNotifications.length} notification(s).`,
    data: createdNotifications,
  };
}
