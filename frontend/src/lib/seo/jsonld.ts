/**
 * JSON-LD Schema Configuration
 * Structured data for search engines (Schema.org)
 */

export const generateSoftwareApplicationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Kawa Note",
    description:
      "End-to-end encrypted note-taking app with semantic connections and knowledge graph capabilities.",
    url: "https://kawanote.app",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      category: "Free",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
    },
    author: {
      "@type": "Organization",
      name: "Kawa Note",
      url: "https://kawanote.app",
    },
    image: "https://kawanote.app/og-image.png",
    screenshot: "https://kawanote.app/screenshot.png",
    featureList: [
      "End-to-end encryption",
      "Semantic note connections",
      "Knowledge graph visualization",
      "Multi-folder organization",
      "Tag system with auto-suggestions",
      "Tab-based workspace",
      "Multi-tenant support",
    ],
  };
};

export const generateOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Kawa Note",
    url: "https://kawanote.app",
    logo: "https://kawanote.app/logo.svg",
    description: "Privacy-first encrypted note-taking platform with knowledge graph.",
    sameAs: [
      "https://twitter.com/kawanote",
      "https://github.com/diegofurukawa/kawa_note",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: "support@kawanote.app",
    },
  };
};

export const generateWebsiteSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Kawa Note",
    url: "https://kawanote.app",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://kawanote.app/search?q={search_term_string}",
      },
      query_input: "required name=search_term_string",
    },
  };
};

export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};
