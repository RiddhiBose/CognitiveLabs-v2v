import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { NotificationService } from '../services/notification';
import type { Notification } from '../types';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (userId: string) => {
    setLoading(true);
    const result = await NotificationService.getNotifications(userId);
    if (result.error) {
      setError(result.error);
    } else {
      setNotifications(result.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    fetchNotifications(user.id);
    
    // Start background checks and unread message reminder checker
    NotificationService.startBackgroundScheduler(user.id);

    // Subscribe to real-time notifications
    const channel = NotificationService.subscribeToNotifications(user.id, (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, fetchNotifications]);

  const refreshNotifications = useCallback(async () => {
    if (user?.id) await fetchNotifications(user.id);
  }, [user?.id, fetchNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      await NotificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    },
    [],
  );

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    await NotificationService.markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [user?.id]);

  const deleteNotification = useCallback(
    async (id: string) => {
      await NotificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    [],
  );

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
