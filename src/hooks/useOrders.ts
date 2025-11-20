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

    const q = query(
      collection(db, 'orders'),
      where('storeId', '==', storeId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Order))
        .filter((order) => order.status !== 'cancelled');
      setOrders(ordersData);

      const newOrderCount = ordersData.filter((o) => o.status === 'new').length;
      if (newOrderCount > prevNewOrderCount.current) {
        setIsNewOrder(true);
        audioRef.current?.play();
        setTimeout(() => setIsNewOrder(false), 2000); // Animation duration
      }
      prevNewOrderCount.current = newOrderCount;
    },
      (error) => {
        console.error("[useOrders] Error listening to orders collection:", error);
        console.error("[useOrders] Full Error Details:", JSON.stringify(error, null, 2));
        console.error("[useOrders] Current storeId:", storeId);
      });

    return unsubscribe;
  }, [storeId]);

  const filterOrdersByStatus = useCallback(
    (status: Order['status']) => orders.filter((order) => order.status === status),
    [orders]
  );

  const updateOrderStatus = useCallback(async (
    orderId: string,
    newStatus: Order['status']
  ) => {
    const orderRef = doc(db, 'orders', orderId);
    try {
      await updateDoc(orderRef, { status: newStatus });
      console.log(`Order ${orderId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  }, []);

  const handleEndOfDay = useCallback(async () => {
    if (!storeId) return;
    console.log("[useOrders] Starting handleEndOfDay...");
    try {
      const activeOrdersQuery = query(
        collection(db, 'orders'),
        where('storeId', '==', storeId),
        where('status', 'in', ['new', 'paid'])
      );
      const activeOrdersSnapshot = await getDocs(activeOrdersQuery);
      const settingsRef = doc(db, 'system_settings', 'orderNumbers');

      await runTransaction(db, async (transaction) => {
        // Mark all active orders as completed
        activeOrdersSnapshot.forEach((orderDoc) => {
          transaction.update(orderDoc.ref, { status: 'completed' });
        });

        // Reset order numbers. Use set with merge option to create if not exists.
        transaction.set(settingsRef, {
          nextQrOrderNumber: 101,
          nextManualOrderNumber: 1,
        }, { merge: true });
      });
      console.log('End of day process completed successfully.');
    } catch (error) {
      console.error('Failed to process end of day:', error);
    }
  }, [storeId]);

  return {
    orders,
    isNewOrder,
    filterOrdersByStatus,
    updateOrderStatus,
    handleEndOfDay,
  };
};
