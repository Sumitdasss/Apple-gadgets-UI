"use client";

import { useEffect, useState } from "react";
import Link from "next/link";


const API_URL = "https://apple-gadgets-ui-backend.vercel.app";

export default function LandingPageView({ slug }) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchPage() {
      try {
        setLoading(true);
        setPage(null);
        setError("");

        const response = await fetch(
          `${API_URL}/api/landing-pages/public/${encodeURIComponent(slug)}`,
          { signal: controller.signal },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Page not found");
        }

        setPage(result.data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchPage();

    return () => controller.abort();
  }, [slug]);

  if (loading) return <p>Loading landing page...</p>;

  if (error || !page) {
    return <h1>Landing page not found</h1>;
  }

  return (
    <main className="dynamic-landing-page">
      {page.sections.map((section) => (
        <section key={section._id} className={`lp-${section.type}`}>
          {section.type === "hero" && (
            <>
              {section.image && (
                <img src={section.image} alt={section.title} />
              )}

              <h1>{section.title}</h1>
              <p>{section.subtitle}</p>

              {section.buttonText && (
                <Link href={section.buttonLink || "/"}>
                  {section.buttonText}
                </Link>
              )}
            </>
          )}

          {section.type === "banner" && (
            <>
              {section.image && (
                <img src={section.image} alt={section.title} />
              )}
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </>
          )}

          {section.type === "features" && (
            <>
              <h2>{section.title}</h2>

              <div className="lp-features-grid">
                {section.features?.map((feature, index) => (
                  <article key={index}>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </article>
                ))}
              </div>
            </>
          )}

          {section.type === "products" && (
            <>
              <h2>{section.title}</h2>

              <div className="lp-products-grid">
                {(section.productIds || []).map((product) => (
                  <article key={product._id}>
                    {product.images?.[0] && (
                      <img
                        src={
                          typeof product.images[0] === "string"
                            ? product.images[0]
                            : product.images[0].url
                        }
                        alt={product.name}
                      />
                    )}

                    <h3>{product.name}</h3>
                    <p>৳{product.discountPrice ?? product.price}</p>

                    <Link href={`/products/${product.slug}`}>
                      View Product
                    </Link>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      ))}
    </main>
  );
}