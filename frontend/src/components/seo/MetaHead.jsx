/**
 * MetaHead Component
 * Injects meta tags into document head for SEO and social sharing
 * 
 * Usage:
 * <MetaHead 
 *   title="Custom Title"
 *   description="Custom description"
 *   image="https://example.com/custom-image.png"
 * />
 */

import { useEffect } from 'react';
import { seoMetadata, generateMetaTags } from '@/lib/seo/metadata';
import { openGraphMetadata, generateOpenGraphTags } from '@/lib/seo/openGraph';
import { twitterCardMetadata, generateTwitterCardTags } from '@/lib/seo/twitterCard';

export function MetaHead({
  title = seoMetadata.title,
  description = seoMetadata.description,
  canonical = seoMetadata.canonical,
  image = openGraphMetadata.image.url,
  type = 'website',
  url = seoMetadata.canonical,
  siteName = openGraphMetadata.siteName,
  locale = openGraphMetadata.locale,
  twitterHandle = twitterCardMetadata.site,
  robots = seoMetadata.robots,
  children,
} = {}) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name, content, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attribute}="${name}"]`);

      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, name);
        document.head.appendChild(tag);
      }

      tag.setAttribute('content', content);
    };

    // Core meta tags
    updateMetaTag('description', description);
    updateMetaTag('robots', robots);
    updateMetaTag('viewport', seoMetadata.viewport);
    updateMetaTag('theme-color', seoMetadata.themeColor);

    // Canonical URL
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.rel = 'canonical';
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.href = canonical;

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
    updateMetaTag('og:site_name', siteName, true);
    updateMetaTag('og:locale', locale, true);

    // Twitter Card tags
    updateMetaTag('twitter:card', twitterCardMetadata.card);
    updateMetaTag('twitter:site', twitterHandle);
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:image:alt', 'Kawa Note - Encrypted Note-Taking Platform');

    // Additional meta tags
    updateMetaTag('apple-mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    updateMetaTag('format-detection', 'telephone=no');

    // Cleanup function (optional)
    return () => {
      // Meta tags persist across page changes (intentional for SPA)
    };
  }, [title, description, canonical, image, type, url, siteName, locale, twitterHandle, robots]);

  return <>{children}</>;
}

/**
 * Preset configurations for common pages
 */
export const metaPresets = {
  home: {
    title: 'Kawa Note - Encrypted Note-Taking with Knowledge Graph',
    description: seoMetadata.description,
    type: 'website',
  },
  app: {
    title: 'Kawa Note - Your Notes',
    description: 'Manage your encrypted notes and knowledge graph',
    robots: 'noindex, nofollow', // Don't index app pages
  },
  pricing: {
    title: 'Kawa Note Pricing - Plans for Everyone',
    description: 'Choose the perfect plan for your note-taking needs. Free, Plus, or Premium.',
    type: 'website',
  },
  docs: {
    title: 'Kawa Note Documentation',
    description: 'Learn how to use Kawa Note, manage your notes, and build your knowledge graph.',
    type: 'website',
  },
  blog: {
    title: 'Kawa Note Blog - Privacy, Encryption, Knowledge Management',
    description: 'Read articles about privacy, encryption, and personal knowledge management.',
    type: 'blog',
  },
};

export default MetaHead;
