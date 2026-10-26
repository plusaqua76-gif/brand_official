import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Product,
  CartItem,
  GarmentSize,
  GarmentColor,
  CategoryId,
  StoreSettings,
  CustomerOrderInfo,
} from '../types';
import {
  INITIAL_STORE_SETTINGS,
} from '../data/initialProducts';
import {
  db,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from '../firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

interface StoreContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  clearAllProducts: () => Promise<void>;

  cart: CartItem[];
  addToCart: (
    product: Product,
    size: GarmentSize,
    color: GarmentColor,
    quantity?: number
  ) => { success: boolean; message?: string };
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  updateCartVariant: (cartItemId: string, size: GarmentSize, color: GarmentColor) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  isCheckoutModalOpen: boolean;
  setIsCheckoutModalOpen: (open: boolean) => void;

  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;

  activeCategory: CategoryId;
  setActiveCategory: (category: CategoryId) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;

  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;

  isSizeGuideOpen: boolean;
  setIsSizeGuideOpen: (open: boolean) => void;

  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;

  storeSettings: StoreSettings;
  updateStoreSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;

  recentlyViewed: Product[];
  addRecentlyViewed: (product: Product) => void;

  customerInfo: CustomerOrderInfo;
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerOrderInfo>>;

  notificationMessage: string | null;
  showNotification: (msg: string) => void;

  isCloudConnected: boolean;
  isSyncing: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'ch_boutique_products_v1',
  CART: 'ch_boutique_cart_v1',
  WISHLIST: 'ch_boutique_wishlist_v1',
  SETTINGS: 'ch_boutique_settings_v1',
  RECENTLY_VIEWED: 'ch_boutique_recent_v1',
  CUSTOMER_INFO: 'ch_boutique_customer_v1',
  INSTAGRAM_FEED: 'ch_boutique_instagram_v1',
};

// Strips undefined values recursively so Firestore accepts every document
function cleanForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map((item) => (typeof item === 'object' && item !== null ? cleanForFirestore(item) : item));
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        cleaned[key] = cleanForFirestore(val);
      }
    }
    return cleaned;
  }
  return obj;
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Products state (initial cache from localStorage, excluding demo items)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        // Exclude demo mock products so user starts clean
        const nonDemo = parsed.filter((p) => !p.id.startsWith('ch-enterizo-') && !p.id.startsWith('ch-vestido-') && !p.id.startsWith('ch-conjunto-') && !p.id.startsWith('ch-blusa-') && !p.id.startsWith('ch-pantalon-') && !p.id.startsWith('ch-accesorio-'));
        return nonDemo;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Store Settings state
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return { ...INITIAL_STORE_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return INITIAL_STORE_SETTINGS;
  });

  // Local storage synchronization
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(storeSettings));
    } catch {
      // ignore
    }
  }, [storeSettings]);

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Wishlist
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WISHLIST);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  // Customer Info
  const [customerInfo, setCustomerInfo] = useState<CustomerOrderInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_INFO);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      fullName: '',
      phone: '',
      department: 'Bogotá D.C.',
      city: 'Bogotá',
      address: '',
      neighborhood: '',
      observations: '',
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_INFO, JSON.stringify(customerInfo));
    } catch {
      // ignore
    }
  }, [customerInfo]);

  // UI state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotificationMessage(msg);
    setTimeout(() => {
      setNotificationMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const addRecentlyViewed = (product: Product) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      return [product, ...filtered].slice(0, 6);
    });
  };

  // REAL-TIME FIRESTORE SYNCHRONIZATION
  useEffect(() => {
    testFirestoreConnection();

    // 1. Listen to products collection
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        setIsCloudConnected(true);
        if (snapshot.empty) {
          setProducts([]);
        } else {
          const cloudProds: Product[] = [];
          snapshot.forEach((docSnap) => {
            cloudProds.push(docSnap.data() as Product);
          });
          // Sort by creation date or retain order
          cloudProds.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setProducts(cloudProds);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'products');
      }
    );

    // 2. Listen to settings document
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'main'),
      async (docSnap) => {
        if (!docSnap.exists()) {
          try {
            await setDoc(doc(db, 'settings', 'main'), cleanForFirestore(INITIAL_STORE_SETTINGS));
          } catch (err) {
            console.error('Error al inicializar settings en Firestore:', err);
          }
        } else {
          setStoreSettings(docSnap.data() as StoreSettings);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/main');
      }
    );

    return () => {
      unsubProducts();
      unsubSettings();
    };
  }, []);

  // CRUD Operations synced with Cloud Firestore
  const addProduct = async (newProduct: Product) => {
    setIsSyncing(true);
    // Optimistic local update
    setProducts((prev) => [newProduct, ...prev]);
    showNotification(`Guardando "${newProduct.name}" en la nube...`);

    try {
      await setDoc(doc(db, 'products', newProduct.id), cleanForFirestore(newProduct));
      showNotification(`"${newProduct.name}" guardado exitosamente en Firebase`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${newProduct.id}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateProduct = async (updated: Product) => {
    setIsSyncing(true);
    // Optimistic update
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (selectedProduct?.id === updated.id) {
      setSelectedProduct(updated);
    }
    showNotification(`Actualizando "${updated.name}" en la nube...`);

    try {
      await setDoc(doc(db, 'products', updated.id), cleanForFirestore(updated));
      showNotification(`"${updated.name}" actualizado en la nube`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${updated.id}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteProduct = async (id: string) => {
    setIsSyncing(true);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showNotification('Eliminando de la nube...');

    try {
      await deleteDoc(doc(db, 'products', id));
      showNotification('Prenda eliminada de la base de datos');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const clearAllProducts = async () => {
    setIsSyncing(true);
    showNotification('Limpiando base de datos en la nube...');
    try {
      const snap = await getDocs(collection(db, 'products'));
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      setProducts([]);
      try {
        localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      } catch {
        // ignore
      }
      showNotification('Catálogo limpiado. Listo para registrar tus prendas originales.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'products');
    } finally {
      setIsSyncing(false);
    }
  };

  const updateStoreSettings = async (newSettings: Partial<StoreSettings>) => {
    setIsSyncing(true);
    const updated = { ...storeSettings, ...newSettings };
    setStoreSettings(updated);
    showNotification('Guardando ajustes en la nube...');

    try {
      await setDoc(doc(db, 'settings', 'main'), cleanForFirestore(updated));
      showNotification('Ajustes guardados en Firebase Cloud');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/main');
    } finally {
      setIsSyncing(false);
    }
  };

  const addToCart = (
    product: Product,
    size: GarmentSize,
    color: GarmentColor,
    quantity: number = 1
  ): { success: boolean; message?: string } => {
    // Check variant stock
    const variant = product.inventory?.find(
      (v) => v.size === size && v.color.toLowerCase() === color.name.toLowerCase()
    );

    const availableStock = variant !== undefined ? variant.stock : 10;

    if (availableStock <= 0) {
      return {
        success: false,
        message: `La talla ${size} en ${color.name} se encuentra agotada momentáneamente.`,
      };
    }

    const cartItemId = `${product.id}_${size}_${color.name}`;
    const existingIndex = cart.findIndex((item) => item.id === cartItemId);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + quantity > availableStock) {
        return {
          success: false,
          message: `Solo hay ${availableStock} unidad(es) disponible(s) en este momento.`,
        };
      }
      setCart((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
        )
      );
    } else {
      if (quantity > availableStock) {
        return {
          success: false,
          message: `Solo hay ${availableStock} unidad(es) disponible(s).`,
        };
      }
      const newItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        product,
        selectedSize: size,
        selectedColor: color,
        quantity,
        unitPrice: product.price,
      };
      setCart((prev) => [newItem, ...prev]);
    }

    showNotification(`"${product.name}" agregado a tu bolsa`);
    return { success: true };
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateCartQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const variant = item.product.inventory?.find(
            (v) =>
              v.size === item.selectedSize &&
              v.color.toLowerCase() === item.selectedColor.name.toLowerCase()
          );
          const maxStock = variant !== undefined ? variant.stock : 99;
          const clamped = Math.min(newQuantity, maxStock);
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const updateCartVariant = (
    cartItemId: string,
    newSize: GarmentSize,
    newColor: GarmentColor
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const newId = `${item.productId}_${newSize}_${newColor.name}`;
          return {
            ...item,
            id: newId,
            selectedSize: newSize,
            selectedColor: newColor,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        showNotification('Eliminado de tus favoritos');
        return prev.filter((id) => id !== productId);
      } else {
        showNotification('Guardado en tus favoritos ✨');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        products,
        setProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        clearAllProducts,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        updateCartVariant,
        clearCart,
        cartTotal,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
        wishlist,
        toggleWishlist,
        isInWishlist,
        isWishlistOpen,
        setIsWishlistOpen,
        activeCategory,
        setActiveCategory,
        searchQuery,
        setSearchQuery,
        selectedProduct,
        setSelectedProduct,
        quickViewProduct,
        setQuickViewProduct,
        isSizeGuideOpen,
        setIsSizeGuideOpen,
        isAdminOpen,
        setIsAdminOpen,
        storeSettings,
        updateStoreSettings,
        recentlyViewed,
        addRecentlyViewed,
        customerInfo,
        setCustomerInfo,
        notificationMessage,
        showNotification,
        isCloudConnected,
        isSyncing,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
