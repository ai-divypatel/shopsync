import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const body = await request.formData();
  const manufacturer = body.get("manufacturer") || "";

  const query = `
    {
      products(first: 50) {
        edges {
          node {
            id
            title
            handle
            images(first: 1) {
              edges { node { url } }
            }
            metafields(identifiers: [
              { namespace: "custom", key: "manufacturer" },
              { namespace: "custom", key: "product_line" }
            ]) {
              key
              value
            }
          }
        }
      }
    }
  `;

  const response = await admin.graphql(query);
  const json = await response.json();

  let products = json.data.products.edges.map((edge) => {
    const metafields = Object.fromEntries(
      edge.node.metafields.map((m) => [m.key, m.value])
    );
    return {
      id: edge.node.id,
      title: edge.node.title,
      image: edge.node.images.edges[0]?.node.url || "",
      manufacturer: metafields.manufacturer || "",
      product_line: metafields.product_line || "",
    };
  });

  if (manufacturer) {
    products = products.filter(
      (p) => p.manufacturer.toLowerCase() === manufacturer.toLowerCase()
    );
  }

  // Return JSON
  return { products };
};

export default function ProductLinesPage() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const [manufacturer, setManufacturer] = useState("");
  const products = fetcher.data?.products || [];

  const manufacturers = [
    ...new Set(products.map((p) => p.manufacturer).filter(Boolean)),
  ];

  useEffect(() => {
    // Load all products initially
    fetcher.submit({}, { method: "POST" });
  }, []);

  const handleFilter = (value) => {
    setManufacturer(value);
    fetcher.submit({ manufacturer: value }, { method: "POST" });
  };

  return (
    <s-page title="Product Lines">
      <s-section heading="Filter Products by Manufacturer">
        <s-select
          label="Manufacturer"
          placeholder="Select manufacturer"
          value={manufacturer}
          options={[
            { label: "All", value: "" },
            ...manufacturers.map((m) => ({ label: m, value: m })),
          ]}
          onChange={(e) => handleFilter(e.target.value)}
        />
      </s-section>

      <s-section heading="Product Line Results">
        {products.length === 0 ? (
          <s-text>No products found</s-text>
        ) : (
          <s-grid columns="3" gap="base">
            {products.map((p) => (
              <s-card key={p.id}>
                <s-stack gap="tight" alignment="center">
                  {p.image && (
                    <img
                      src={p.image}
                      alt={p.title}
                      style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: "8px",
                      }}
                    />
                  )}
                  <s-heading>{p.title}</s-heading>
                  <s-text size="small" tone="subdued">
                    {p.manufacturer ? p.manufacturer : "No manufacturer"}
                  </s-text>
                  <s-text size="small">{p.product_line}</s-text>
                </s-stack>
              </s-card>
            ))}
          </s-grid>
        )}
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
