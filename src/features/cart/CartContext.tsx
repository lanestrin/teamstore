import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type { AddCartItem, CartItem } from "./cart.types";

const CART_STORAGE_KEY = "teamstore-cart";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotalInCents: number;
  addItem: (item: AddCartItem) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function readStoredCart(): CartItem[] {
  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!storedCart) {
      return [];
    }

    const parsedCart: unknown = JSON.parse(storedCart);

    return Array.isArray(parsedCart) ? (parsedCart as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>(readStoredCart);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      console.error("Unable to save the cart.");
    }
  }, [items]);

  const addItem = useCallback((item: AddCartItem) => {
    const lineId = item.variantId;
    const quantityToAdd = Math.max(1, item.quantity);

    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (currentItem) => currentItem.lineId === lineId,
      );

      if (!existingItem) {
        return [
          ...currentItems,
          {
            ...item,
            lineId,
            quantity: quantityToAdd,
          },
        ];
      }

      return currentItems.map((currentItem) =>
        currentItem.lineId === lineId
          ? {
              ...currentItem,
              quantity: currentItem.quantity + quantityToAdd,
            }
          : currentItem,
      );
    });
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.lineId === lineId
          ? {
              ...item,
              quantity: Math.max(1, quantity),
            }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.lineId !== lineId),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(
    () =>
      items.reduce((totalQuantity, item) => totalQuantity + item.quantity, 0),
    [items],
  );

  const subtotalInCents = useMemo(
    () =>
      items.reduce(
        (subtotal, item) => subtotal + item.unitPriceInCents * item.quantity,
        0,
      ),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotalInCents,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [
      items,
      itemCount,
      subtotalInCents,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return context;
}
