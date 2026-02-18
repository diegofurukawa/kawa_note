/**
 * Twitter Card Configuration
 * Twitter-specific social sharing metadata
 */

export const twitterCardMetadata = {
  card: "summary_large_image",
  site: "@kawanote",
  creator: "@kawanote",
  title: "Kawa Note - Encrypted Note-Taking",
  description:
    "End-to-end encrypted notes with semantic connections. Your data, your privacy, your knowledge graph.",
  image: "https://kawanote.app/og-image.png",
  imageAlt: "Kawa Note - Encrypted Note-Taking Platform",
};

export const generateTwitterCardTags = (overrides?: Partial<typeof twitterCardMetadata>) => {
  const metadata = { ...twitterCardMetadata, ...overrides };
  
  return [
    { name: "twitter:card", content: metadata.card },
    { name: "twitter:site", content: metadata.site },
    { name: "twitter:creator", content: metadata.creator },
    { name: "twitter:title", content: metadata.title },
    { name: "twitter:description", content: metadata.description },
    { name: "twitter:image", content: metadata.image },
    { name: "twitter:image:alt", content: metadata.imageAlt },
  ];
};
