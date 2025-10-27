import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    query {
      metaobjects(first: 50, type: "testimonials") {
        edges {
          node {
            id
            handle
            fields {
              key
              value
            }
          }
        }
      }
    }
  `);

  const data = await response.json();

  const testimonials = data.data.metaobjects.edges.map(edge => {
    const obj = {};
    edge.node.fields.forEach(f => {
      obj[f.key] = f.value;
    });
    return { id: edge.node.id, handle: edge.node.handle, ...obj };
  });

  // Optional: sort by sort_order
  testimonials.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));

  return new Response(JSON.stringify({ testimonials }), {
    headers: { "Content-Type": "application/json" },
  });
};
