// SEO-friendly URL utilities

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 60); // Limit length for cleaner URLs
}

export function createProductShareUrl(
  productId: string, 
  productTitle: string, 
  sellerName?: string, 
  isAdminProduct?: boolean
): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const slug = slugify(productTitle);
  
  // Admin products don't include seller name in URL
  if (isAdminProduct || !sellerName) {
    return `${baseUrl}/products/${slug}?id=${productId}`;
  }
  
  const sellerSlug = slugify(sellerName);
  return `${baseUrl}/products/${slug}/by/${sellerSlug}?id=${productId}`;
}

export function createOpportunityShareUrl(
  opportunityId: string,
  title: string,
  posterName?: string
): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const slug = slugify(title);
  
  if (!posterName) {
    return `${baseUrl}/opportunities/${slug}?id=${opportunityId}`;
  }
  
  const posterSlug = slugify(posterName);
  return `${baseUrl}/opportunities/${slug}/by/${posterSlug}?id=${opportunityId}`;
}

export function extractIdFromUrl(search: string): string | null {
  const params = new URLSearchParams(search);
  return params.get('id');
}

// Check if a product is posted by admin (has manual contact numbers)
export function isAdminPostedProduct(product: {
  contact_whatsapp?: string | null;
  contact_call?: string | null;
}): boolean {
  return !!(product.contact_whatsapp || product.contact_call);
}
