import { useState } from 'react';
import type { Order, OrderStatus } from '../types.ts';

export function useOrderSlice(initialOrders: Order[] = []) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o,
      ),
    );
  };

  const addOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
  };

  return {
    orders,
    setOrders,
    updateOrderStatus,
    addOrder,
  };
}
