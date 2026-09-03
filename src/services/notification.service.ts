import { adminDb } from '@/lib/firebase/admin';

export interface NotificationRecord {
  id?: string;
  userId: string; // The enrollment number or 'admin'
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export class NotificationService {
  /**
   * Create a new notification for a user or admin
   */
  static async createNotification(data: Omit<NotificationRecord, 'id' | 'isRead' | 'createdAt'>): Promise<void> {
    if (!adminDb) {
      console.warn('Firebase Admin not initialized. Skipping notification creation.');
      return;
    }

    try {
      const notification: Omit<NotificationRecord, 'id'> = {
        ...data,
        isRead: false,
        createdAt: new Date().toISOString()
      };

      await adminDb.collection('notifications').add(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  /**
   * Fetch notifications for a specific user, ordered by creation date
   */
  static async getUserNotifications(userId: string, limitCount = 50): Promise<NotificationRecord[]> {
    if (!adminDb) return [];

    try {
      const snapshot = await adminDb.collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limitCount)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotificationRecord[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Mark a specific notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    if (!adminDb) return false;

    try {
      await adminDb.collection('notifications').doc(notificationId).update({
        isRead: true
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications for a user as read
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    if (!adminDb) return false;

    try {
      const unreadSnap = await adminDb.collection('notifications')
        .where('userId', '==', userId)
        .where('isRead', '==', false)
        .get();

      if (unreadSnap.empty) return true;

      const batch = adminDb.batch();
      unreadSnap.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }
}
