import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    console.log("=== /api/reviews/update called ===");

    const { admin } = await authenticate.admin(request);
    console.log("Admin client obtained");

    const body = await request.json();
    console.log("Request body:", body);

    const { id, actionType } = body;

    if (!id || !actionType) {
      console.log("Missing id or actionType");
      return new Response(
        JSON.stringify({ success: false, error: "Missing id or actionType" }),
        { headers: { "Content-Type": "application/json" }, status: 400 }
      );
    }

    let mutationResult;

    if (actionType === "approve") {
      console.log("Approving metaobject with id:", id);
      mutationResult = await admin.graphql(`
        mutation {
          metaobjectUpdate(
            input: { id: "${id}", fields: [{ key: "status", value: "approved" }] }
          ) {
            metaobject { id fields { key value } }
            userErrors { field message }
          }
        }
      `);
    }

    if (actionType === "delete") {
      console.log("Deleting metaobject with id:", id);
      mutationResult = await admin.graphql(`
        mutation {
          metaobjectDelete(id: "${id}") {
            deletedMetaobjectId
            userErrors { field message }
          }
        }
      `);
    }

    const resJson = await mutationResult.json();
    console.log("GraphQL response:", JSON.stringify(resJson, null, 2));

    const errors =
      resJson?.data?.metaobjectUpdate?.userErrors ||
      resJson?.data?.metaobjectDelete?.userErrors;

    if (errors?.length) {
      console.error("GraphQL userErrors:", errors);
      return new Response(
        JSON.stringify({ success: false, error: errors.map(e => e.message).join(", ") }),
        { headers: { "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Mutation successful");
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Action error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
};

export const headers = () => ({
  "Cache-Control": "no-store",
});
