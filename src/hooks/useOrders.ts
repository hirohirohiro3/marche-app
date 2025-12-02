import { useEffect, useState, useRef, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  getDocs,
  runTransaction,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';

export const useOrders = (storeId: string | undefined) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isNewOrder, setIsNewOrder] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevNewOrderCount = useRef(0);

  useEffect(() => {
    // Note: A specific sound file is not required. A generic browser sound is sufficient.
    audioRef.current = new Audio(
      'data:audio/wav;base64,UklGRigAAABXQVZFZm1tIBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
    );
  }, []);

  useEffect(() => {
    if (!storeId) {
      setOrders([]);
      return;
    }

    // Calculate 24 hours ago
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const q = query(
      collection(db, 'orders'),
      where('storeId', '==', storeId),
      where('createdAt', '>=', yesterday), // Only recent orders
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Order))
        // Filter for active statuses only (exclude cancelled/archived)
        .filter((order) => order.status !== 'cancelled' && order.status !== 'archived');

      setOrders(ordersData);

      // Check for new orders (status 'new')
      const newOrders = ordersData.filter(o => o.status === 'new');
      if (newOrders.length > prevNewOrderCount.current) {
        setIsNewOrder(true);
        audioRef.current?.play().catch(e => console.error("Audio play failed", e));
      }
      prevNewOrderCount.current = newOrders.length;

    }, (error) => {
      console.error("[useOrders] Error listening to orders collection:", error);
    });

    return unsubscribe;
  }, [storeId]);

  const filterOrdersByStatus = useCallback(
    (status: Order['status']) => {
      const filtered = orders.filter((order) => order.status === status);
      // Sort paid orders by paidAt (ascending: oldest first, newest last)
      if (status === 'paid') {
        return filtered.sort((a, b) => {
          const aTime = a.paidAt?.seconds || a.createdAt.seconds;
          const bTime = b.paidAt?.seconds || b.createdAt.seconds;
          return aTime - bTime;
        });
      }
      return filtered;
    },
    [orders]
  );

  const updateOrderStatus = useCallback(async (
    orderId: string,
    newStatus: Order['status']
  ) => {
    if (!storeId) return;
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }, [storeId]);

  const handleEndOfDay = useCallback(async () => {
    if (!storeId) return;
    try {
      const activeOrdersQuery = query(
        collection(db, 'orders'),
        where('storeId', '==', storeId),
        where('status', 'in', ['new', 'paid', 'completed'])
      );
      const activeOrdersSnapshot = await getDocs(activeOrdersQuery);
      const settingsRef = doc(db, 'system_settings', 'orderNumbers');

      await runTransaction(db, async (transaction) => {
        // Mark all active orders as archived
        activeOrdersSnapshot.forEach((orderDoc) => {
          transaction.update(orderDoc.ref, { status: 'archived' });
        });

        // Reset order numbers
        transaction.set(settingsRef, {
          nextQrOrderNumber: 101,
          nextManualOrderNumber: 1
        }, { merge: true });
      });

      // Clear local state
      setOrders([]);
      prevNewOrderCount.current = 0;

    } catch (error) {
      console.error("Error handling end of day:", error);
      throw error;
    }
  }, [storeId]);

  return {
    orders,
    isNewOrder,
    setIsNewOrder,
    filterOrdersByStatus,
    updateOrderStatus,
    handleEndOfDay,
  };
};
