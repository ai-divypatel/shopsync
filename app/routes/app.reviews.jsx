import { useEffect, useState } from "react";
import {
  Page,
  Card,
  Layout,
  Text,
  Button,
  InlineStack,
  Badge,
  BlockStack,
  Spinner,
  Avatar,
} from "@shopify/polaris";

export const loader = async () => null;

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reviews/load");
      const data = await res.json();
      setReviews(Array.isArray(data?.testimonials) ? data.testimonials : []);
    } catch (err) {
      console.error("Failed to load testimonials:", err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    await fetch("/api/reviews/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, actionType: "approve" }),
    });
    await loadReviews();
  };

  const handleDelete = async (id) => {

    await fetch("/api/reviews/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, actionType: "delete" }),
    });
    await loadReviews();
  };

  useEffect(() => {
    loadReviews();
  }, []);

  return (
    <Page title="Customer Testimonials">
      <Layout>
        <Layout.Section>
          {loading ? (
            <Spinner accessibilityLabel="Loading testimonials" size="large" />
          ) : reviews.length === 0 ? (
            <Card>
              <Text alignment="center">No testimonials found.</Text>
            </Card>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} sectioned>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <InlineStack gap="200" align="start">
                      {review.author_image && (
                        <Avatar
                          customer
                          name={review.author}
                          source={review.author_image}
                        />
                      )}
                      <div>
                        <Text as="h3" variant="headingMd">
                          {review.author || "Unknown Author"}
                        </Text>
                        {review.date && (
                          <Text as="p" variant="bodySm" tone="subdued">
                            {new Date(review.date).toLocaleDateString()}
                          </Text>
                        )}
                      </div>
                    </InlineStack>

                    <Badge tone={review.status === "approved" ? "success" : "attention"}>
                      {review.status || "pending"}
                    </Badge>
                  </InlineStack>

                  <Text as="p">{review.testimonial_text}</Text>
                  {review.rating && <Text as="p">⭐ {review.rating}/5</Text>}

                  <InlineStack gap="300">
                    <Button
                      onClick={() => handleApprove(review.id)}
                      disabled={review.status === "approved"}
                      tone="success"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleDelete(review.id)}
                      tone="critical"
                      variant="secondary"
                    >
                      Delete
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>
            ))
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
