import { create } from "zustand";
import { persist } from "zustand/middleware";

const useCompareStore = create(
  persist(
    (set, get) => ({
      compareProducts: [], // max 3 products

      addToCompare: (product) => {
        if (!product?._id) return;

        const { compareProducts } = get();

        // Already added?
        if (compareProducts.some((p) => p._id === product._id)) {
          return;
        }

        // Limit to 3
        if (compareProducts.length >= 3) {
          alert("You can compare maximum 3 products at a time.");
          return;
        }

        // Clean & normalize the product for comparison
        const item = {
          _id: product._id,
          name: product.name || "",
          slug: product.slug || product._id,
          brand: product.brand || "",
          price: Number(product.discountPrice ?? product.price ?? 0),
          originalPrice:
            product.price != null ? Number(product.price) : null,
          image:
            (Array.isArray(product.images) && product.images[0]) ||
            product.image ||
            "",
          // Most important → keep full specifications array
          specifications: Array.isArray(product.specifications)
            ? product.specifications.map((s) => ({
                key: s?.key || "",
                value: s?.value || "",
              }))
            : [],
        };

        set({
          compareProducts: [...compareProducts, item],
        });
      },

      removeFromCompare: (id) => {
        set({
          compareProducts: get().compareProducts.filter(
            (p) => p._id !== id
          ),
        });
      },

      clearCompare: () => set({ compareProducts: [] }),

      // Optional helper
      isInCompare: (id) => {
        return get().compareProducts.some((p) => p._id === id);
      },
    }),
    {
      name: "compare-products",
      // version: 1, // চাইলে পরে version বাড়াতে পারবেন
    }
  )
);

export default useCompareStore;