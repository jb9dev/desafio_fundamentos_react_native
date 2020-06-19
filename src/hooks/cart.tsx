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
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem('products');
      storagedProducts && setProducts(JSON.parse(storagedProducts));
    }

    loadProducts();
  }, []);

  const saveLocally = useCallback(async (update: Product[]) => {
    await AsyncStorage.setItem('products', JSON.stringify(update));
  }, []);

  const increment = useCallback(
    id => {
      const productsUpdated = products.map(product => {
        if (product.id === id) {
          product.quantity++;
        }

        return product;
      });
      setProducts(productsUpdated);
      saveLocally(productsUpdated);
    },
    [saveLocally, products],
  );

  const decrement = useCallback(
    id => {
      const productsUpdated = products.map(product => {
        if (product.id === id) {
          product.quantity--;
        }

        return product;
      });

      const productsFiltered = productsUpdated.filter(
        product => product.quantity > 0,
      );

      setProducts(productsFiltered);
      saveLocally(productsFiltered);
    },
    [saveLocally, products],
  );

  const addToCart = useCallback(
    product => {
      const findProduct = products.find(item => item.id === product.id);
      if (findProduct) {
        increment(product.id);
      } else {
        product.quantity = 1;
        const productsUpdated = [...products, product];
        setProducts(productsUpdated);
        saveLocally(productsUpdated);
      }

      console.log('products: ', products);
    },
    [products, increment, saveLocally],
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
