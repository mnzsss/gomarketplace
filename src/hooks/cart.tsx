import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const asyncProducts = await AsyncStorage.getItem('@GoMarket:cart');
      setProducts(JSON.parse(asyncProducts || '[]'));
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (item: Omit<Product, 'quantity'>) => {
      const idx = products.findIndex(c => c.id === item.id);

      const next =
        idx < 0
          ? [...products, { ...item, quantity: 1 }]
          : [
              ...products.slice(0, idx),
              { ...products[idx], quantity: products[idx].quantity + 1 },
              ...products.slice(idx + 1, products.length),
            ];
      await AsyncStorage.setItem('@GoMarket:cart', JSON.stringify(next));
      return setProducts(next);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const idx = products.findIndex(c => c.id === id);
      if (idx < 0) return products;
      const next = [
        ...products.slice(0, idx),
        { ...products[idx], quantity: products[idx].quantity + 1 },
        ...products.slice(idx + 1, products.length),
      ];
      await AsyncStorage.setItem('@GoMarket:cart', JSON.stringify(next));

      return setProducts(next);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const idx = products.findIndex(c => c.id === id);
      if (idx < 0) return products;
      const next =
        products[idx].quantity > 1
          ? [
              ...products.slice(0, idx),
              { ...products[idx], quantity: products[idx].quantity - 1 },
              ...products.slice(idx + 1, products.length),
            ]
          : [
              ...products.slice(0, idx),
              ...products.slice(idx + 1, products.length),
            ];
      await AsyncStorage.setItem('@GoMarket:cart', JSON.stringify(next));

      return setProducts(next);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
