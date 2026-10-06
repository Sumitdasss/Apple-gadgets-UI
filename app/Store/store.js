
import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";

const normalize = (value) => {
  if (value === null || value === undefined) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  if (typeof value === "object") {
    return String(
      value.name ??
        value.value ??
        value.label ??
        value.title ??
        value._id ??
        ""
    ).trim();
  }

  return "";
};

// =====================================================
// PRODUCT ID
// =====================================================

const getProductId = (product) => {
  return String(
    product?.productId ||
      product?._id ||
      product?.id ||
      product?.product?._id ||
      ""
  );
};

// =====================================================
// VARIANT ID
// =====================================================

const getVariantId = (product) => {
  return String(
    product?.variantId ||
      product?.variant?._id ||
      product?.variant?.variantId ||
      ""
  );
};

// =====================================================
// COLOR
// =====================================================

const getColor = (product) => {
  return normalize(
    product?.color ||
      product?.variant?.color
  );
};

// =====================================================
// RAM
// =====================================================

const getRam = (product) => {
  return normalize(
    product?.ram ||
      product?.variant?.ram
  );
};

// =====================================================
// STORAGE
// =====================================================

const getStorage = (product) => {
  return normalize(
    product?.storage ||
      product?.variant?.storage
  );
};

// =====================================================
// CART ITEM UNIQUE KEY
// =====================================================

const getCartKey = (product) => {
  const productId = getProductId(product);
  const variantId = getVariantId(product);
  const color = getColor(product);
  const ram = getRam(product);
  const storage = getStorage(product);

  // Variant থাকলে variantId সবচেয়ে reliable
  if (variantId) {
    return `${productId}__variant__${variantId}`;
  }

  return `${productId}__${color}__${ram}__${storage}`;
};

// =====================================================
// STORE
// =====================================================

const useStore = create(
  persist(
    (set) => ({
      // =================================================
      // STATE
      // =================================================

      cart: [],
      wishlist: [],

      users: [],
      user: null,

      // =================================================
      // REGISTER
      // =================================================

      register: (newUser) => {
        set((state) => ({
          users: [...state.users, newUser],
        }));

        toast.success("Account created successfully!");
      },

      // =================================================
      // LOGIN
      // =================================================

      login: (email, password) => {
        let success = false;

        set((state) => {
          const foundUser = state.users.find(
            (u) =>
              u.email === email &&
              u.password === password
          );

          if (foundUser) {
            success = true;

            toast.success("Login successful!");

            return {
              user: foundUser,
            };
          }

          toast.error("Invalid email or password!");

          return {
            user: null,
          };
        });

        return success;
      },

clearCart: () =>
  set(() => {
    return {
      cart: [],
    };
  }),


      // =================================================
      // LOGOUT
      // =================================================

      logout: () => {
        set({
          user: null,
        });

        toast.success("Logout successfully!");
      },

      // =================================================
      // DELETE ACCOUNT
      // =================================================

      logoutDelet: () => {
        set({
          users: [],
          user: null,
          cart: [],
          wishlist: [],
        });

        toast.success("Account deleted successfully!");
      },

      // =================================================
      // ADD TO CART
      // =================================================

      addTocart: (product) =>
        set((state) => {
          const productId = getProductId(product);
          const variantId = getVariantId(product);
          const color = getColor(product);
          const ram = getRam(product);
          const storage = getStorage(product);

          const cartKey = getCartKey(product);

          const exist = state.cart.find(
            (item) => getCartKey(item) === cartKey
          );

          // =============================================
          // ALREADY SAME PRODUCT + SAME VARIANT
          // =============================================

          if (exist) {
            const currentQuantity = Number(
              exist.quantity || 1
            );

            const stock = Number(
              exist?.variant?.stock ??
                exist?.stock ??
                999999
            );

            if (currentQuantity >= stock) {
              toast.error("Not enough stock");
              return state;
            }

            toast.success(
              `${product.name} quantity increased`
            );

            return {
              cart: state.cart.map((item) =>
                getCartKey(item) === cartKey
                  ? {
                      ...item,
                      quantity: currentQuantity + 1,
                    }
                  : item
              ),
            };
          }

          // =============================================
          // NEW PRODUCT / NEW VARIANT
          // =============================================

          const newCartItem = {
            ...product,

            id: productId,

            productId,

            quantity: 1,

            color,
            ram,
            storage,

            variantId,

            variant: product?.variant
              ? {
                  ...product.variant,
                  color,
                  ram,
                  storage,
                  variantId,
                }
              : null,
          };

          toast.success(
            `${product.name} added to cart`
          );

          return {
            cart: [
              ...state.cart,
              newCartItem,
            ],
          };
        }),

      // =================================================
      // ADD TO WISHLIST
      // =================================================

      addToWishlist: (product) =>
        set((state) => {
          const productId = getProductId(product);

          const exist = state.wishlist.find(
            (item) =>
              getProductId(item) === productId
          );

          if (exist) {
            toast.error(
              `${product.name} removed from wishlist`
            );

            return {
              wishlist: state.wishlist.filter(
                (item) =>
                  getProductId(item) !== productId
              ),
            };
          }

          toast.success(
            `${product.name} added to wishlist`
          );

          return {
            wishlist: [
              ...state.wishlist,
              {
                ...product,
                id: productId,
              },
            ],
          };
        }),

      // =================================================
      // INCREASE QUANTITY
      // =================================================

      increasePopulation: (cartKeyOrId) =>
        set((state) => {
          const product = state.cart.find(
            (item) =>
              getCartKey(item) === cartKeyOrId ||
              getProductId(item) === cartKeyOrId
          );

          if (!product) {
            return state;
          }

          const currentQuantity = Number(
            product.quantity || 1
          );

          const stock = Number(
            product?.variant?.stock ??
              product?.stock ??
              999999
          );

          if (currentQuantity >= stock) {
            toast.error("Not enough stock");
            return state;
          }

          toast.success(
            `${product.name} quantity increased`
          );

          return {
            cart: state.cart.map((item) =>
              getCartKey(item) === getCartKey(product)
                ? {
                    ...item,
                    quantity:
                      currentQuantity + 1,
                  }
                : item
            ),
          };
        }),

      // =================================================
      // REMOVE FROM CART
      // =================================================

      removeFromCart: (cartKeyOrId) =>
        set((state) => {
          const product = state.cart.find(
            (item) =>
              getCartKey(item) === cartKeyOrId ||
              getProductId(item) === cartKeyOrId
          );

          if (product) {
            toast.error(
              `${product.name} removed from cart`
            );
          }

          return {
            cart: state.cart.filter(
              (item) =>
                getCartKey(item) !== cartKeyOrId &&
                getProductId(item) !== cartKeyOrId
            ),
          };
        }),

      // =================================================
      // DECREASE QUANTITY
      // =================================================

      decreasePopulation: (cartKeyOrId) =>
        set((state) => {
          const product = state.cart.find(
            (item) =>
              getCartKey(item) === cartKeyOrId ||
              getProductId(item) === cartKeyOrId
          );

          if (!product) {
            return state;
          }

          const quantity = Number(
            product.quantity || 1
          );

          // =============================================
          // QUANTITY = 1
          // REMOVE
          // =============================================

          if (quantity <= 1) {
            toast.error(
              `${product.name} removed from cart`
            );

            return {
              cart: state.cart.filter(
                (item) =>
                  getCartKey(item) !==
                    getCartKey(product)
              ),
            };
          }

          // =============================================
          // DECREASE
          // =============================================

          toast.success(
            `${product.name} quantity decreased`
          );

          return {
            cart: state.cart.map((item) =>
              getCartKey(item) ===
              getCartKey(product)
                ? {
                    ...item,
                    quantity:
                      quantity - 1,
                  }
                : item
            ),
          };
        }),
    }),

    // ===================================================
    // PERSIST
    // ===================================================

    {
      name: "cart-storage",
    }
  )
);

export default useStore;

