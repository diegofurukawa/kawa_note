import React from 'react';
import { Card } from "@/components/ui/card";
import { ExternalLink, Globe } from "lucide-react";

/**
 * URL Preview Card component - displays OpenGraph metadata
 * @param {Object} props
 * @param {Object} props.previewData - OpenGraph data
 * @param {string} props.url - Original URL
 * @returns {JSX.Element}
 */
export default function UrlPreviewCard({ previewData, url }) {
  if (!previewData && !url) return null;

  const {
    ogTitle,
    ogDescription,
    ogImage,
    ogSiteName,
    favicon,
    domain
  } = previewData || {};

  return (
    <Card className="p-4 border-slate-200 hover:border-slate-300 transition-colors">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block group"
      >
        <div className="flex gap-4">
          {/* Image */}
          {ogImage && (
            <div className="w-32 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-100">
              <img
                src={ogImage}
                alt={ogTitle || 'Preview'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2">
              {favicon ? (
                <img
                  src={favicon}
                  alt=""
                  className="w-4 h-4 mt-0.5 shrink-0"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <Globe className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 truncate">
                  {ogSiteName || domain || new URL(url).hostname}
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
            </div>

            {ogTitle && (
              <h4 className="font-medium text-slate-900 mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                {ogTitle}
              </h4>
            )}

            {ogDescription && (
              <p className="text-sm text-slate-600 line-clamp-2">
                {ogDescription}
              </p>
            )}

            {!ogTitle && !ogDescription && (
              <p className="text-sm text-slate-500 truncate">{url}</p>
            )}
          </div>
        </div>
      </a>
    </Card>
  );
}
