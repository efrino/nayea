import { useEffect } from 'react';

const SITE_NAME = 'Nayea.id';
const DEFAULT_TITLE = `${SITE_NAME} | Modern & Modesty`;
const DEFAULT_IMAGE = 'https://nayea.id/nayea.jpg';

function setMetaTag(attr, key, content) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Per-page <title>/meta description/Open Graph tags via direct DOM writes
 * (no react-helmet — this SPA has no SSR, and a plain useEffect is simpler
 * and doesn't depend on a third-party context provider working correctly).
 *
 * Note: social-media link-preview scrapers (WhatsApp, Facebook, etc.) don't
 * execute JS, so they'll still see the static tags in index.html, not these
 * — this mainly helps the browser tab title and Google's JS-rendering
 * indexer, not raw link-preview scraping.
 */
export default function SEO({ title, description, image, noindex = false }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
    document.title = fullTitle;

    if (description) setMetaTag('name', 'description', description);

    const robotsTag = document.querySelector('meta[name="robots"]');
    if (noindex) {
      setMetaTag('name', 'robots', 'noindex, nofollow');
    } else if (robotsTag) {
      robotsTag.remove();
    }

    setMetaTag('property', 'og:title', fullTitle);
    if (description) setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', image || DEFAULT_IMAGE);

    setMetaTag('name', 'twitter:title', fullTitle);
    if (description) setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', image || DEFAULT_IMAGE);

    // Reset on unmount so navigating to a page without <SEO> doesn't keep a
    // stale title from whatever page was open before it.
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, image, noindex]);

  return null;
}
