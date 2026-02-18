/**
 * SEO Metadata Configuration
 * Centralized meta tags for consistent SEO across the application
 */

export const seoMetadata = {
  // Core metadata
  title: "Kawa Note - Encrypted Note-Taking with Knowledge Graph",
  description:
    "End-to-end encrypted note-taking app with semantic connections. Capture ideas, organize in folders, build your knowledge graph. Your notes. Your connections. Only yours.",
  canonical: "https://kawanote.app",
  
  // Robots and indexing
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  googlebot: "index, follow",
  
  // Viewport and charset
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=5.0",
  charset: "UTF-8",
  
  // Language
  language: "pt-BR",
  
  // Theme color
  themeColor: "#0f766e",
  
  // Keywords (for reference, not in meta tag)
  keywords: [
    "encrypted notes",
    "privacy notes",
    "knowledge graph",
    "note-taking app",
    "end-to-end encryption",
    "secure notes",
    "personal knowledge management",
  ],
};

export const generateMetaTags = () => {
  return [
    { name: "description", content: seoMetadata.description },
    { name: "robots", content: seoMetadata.robots },
    { name: "googlebot", content: seoMetadata.googlebot },
    { name: "viewport", content: seoMetadata.viewport },
    { name: "theme-color", content: seoMetadata.themeColor },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    { name: "format-detection", content: "telephone=no" },
  ];
};
