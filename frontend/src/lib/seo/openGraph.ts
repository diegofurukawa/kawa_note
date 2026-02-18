/**
 * Open Graph Configuration
 * Social media sharing metadata (Facebook, LinkedIn, etc.)
 */

export const openGraphMetadata = {
  // Basic OG tags
  title: "Kawa Note - Your Notes. Your Connections. Only Yours.",
  description:
    "End-to-end encrypted note-taking with semantic connections. Build your personal knowledge graph with total privacy.",
  type: "website",
  url: "https://kawanote.app",
  siteName: "Kawa Note",
  locale: "pt_BR",
  
  // Image (1200x630 recommended for optimal display)
  image: {
    url: "https://kawanote.app/og-image.png",
    width: 1200,
    height: 630,
    type: "image/png",
    alt: "Kawa Note - Encrypted Note-Taking Platform",
  },
  
  // Alternative images for different contexts
  images: [
    {
      url: "https://kawanote.app/og-image.png",
      width: 1200,
      height: 630,
      type: "image/png",
    },
    {
      url: "https://kawanote.app/og-image-square.png",
      width: 800,
      height: 800,
      type: "image/png",
    },
  ],
};

export const generateOpenGraphTags = (overrides?: Partial<typeof openGraphMetadata>) => {
  const metadata = { ...openGraphMetadata, ...overrides };
  
  return [
    { property: "og:title", content: metadata.title },
    { property: "og:description", content: metadata.description },
    { property: "og:type", content: metadata.type },
    { property: "og:url", content: metadata.url },
    { property: "og:site_name", content: metadata.siteName },
    { property: "og:locale", content: metadata.locale },
    { property: "og:image", content: metadata.image.url },
    { property: "og:image:width", content: metadata.image.width.toString() },
    { property: "og:image:height", content: metadata.image.height.toString() },
    { property: "og:image:type", content: metadata.image.type },
    { property: "og:image:alt", content: metadata.image.alt },
  ];
};
