/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:4000";

const initialFormData = {
  name: "",
  slug: "",
  description: "",
  shortDescription: "",
  category: "",
  subCategory: "",
  childCategory: "",
  subChildCategory:"",
  brand: "",
  price: "",
  discountPrice: "",
  discountPercentage: "",
  stock: "",
  sku: "",
  colors: [],
  sizes: [],
  specifications: [],
  ram:[],
  rating: 0,
  isActive: true,
  isFeatured: false,
  isNew: false,
  isBestSeller: false,
  metaTitle: "",
  metaDescription: "",
  images: [],
};

export default function AddProductPage() {
  const [loading, setLoading] = useState(false);
  const imageInputRef = useRef(null);
const [subChildCategories, setSubChildCategories] = useState([]);
  const [formData, setFormData] = useState(initialFormData);

  const [colorName, setColorName] = useState("");
  const [colorCode, setColorCode] = useState("#000000");
  const [colorImage, setColorImage] = useState(null);
const [colorImagePreview, setColorImagePreview] = useState("");
  const [size, setSize] = useState("");
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [ramValue, setRamValue] = useState("");
const [imagePreviews, setImagePreviews] = useState([]);

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [childCategories, setChildCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showChildCategoryModal, setShowChildCategoryModal] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubCategoryName, setNewSubCategoryName] = useState("");
  const [newChildCategoryName, setNewChildCategoryName] = useState("");

  const [categoryAdding, setCategoryAdding] = useState(false);
  const [subCategoryAdding, setSubCategoryAdding] = useState(false);
  const [childCategoryAdding, setChildCategoryAdding] = useState(false);


  const [newSubChildCategoryName, setNewSubChildCategoryName] =
  useState("");

const [subChildCategoryAdding, setSubChildCategoryAdding] =
  useState(false);

const [showSubChildCategoryModal, setShowSubChildCategoryModal] =
  useState(false);
  // ==============================
  // LOAD CATEGORIES (3 level tree)
  // ==============================
  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError("");

      const response = await fetch(`${API_BASE}/getallcatgoris`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Could not load categories");
      }

      // API shape যাই হোক (array / {categories} / {data}) — সবগুলো handle
      const list = Array.isArray(data)
        ? data
        : data.categories || data.data || [];

      const parentIdOf = (item) => item.parent?._id || item.parent || null;

      // API আগে থেকেই nested children দিলে
      const normalize = (node) => ({
        ...node,
        children: (node.children || []).map(normalize),
      });

      // flat list হলে parent ধরে recursive tree
      const buildChildren = (parentId) =>
        list
          .filter((item) => parentIdOf(item) === parentId)
          .map((item) => ({ ...item, children: buildChildren(item._id) }));

      const hasNested = list.some(
        (item) => Array.isArray(item.children) && item.children.length > 0
      );

      const roots = list.filter((item) => !parentIdOf(item));

      const tree = hasNested
        ? roots.map(normalize)
        : roots.map((item) => ({
            ...item,
            children: buildChildren(item._id),
          }));

      setCategories(tree);
    } catch (error) {
      console.error("Load categories error:", error);
      setCategoriesError(error.message || "Could not load categories");
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // ==============================
  // CATEGORY → SUB CATEGORIES
  // ==============================
  useEffect(() => {
    if (!formData.category) {
      setSubCategories([]);
      return;
    }

    const selected = categories.find(
      (category) => category._id === formData.category
    );

    setSubCategories(selected?.children || []);
  }, [formData.category, categories]);

  // ==============================
  // SUB CATEGORY → CHILD CATEGORIES
  // ==============================
  useEffect(() => {
    if (!formData.subCategory) {
      setChildCategories([]);
      return;
    }

    const selected = subCategories.find(
      (subCategory) => subCategory._id === formData.subCategory
    );

    setChildCategories(selected?.children || []);
  }, [formData.subCategory, subCategories]);


  useEffect(() => {
  if (!formData.childCategory) {
    setSubChildCategories([]);
    return;
  }

  const selected = childCategories.find(
    (childCategory) => childCategory._id === formData.childCategory
  );

  setSubChildCategories(selected?.children || []);
}, [formData.childCategory, childCategories]);
  // ==============================
  // INPUT CHANGE
  // ==============================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Auto generate slug from name
      if (name === "name") {
        updated.slug = value
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");
      }

      // category বদলালে নিচের দুই লেভেল বাদ
      if (name === "category") {
        updated.subCategory = "";
        updated.childCategory = "";
      }

      // sub category বদলালে child category বাদ
      if (name === "subCategory") {
        updated.childCategory = "";
      }

      // Auto calculate discount percentage
      if (name === "price" || name === "discountPrice") {
        const price =
          name === "price" ? parseFloat(value) : parseFloat(prev.price);
        const discountPrice =
          name === "discountPrice"
            ? parseFloat(value)
            : parseFloat(prev.discountPrice);

        if (price > 0 && discountPrice > 0 && discountPrice < price) {
          updated.discountPercentage = (
            ((price - discountPrice) / price) *
            100
          ).toFixed(2);
        } else {
          updated.discountPercentage = "";
        }
      }

      return updated;
    });
  };

  // ==============================
  // IMAGE
  // ==============================
const handleImageChange = (e) => {
  const files = Array.from(e.target.files || []);

  if (!files.length) return;

  const validFiles = files.filter((file) =>
    file.type.startsWith("image/")
  );

  if (validFiles.length !== files.length) {
    alert("Only image files are allowed");
  }

  if (!validFiles.length) return;

  setFormData((prev) => ({
    ...prev,
    images: [...prev.images, ...validFiles],
  }));

  const newPreviews = validFiles.map((file) => ({
    file,
    url: URL.createObjectURL(file),
  }));

  setImagePreviews((prev) => [...prev, ...newPreviews]);

  // একই file আবার select করার সুযোগ
  e.target.value = "";
};

const removeImage = (index) => {
  setFormData((prev) => ({
    ...prev,
    images: prev.images.filter((_, i) => i !== index),
  }));

  setImagePreviews((prev) => {
    const updated = [...prev];

    if (updated[index]?.url) {
      URL.revokeObjectURL(updated[index].url);
    }

    updated.splice(index, 1);

    return updated;
  });
};
  // ==============================
  // COLOR
  // ==============================
  // ==============================
// COLOR
// ==============================

const handleColorImageChange = (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Only image files are allowed");
    return;
  }

  setColorImage(file);

  const previewUrl = URL.createObjectURL(file);
  setColorImagePreview(previewUrl);

  e.target.value = "";
};

const addColor = () => {
  if (!colorName.trim()) {
    alert("Enter color name");
    return;
  }

  if (!colorImage) {
    alert("Please choose an image for this color");
    return;
  }

  if (
    formData.colors.some(
      (c) =>
        c.name.toLowerCase() ===
        colorName.trim().toLowerCase()
    )
  ) {
    alert("This color is already added");
    return;
  }

  setFormData((prev) => ({
    ...prev,

    colors: [
      ...prev.colors,

      {
        name: colorName.trim(),
        code: colorCode,
        imageFile: colorImage,
        imagePreview: colorImagePreview,
      },
    ],
  }));

  setColorName("");
  setColorCode("#000000");
  setColorImage(null);
  setColorImagePreview("");
};

const removeColor = (index) => {
  setFormData((prev) => ({
    ...prev,

    colors: prev.colors.filter(
      (_, i) => i !== index
    ),
  }));
};

  // ==============================
  // SIZE
  // ==============================
  const addSize = () => {
    if (!size.trim()) return;

    if (
      formData.sizes.some((s) => s.toLowerCase() === size.trim().toLowerCase())
    ) {
      alert("This size is already added");
      return;
    }

    setFormData((prev) => ({ ...prev, sizes: [...prev.sizes, size.trim()] }));
    setSize("");
  };

  const removeSize = (index) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  };

  // ==============================
  // SPECIFICATION
  // ==============================
 const addSpecification = () => {
  const key = specKey.trim();
  const value = specValue.trim();

  if (!key) {
    alert("Please enter specification name");
    return;
  }

  if (!value) {
    alert("Please enter specification value");
    return;
  }

  const exists = formData.specifications.some(
    (item) => item.key.toLowerCase() === key.toLowerCase()
  );

  if (exists) {
    alert("This specification already exists");
    return;
  }

  const newSpecification = {
    key,
    value,
  };

  setFormData((prev) => ({
    ...prev,
    specifications: [
      ...prev.specifications,
      newSpecification,
    ],
  }));

  setSpecKey("");
  setSpecValue("");
};

  const removeSpecification = (index) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };




const addRam = () => {
  if (!ramValue.trim()) {
    alert("Enter RAM / Memory value");
    return;
  }

  if (
    formData.ram.some(
      (item) =>
        item.toLowerCase() === ramValue.trim().toLowerCase()
    )
  ) {
    alert("This RAM / Memory is already added");
    return;
  }

  setFormData((prev) => ({
    ...prev,
    ram: [...prev.ram, ramValue.trim()],
  }));

  setRamValue("");
};

const removeRam = (index) => {
  setFormData((prev) => ({
    ...prev,
    ram: prev.ram.filter((_, i) => i !== index),
  }));
};

  
  // ==============================
  // RESET FORM
  // ==============================
  const resetForm = () => {
    setFormData(initialFormData);
   setImagePreviews([]);
    setSubCategories([]);
    setChildCategories([]);
    setColorName("");
    setColorCode("#000000");
    setSize("");
    setSpecKey("");
    setSpecValue("");
    setColorImage(null);
setColorImagePreview("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // ==============================
  // SUBMIT
  // ==============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.images || formData.images.length === 0) {
  alert("Choose at least one product image");
  return;
}

    const rating = parseFloat(formData.rating);
    if (Number.isNaN(rating) || rating < 0 || rating > 5) {
      alert("Rating must be between 0 and 5");
      return;
    }

    if (
      formData.discountPrice &&
      parseFloat(formData.discountPrice) >= parseFloat(formData.price)
    ) {
      alert("Discount price must be lower than price");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();

      data.append("name", formData.name);
      data.append("slug", formData.slug);
      data.append("description", formData.description);
      data.append("shortDescription", formData.shortDescription);
      data.append("category", formData.category);
      data.append("subCategory", formData.subCategory);
      data.append("childCategory", formData.childCategory);
      data.append("subChildCategory", formData.subChildCategory);
      data.append("brand", formData.brand);
      data.append("price", formData.price);
      data.append("discountPrice", formData.discountPrice || "");
      data.append("discountPercentage", formData.discountPercentage || "");
      data.append("stock", formData.stock);
      data.append("sku", formData.sku);
    // ==============================
// COLORS DATA
// ==============================

const colorsWithoutFiles = formData.colors.map(
  (color) => ({
    name: color.name,
    code: color.code,
  })
);

data.append(
  "colors",
  JSON.stringify(colorsWithoutFiles)
);


// ==============================
// COLOR IMAGES
// ==============================

formData.colors.forEach((color) => {
  if (color.imageFile) {
    data.append(
      "colorImages",
      color.imageFile
    );
  }
});

data.append(
  "sizes",
  JSON.stringify(formData.sizes)
);

data.append(
  "ram",
  JSON.stringify(formData.ram)
);

data.append(
  "specifications",
  JSON.stringify(formData.specifications)
);
      data.append("rating", String(rating));
      data.append("isActive", String(formData.isActive));
      data.append("isFeatured", String(formData.isFeatured));
      data.append("isNew", String(formData.isNew));
      data.append("isBestSeller", String(formData.isBestSeller));
      data.append("metaTitle", formData.metaTitle);
      data.append("metaDescription", formData.metaDescription);
   formData.images.forEach((image) => {
  data.append("images", image);
});

      const response = await fetch(`${API_BASE}/addproduct`, {
        method: "POST",
        body: data,
      });

      const text = await response.text();

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = { success: false, message: text || "Invalid server response" };
      }

      if (!response.ok) {
        throw new Error(result.message || "Could not add product");
      }

      alert("Product added");
      resetForm();
    } catch (error) {
      console.error("Add product error:", error);
      alert(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // ADD NEW CATEGORY
  // ==============================
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Enter a category name");
      return;
    }

    try {
      setCategoryAdding(true);

      const response = await fetch(`${API_BASE}/creatcatagori`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim(), parent: null }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not add category");
      }

      const created = data.category || data.data || data;
      const newCategory = { ...created, children: [] };

      setCategories((prev) => [...prev, newCategory]);

      setFormData((prev) => ({
        ...prev,
        category: newCategory._id,
        subCategory: "",
        childCategory: "",
      }));

      setNewCategoryName("");
      setShowCategoryModal(false);
    } catch (error) {
      console.error("Add category error:", error);
      alert(error.message || "Could not add category");
    } finally {
      setCategoryAdding(false);
    }
  };

  // ==============================
  // ADD NEW SUB CATEGORY
  // ==============================
  const handleAddSubCategory = async () => {
    if (!formData.category) {
      alert("Select a category first");
      return;
    }

    if (!newSubCategoryName.trim()) {
      alert("Enter a sub category name");
      return;
    }

    try {
      setSubCategoryAdding(true);

      const response = await fetch(`${API_BASE}/creatcatagori`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSubCategoryName.trim(),
          parent: formData.category,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not add sub category");
      }

      const created = data.category || data.data || data;
      const newSubCategory = { ...created, children: [] };

      // category tree update — এখান থেকেই subCategories dropdown আপডেট হবে
      setCategories((prev) =>
        prev.map((category) =>
          category._id === formData.category
            ? {
                ...category,
                children: [...(category.children || []), newSubCategory],
              }
            : category
        )
      );

      setFormData((prev) => ({
        ...prev,
        subCategory: newSubCategory._id,
        childCategory: "",
      }));

      setNewSubCategoryName("");
      setShowSubCategoryModal(false);
    } catch (error) {
      console.error("Add sub category error:", error);
      alert(error.message || "Could not add sub category");
    } finally {
      setSubCategoryAdding(false);
    }
  };

  // ==============================
  // ADD NEW CHILD CATEGORY
  // ==============================
  const handleAddChildCategory = async () => {
    if (!formData.subCategory) {
      alert("Select a sub category first");
      return;
    }

    if (!newChildCategoryName.trim()) {
      alert("Enter a child category name");
      return;
    }

    try {
      setChildCategoryAdding(true);

      const response = await fetch(`${API_BASE}/creatcatagori`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newChildCategoryName.trim(),
          parent: formData.subCategory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not add child category");
      }

      const created = data.category || data.data || data;
      const newChildCategory = { ...created, children: [] };

      // tree-র তৃতীয় লেভেল আপডেট
      setCategories((prev) =>
        prev.map((category) =>
          category._id !== formData.category
            ? category
            : {
                ...category,
                children: (category.children || []).map((subCategory) =>
                  subCategory._id !== formData.subCategory
                    ? subCategory
                    : {
                        ...subCategory,
                        children: [
                          ...(subCategory.children || []),
                          newChildCategory,
                        ],
                      }
                ),
              }
        )
      );

      setFormData((prev) => ({
        ...prev,
        childCategory: newChildCategory._id,
      }));

      setNewChildCategoryName("");
      setShowChildCategoryModal(false);
    } catch (error) {
      console.error("Add child category error:", error);
      alert(error.message || "Could not add child category");
    } finally {
      setChildCategoryAdding(false);
    }
  };


const handleAddSubChildCategory = async () => {
  if (!formData.childCategory) {
    alert("Select a child category first");
    return;
  }

  if (!newSubChildCategoryName.trim()) {
    alert("Enter a sub child category name");
    return;
  }

  try {
    setSubChildCategoryAdding(true);

    const response = await fetch(`${API_BASE}/creatcatagori`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newSubChildCategoryName.trim(),

        // নতুন category-এর parent হবে Child Category
        parent: formData.childCategory,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Could not add sub child category"
      );
    }

    const created = data.category || data.data || data;

    const newSubChildCategory = {
      ...created,
      children: [],
    };

    // Category
    //   ↓
    // Sub Category
    //   ↓
    // Child Category
    //   ↓
    // এখানে নতুন category ঢুকবে
    setCategories((prev) =>
      prev.map((category) => {
        if (category._id !== formData.category) {
          return category;
        }

        return {
          ...category,
          children: (category.children || []).map((subCategory) => {
            if (subCategory._id !== formData.subCategory) {
              return subCategory;
            }

            return {
              ...subCategory,
              children: (subCategory.children || []).map(
                (childCategory) => {
                  if (childCategory._id !== formData.childCategory) {
                    return childCategory;
                  }

                  return {
                    ...childCategory,

                    // Child-এর ভিতরে নতুন level
                    children: [
                      ...(childCategory.children || []),
                      newSubChildCategory,
                    ],
                  };
                }
              ),
            };
          }),
        };
      })
    );

    setFormData((prev) => ({
      ...prev,
      subChildCategory: newSubChildCategory._id,
    }));

    setNewSubChildCategoryName("");
    setShowSubChildCategoryModal(false);
  } catch (error) {
    console.error("Add sub child category error:", error);
    alert(error.message || "Could not add sub child category");
  } finally {
    setSubChildCategoryAdding(false);
  }
};


  const selectedCategoryName =
    categories.find((c) => c._id === formData.category)?.name || "—";
  const selectedSubCategoryName =
    subCategories.find((s) => s._id === formData.subCategory)?.name || "—";
const selectedChildCategoryName =
  childCategories.find( (childCategory) => childCategory._id === formData.childCategory)?.name || "";
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Add New Product</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a new product for your store
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ================= BASIC INFORMATION ================= */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold text-slate-900">
              Basic Information
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />

              <Input
                label="Slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="product-slug"
                required
              />

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  required
                  placeholder="Write product description..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  Short Description
                </label>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Short product description..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </section>

          {/* ================= CATEGORY ================= */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold text-slate-900">
              Category &amp; Brand
            </h2>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {/* CATEGORY */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Category
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    + Add
                  </button>
                </div>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  disabled={categoriesLoading}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">
                    {categoriesLoading
                      ? "Loading categories..."
                      : categories.length === 0
                      ? "No category yet"
                      : "Select category"}
                  </option>

                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {categoriesError && (
                  <p className="mt-2 text-sm text-red-600">
                    {categoriesError}{" "}
                    <button
                      type="button"
                      onClick={loadCategories}
                      className="font-semibold underline"
                    >
                      Try again
                    </button>
                  </p>
                )}
              </div>

              {/* SUB CATEGORY */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Sub Category
                  </label>

                  <button
                    type="button"
                    disabled={!formData.category}
                    onClick={() => setShowSubCategoryModal(true)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    + Add
                  </button>
                </div>

                <select
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  disabled={!formData.category}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">
                    {!formData.category
                      ? "Select a category first"
                      : subCategories.length === 0
                      ? "No sub category yet"
                      : "Select sub category"}
                  </option>

                  {subCategories.map((subCategory) => (
                    <option key={subCategory._id} value={subCategory._id}>
                      {subCategory.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* CHILD CATEGORY */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Child Category
                  </label>

                  <button
                    type="button"
                    disabled={!formData.subCategory}
                    onClick={() => setShowChildCategoryModal(true)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    + Add
                  </button>
                </div>

                <select
                  name="childCategory"
                  value={formData.childCategory}
                  onChange={handleChange}
                  disabled={!formData.subCategory}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">
                    {!formData.subCategory
                      ? "Select a sub category first"
                      : childCategories.length === 0
                      ? "No child category yet"
                      : "Select child category"}
                  </option>

                  {childCategories.map((childCategory) => (
                    <option key={childCategory._id} value={childCategory._id}>
                      {childCategory.name}
                    </option>
                  ))}
                </select>
              </div>

{/* ================= SUB CHILD CATEGORY ================= */}
<div>
  <div className="mb-2 flex items-center justify-between">
    <label className="block text-sm font-medium text-slate-700">
      Sub Child Category
    </label>

    <button
      type="button"
      disabled={!formData.childCategory}
      onClick={() => setShowSubChildCategoryModal(true)}
      className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
    >
      + Add
    </button>
  </div>

  <select
    name="subChildCategory"
    value={formData.subChildCategory}
    onChange={handleChange}
    disabled={!formData.childCategory}
    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
  >
    <option value="">
      {!formData.childCategory
        ? "Select a child category first"
        : subChildCategories.length === 0
        ? "No sub child category yet"
        : "Select sub child category"}
    </option>

    {subChildCategories.map((subChildCategory) => (
      <option
        key={subChildCategory._id}
        value={subChildCategory._id}
      >
        {subChildCategory.name}
      </option>
    ))}
  </select>
</div>



              {/* BRAND */}
              <Input
                label="Brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Samsung"
              />
            </div>
          </section>

          {/* ================= PRICE ================= */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold">
              Pricing &amp; Inventory
            </h2>

            <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-5">
              <Input
                label="Price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                placeholder="1000"
                required
                min="0"
                step="0.01"
              />
              <Input
                label="Discount Price"
                name="discountPrice"
                type="number"
                value={formData.discountPrice}
                onChange={handleChange}
                placeholder="900"
                min="0"
                step="0.01"
              />
              <Input
                label="Discount %"
                name="discountPercentage"
                type="number"
                value={formData.discountPercentage}
                onChange={handleChange}
                placeholder="10"
                readOnly
              />
              <Input
                label="Stock"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleChange}
                placeholder="50"
                required
                min="0"
              />
              <Input
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="SKU-001"
              />
            </div>
          </section>

          {/* ================= IMAGE ================= */}
   {/* ================= PRODUCT GALLERY ================= */}
<section className="rounded-2xl bg-white p-6 shadow-sm">
  <h2 className="mb-2 text-xl font-semibold text-slate-900">
    Product Gallery
  </h2>

  <p className="mb-5 text-sm text-slate-500">
    Select multiple product images. You can add as many images as needed.
  </p>

  <input
    ref={imageInputRef}
    type="file"
    accept="image/*"
    multiple
    onChange={handleImageChange}
    className="w-full cursor-pointer rounded-xl border border-dashed border-slate-400 bg-slate-50 p-4"
  />

  {/* Gallery Preview */}
  {imagePreviews.length > 0 && (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {imagePreviews.map((image, index) => (
        <div
          key={`${image.file.name}-${index}`}
          className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <img
            src={image.url}
            alt={`Product image ${index + 1}`}
            className="h-40 w-full object-cover"
          />

          {/* Main image badge */}
          {index === 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
              Main Image
            </span>
          )}

          {/* Remove */}
          <button
            type="button"
            onClick={() => removeImage(index)}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-lg font-bold text-white opacity-90 transition hover:bg-red-600"
          >
            ×
          </button>

          <div className="p-2">
            <p className="truncate text-xs text-slate-500">
              {image.file.name}
            </p>
          </div>
        </div>
      ))}
    </div>
  )}

  {imagePreviews.length === 0 && (
    <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p className="text-sm font-medium text-slate-600">
        No images selected
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Select multiple images to create your product gallery
      </p>
    </div>
  )}
</section>

          {/* ================= COLORS ================= */}
        {/* ================= COLORS ================= */}

<section className="rounded-2xl bg-white p-6 shadow-sm">

  <h2 className="mb-5 text-xl font-semibold">
    Colors
  </h2>

  {/* ================= ADD COLOR ================= */}

  <div className="grid gap-4 md:grid-cols-2">

    {/* COLOR NAME */}

    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Color Name
      </label>

      <input
        type="text"
        value={colorName}
        onChange={(e) =>
          setColorName(e.target.value)
        }
        placeholder="Example: Burgundy"
        className="
          w-full
          rounded-xl
          border
          border-slate-300
          px-4
          py-3
          outline-none
          focus:border-blue-500
        "
      />
    </div>

    {/* COLOR CODE */}

    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Color Code
      </label>

      <div className="flex gap-3">

        <input
          type="color"
          value={colorCode}
          onChange={(e) =>
            setColorCode(e.target.value)
          }
          className="
            h-[48px]
            w-[70px]
            cursor-pointer
            rounded-lg
            border
            border-slate-300
          "
        />

        <input
          type="text"
          value={colorCode}
          onChange={(e) =>
            setColorCode(e.target.value)
          }
          className="
            flex-1
            rounded-xl
            border
            border-slate-300
            px-4
            py-3
            uppercase
            outline-none
            focus:border-blue-500
          "
        />

      </div>
    </div>

  </div>


  {/* ================= COLOR IMAGE ================= */}

  <div className="mt-5">

    <label className="mb-2 block text-sm font-medium text-slate-700">
      Color Image
    </label>

    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

      {/* Upload */}

      <label
        className="
          flex
          h-32
          w-32
          cursor-pointer
          flex-col
          items-center
          justify-center
          overflow-hidden
          rounded-xl
          border-2
          border-dashed
          border-slate-300
          bg-slate-50
          hover:border-blue-500
        "
      >

        {colorImagePreview ? (
          <img
            src={colorImagePreview}
            alt="Color preview"
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <>
            <span className="text-3xl text-slate-400">
              +
            </span>

            <span className="mt-1 text-xs text-slate-500">
              Choose Image
            </span>
          </>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleColorImageChange}
          className="hidden"
        />

      </label>

      {/* File information */}

      <div>

        {colorImage ? (
          <>
            <p className="text-sm font-medium text-slate-700">
              {colorImage.name}
            </p>

            <p className="mt-1 text-xs text-green-600">
              Image selected
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            Upload the phone image for this color
          </p>
        )}

      </div>

    </div>

  </div>


  {/* ================= ADD BUTTON ================= */}

  <button
    type="button"
    onClick={addColor}
    className="
      mt-5
      rounded-xl
      bg-blue-600
      px-6
      py-3
      font-medium
      text-white
      transition
      hover:bg-blue-700
    "
  >
    + Add Color
  </button>


  {/* ================= ADDED COLORS ================= */}

  {formData.colors.length > 0 && (
    <div className="mt-6 space-y-3">

      <h3 className="text-sm font-semibold text-slate-700">
        Added Colors
      </h3>

      {formData.colors.map((color, index) => (
        <div
          key={`${color.name}-${index}`}
          className="
            flex
            items-center
            justify-between
            gap-4
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            p-3
          "
        >

          <div className="flex items-center gap-4">

            {/* IMAGE */}

            {color.imagePreview ? (
              <img
                src={color.imagePreview}
                alt={color.name}
                className="
                  h-16
                  w-16
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  object-contain
                  p-1
                "
              />
            ) : (
              <div
                className="
                  h-16
                  w-16
                  rounded-lg
                  border
                  bg-white
                "
              />
            )}

            {/* COLOR */}

            <div>

              <div className="flex items-center gap-2">

                <span
                  className="
                    h-5
                    w-5
                    rounded-full
                    border
                  "
                  style={{
                    backgroundColor:
                      color.code,
                  }}
                />

                <span className="font-medium">
                  {color.name}
                </span>

              </div>

              <p className="mt-1 text-xs text-slate-500">
                {color.code}
              </p>

            </div>

          </div>


          {/* REMOVE */}

          <button
            type="button"
            onClick={() =>
              removeColor(index)
            }
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              bg-red-50
              text-red-500
              hover:bg-red-100
            "
          >
            ×
          </button>

        </div>
      ))}

    </div>
  )}

</section>

          {/* ================= SIZES ================= */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold">Sizes</h2>

            <div className="flex gap-3">
              <input
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="S / M / L / XL"
                className="flex-1 rounded-xl border border-slate-300 px-4 py-3"
              />
              <button
                type="button"
                onClick={addSize}
                className="rounded-xl bg-blue-600 px-6 py-3 text-white"
              >
                Add size
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {formData.sizes.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="rounded-lg bg-slate-100 px-4 py-2"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeSize(index)}
                    className="ml-3 text-red-500"
                    aria-label={`Remove ${item}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ================= SPECIFICATIONS ================= */}
     {/* ================= SPECIFICATIONS ================= */}
<section className="rounded-2xl bg-white p-6 shadow-sm">
  <div className="mb-6">
    <h2 className="text-xl font-semibold text-slate-900">
      Specifications
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Add product technical specifications
    </p>
  </div>

  {/* Add Specification */}
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
    <h3 className="mb-4 text-base font-semibold text-slate-800">
      Add Specification
    </h3>

    <div className="grid gap-4 md:grid-cols-2">
      {/* Specification Name */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Specification Name
        </label>

        <input
          value={specKey}
          onChange={(e) => setSpecKey(e.target.value)}
          placeholder="e.g. Display Type"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Specification Value */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Specification Value
        </label>

        <input
          value={specValue}
          onChange={(e) => setSpecValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSpecification();
            }
          }}
          placeholder="e.g. LTPO Super Retina XDR OLED, 120Hz"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
    </div>

    <button
      type="button"
      onClick={addSpecification}
      className="mt-4 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
    >
      + Add Specification
    </button>
  </div>

  {/* RAM / MEMORY */}
  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
    <div className="mb-4">
      <h3 className="text-base font-semibold text-slate-800">
        Memory / RAM
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        You can add multiple memory variants
      </p>
    </div>

    <div className="flex flex-col gap-3 md:flex-row">
      <input
        value={ramValue}
        onChange={(e) => setRamValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addRam();
          }
        }}
        placeholder="e.g. 256GB / 12GB RAM"
        className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

      <button
        type="button"
        onClick={addRam}
        className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
      >
        + Add Memory
      </button>
    </div>

    {/* RAM Array */}
    {formData.ram.length > 0 && (
      <div className="mt-4 flex flex-wrap gap-3">
        {formData.ram.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <span className="text-sm font-medium text-slate-700">
              {item}
            </span>

            <button
              type="button"
              onClick={() => removeRam(index)}
              className="font-bold text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    )}
  </div>

  {/* ADDED SPECIFICATIONS */}
  {formData.specifications.length > 0 && (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">
          Added Specifications
        </h3>

        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
          {formData.specifications.length} items
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="divide-y divide-slate-200">
          {formData.specifications.map((item, index) => (
            <div
              key={`${item.key}-${index}`}
              className="grid grid-cols-1 md:grid-cols-[220px_1fr_auto] md:items-center"
            >
              {/* Key */}
              <div className="bg-slate-50 px-4 py-4 font-medium text-slate-700">
                {item.key}
              </div>

              {/* Value */}
              <div className="px-4 py-4 text-sm text-slate-600">
                {item.value}
              </div>

              {/* Remove */}
              <div className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => removeSpecification(index)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}
</section>

          {/* ================= STATUS + RATING ================= */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold">
              Product Status &amp; Rating
            </h2>

            <div className="mb-5">
              <Input
                label="Rating (0-5)"
                name="rating"
                type="number"
                value={formData.rating}
                onChange={handleChange}
                placeholder="0"
                min="0"
                max="5"
                step="0.1"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Checkbox
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                label="Active"
              />
              <Checkbox
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                label="Featured"
              />
              <Checkbox
                name="isNew"
                checked={formData.isNew}
                onChange={handleChange}
                label="New product"
              />
              <Checkbox
                name="isBestSeller"
                checked={formData.isBestSeller}
                onChange={handleChange}
                label="Best seller"
              />
            </div>
          </section>

          {/* ================= SEO ================= */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold">SEO</h2>

            <div className="space-y-5">
              <Input
                label="Meta Title"
                name="metaTitle"
                value={formData.metaTitle}
                onChange={handleChange}
                placeholder="Product SEO title"
              />

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Meta Description
                </label>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleChange}
                  rows={4}
                  placeholder="SEO description..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </section>

          {/* ================= SUBMIT ================= */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="rounded-xl border border-slate-300 px-8 py-4 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Clear form
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-10 py-4 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Adding product..." : "Add product"}
            </button>
          </div>
        </form>
      </div>

      {/* ================= CATEGORY MODAL ================= */}
      <Modal
        open={showCategoryModal}
        title="Add category"
        onClose={() => {
          setShowCategoryModal(false);
          setNewCategoryName("");
        }}
      >
        <input
          autoFocus
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddCategory();
            }
          }}
          placeholder="Category name"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
        />

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setShowCategoryModal(false);
              setNewCategoryName("");
            }}
            className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleAddCategory}
            disabled={categoryAdding}
            className="rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {categoryAdding ? "Saving..." : "Save category"}
          </button>
        </div>
      </Modal>

      {/* ================= SUB CATEGORY MODAL ================= */}
      <Modal
        open={showSubCategoryModal}
        title="Add sub category"
        onClose={() => {
          setShowSubCategoryModal(false);
          setNewSubCategoryName("");
        }}
      >
        <p className="mb-3 text-sm text-slate-500">
          Under{" "}
          <span className="font-semibold text-slate-700">
            {selectedCategoryName}
          </span>
        </p>

        <input
          autoFocus
          value={newSubCategoryName}
          onChange={(e) => setNewSubCategoryName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddSubCategory();
            }
          }}
          placeholder="Sub category name"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
        />

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setShowSubCategoryModal(false);
              setNewSubCategoryName("");
            }}
            className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleAddSubCategory}
            disabled={subCategoryAdding}
            className="rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {subCategoryAdding ? "Saving..." : "Save sub category"}
          </button>
        </div>
      </Modal>

      {/* ================= CHILD CATEGORY MODAL ================= */}
      <Modal
        open={showChildCategoryModal}
        title="Add child category"
        onClose={() => {
          setShowChildCategoryModal(false);
          setNewChildCategoryName("");
        }}
      >
        <p className="mb-3 text-sm text-slate-500">
          Under{" "}
          <span className="font-semibold text-slate-700">
            {selectedCategoryName} › {selectedSubCategoryName}
          </span>
        </p>

        <input
          autoFocus
          value={newChildCategoryName}
          onChange={(e) => setNewChildCategoryName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddChildCategory();
            }
          }}
          placeholder="Child category name"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
        />

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setShowChildCategoryModal(false);
              setNewChildCategoryName("");
            }}
            className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleAddChildCategory}
            disabled={childCategoryAdding}
            className="rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {childCategoryAdding ? "Saving..." : "Save child category"}
          </button>
        </div>
      </Modal>




      <Modal
  open={showSubChildCategoryModal}
  title="Add sub child category"
  onClose={() => {
    setShowSubChildCategoryModal(false);
    setNewSubChildCategoryName("");
  }}
>
  <p className="mb-3 text-sm text-slate-500">
    Under{" "}
    <span className="font-semibold text-slate-700">
      {selectedCategoryName} › {selectedSubCategoryName} ›{" "}
      {selectedChildCategoryName}
    </span>
  </p>

  <input
    autoFocus
    value={newSubChildCategoryName}
    onChange={(e) =>
      setNewSubChildCategoryName(e.target.value)
    }
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddSubChildCategory();
      }
    }}
    placeholder="Sub child category name"
    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
  />

  <div className="mt-5 flex justify-end gap-3">
    <button
      type="button"
      onClick={() => {
        setShowSubChildCategoryModal(false);
        setNewSubChildCategoryName("");
      }}
      className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
    >
      Cancel
    </button>

    <button
      type="button"
      onClick={handleAddSubChildCategory}
      disabled={subChildCategoryAdding}
      className="rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {subChildCategoryAdding
        ? "Saving..."
        : "Save sub child category"}
    </button>
  </div>
</Modal>
    </div>
  );
}

// ======================================
// MODAL
// ======================================
function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h3 className="mb-4 text-lg font-semibold text-slate-900">{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ======================================
// INPUT COMPONENT
// ======================================
function Input({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  ...rest
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        {...rest}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 read-only:bg-slate-50"
      />
    </div>
  );
}

// ======================================
// CHECKBOX
// ======================================
function Checkbox({ name, checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-5 w-5"
      />
      <span className="font-medium text-slate-700">{label}</span>
    </label>
  );
}