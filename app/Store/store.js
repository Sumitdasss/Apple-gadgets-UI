import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";

const useStore = create(
  persist(
    (set) => ({
      // ==========================================
      // STATE
      // ==========================================

      cart: [],
      wishlist: [],

      users: [],
      user: null,

      // ==========================================
      // REGISTER
      // ==========================================

      register: (newUser) => {
        set((state) => ({
          users: [...state.users, newUser],
        }));

        toast.success(
          "Account created successfully!"
        );
      },

      // ==========================================
      // LOGIN
      // ==========================================

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

            toast.success(
              "Login successful!"
            );

            return {
              user: foundUser,
            };
          }

          toast.error(
            "Invalid email or password!"
          );

          return {
            user: null,
          };
        });

        return success;
      },

      // ==========================================
      // LOGOUT
      // ==========================================

      logout: () => {
        set({
          user: null,
        });

        toast.success(
          "Logout successfully!"
        );
      },

      // ==========================================
      // DELETE ACCOUNT
      // ==========================================

      logoutDelet: () => {
        set({
          users: [],
          user: null,
          cart: [],
          wishlist: [],
        });

        toast.success(
          "Account deleted successfully!"
        );
      },

      // ==========================================
      // ADD TO CART
      // ==========================================

     addTocart: (product) =>
  set((state) => {
    const productId =
      product._id || product.id;

    const exist = state.cart.find(
      (item) =>
        (item._id || item.id) === productId
    );

    if (exist) {
      return {
        cart: state.cart.map((item) =>
          (item._id || item.id) === productId
            ? {
                ...item,
                quantity:
                  Number(item.quantity || 1) + 1,
              }
            : item
        ),
      };
    }

    return {
      cart: [
        ...state.cart,
        {
          ...product,
          id: productId,
          quantity: 1,
        },
      ],
    };
  }),

      // ==========================================
      // ADD TO WISHLIST
      // ==========================================

      addToWishlist: (product) =>
        set((state) => {

          const productId =
            product._id || product.id;

          const exist =
            state.wishlist.find(
              (item) =>
                (item._id || item.id) ===
                productId
            );

          if (exist) {

            toast.error(
              `${product.name} removed from wishlist`
            );

            return {
              wishlist:
                state.wishlist.filter(
                  (item) =>
                    (item._id || item.id) !==
                    productId
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

      // ==========================================
      // INCREASE QUANTITY
      // ==========================================

      increasePopulation: (id) =>
        set((state) => {

          const product =
            state.cart.find(
              (item) =>
                (item._id || item.id) === id
            );

          if (!product) {
            return state;
          }

          // --------------------------------------
          // STOCK CHECK
          // --------------------------------------

          const stock = Number(
            product.stock || 999999
          );

          const currentQuantity =
            Number(
              product.quantity || 1
            );

          if (
            currentQuantity >= stock
          ) {
            toast.error(
              "Not enough stock"
            );

            return state;
          }

          toast.success(
            `${product.name} quantity increased`
          );

          return {
            cart: state.cart.map(
              (item) =>
                (item._id || item.id) === id
                  ? {
                      ...item,
                      quantity:
                        currentQuantity + 1,
                    }
                  : item
            ),
          };
        }),

      // ==========================================
      // REMOVE FROM CART
      // ==========================================

      removeFromCart: (id) =>
        set((state) => {

          const product =
            state.cart.find(
              (item) =>
                (item._id || item.id) === id
            );

          if (product) {
            toast.error(
              `${product.name} removed from cart`
            );
          }

          return {
            cart: state.cart.filter(
              (item) =>
                (item._id || item.id) !== id
            ),
          };
        }),

      // ==========================================
      // DECREASE QUANTITY
      // ==========================================

      decreasePopulation: (id) =>
        set((state) => {

          const product =
            state.cart.find(
              (item) =>
                (item._id || item.id) === id
            );

          if (!product) {
            return state;
          }

          const quantity =
            Number(
              product.quantity || 1
            );

          // --------------------------------------
          // QUANTITY = 1
          // REMOVE PRODUCT
          // --------------------------------------

          if (quantity <= 1) {

            toast.error(
              `${product.name} removed from cart`
            );

            return {
              cart: state.cart.filter(
                (item) =>
                  (item._id || item.id) !==
                  id
              ),
            };
          }

          // --------------------------------------
          // DECREASE
          // --------------------------------------

          toast.success(
            `${product.name} quantity decreased`
          );

          return {
            cart: state.cart.map(
              (item) =>
                (item._id || item.id) === id
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

    // ==========================================
    // PERSIST
    // ==========================================

    {
      name: "cart-storage",
    }
  )
);

export default useStore;
