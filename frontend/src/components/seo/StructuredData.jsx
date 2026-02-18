/**
 * StructuredData Component
 * Injects JSON-LD schemas into document head for search engine understanding
 * 
 * Usage:
 * <StructuredData schema={generateSoftwareApplicationSchema()} />
 * <StructuredData schema={generateOrganizationSchema()} />
 * <StructuredData schema={generateBreadcrumbSchema(breadcrumbs)} />
 */

import { useEffect } from 'react';
import {
  generateSoftwareApplicationSchema,
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateBreadcrumbSchema,
} from '@/lib/seo/jsonld';

export function StructuredData({ schema, id = 'structured-data' }) {
  useEffect(() => {
    if (!schema) return;

    // Create or update script tag
    let scriptTag = document.getElementById(id);

    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = id;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    scriptTag.textContent = JSON.stringify(schema);

    return () => {
      // Keep the script tag (it's safe to have multiple JSON-LD schemas)
    };
  }, [schema, id]);

  return null; // This component doesn't render anything
}

/**
 * Preset configurations for common schemas
 */
export const schemaPresets = {
  softwareApplication: generateSoftwareApplicationSchema(),
  organization: generateOrganizationSchema(),
  website: generateWebsiteSchema(),
};

/**
 * Helper component to inject multiple schemas at once
 */
export function StructuredDataMultiple({ schemas = [] }) {
  return (
    <>
      {schemas.map((schema, index) => (
        <StructuredData key={index} schema={schema} id={`structured-data-${index}`} />
      ))}
    </>
  );
}

/**
 * Helper to generate breadcrumb schema from current route
 * 
 * Usage:
 * const breadcrumbs = [
 *   { name: 'Home', url: 'https://kawanote.app' },
 *   { name: 'Docs', url: 'https://kawanote.app/docs' },
 *   { name: 'Getting Started', url: 'https://kawanote.app/docs/getting-started' },
 * ];
 * <StructuredData schema={generateBreadcrumbSchema(breadcrumbs)} />
 */
export function BreadcrumbSchema({ items = [] }) {
  if (!items.length) return null;

  return <StructuredData schema={generateBreadcrumbSchema(items)} id="breadcrumb-schema" />;
}

/**
 * Preset breadcrumbs for common pages
 */
export const breadcrumbPresets = {
  home: [{ name: 'Home', url: 'https://kawanote.app' }],
  docs: [
    { name: 'Home', url: 'https://kawanote.app' },
    { name: 'Documentation', url: 'https://kawanote.app/docs' },
  ],
  pricing: [
    { name: 'Home', url: 'https://kawanote.app' },
    { name: 'Pricing', url: 'https://kawanote.app/pricing' },
  ],
  blog: [
    { name: 'Home', url: 'https://kawanote.app' },
    { name: 'Blog', url: 'https://kawanote.app/blog' },
  ],
};

export default StructuredData;
