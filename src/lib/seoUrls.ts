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

// Extract product ID from slug format (e.g., "product-name-uuid" -> "uuid")
export function extractProductId(slugId: string): string {
  // If it's already a UUID, return it
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(slugId)) {
    return slugId;
  }
  
  // Check if there's an id query parameter
  if (slugId.includes('?id=')) {
    const id = slugId.split('?id=')[1];
    if (id) return id.split('&')[0];
  }
  
  // Extract UUID from end of slug (format: slug-uuid where uuid has 5 parts)
  const parts = slugId.split('-');
  if (parts.length >= 5) {
    // UUID has format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (5 parts)
    const potentialUuid = parts.slice(-5).join('-');
    if (uuidRegex.test(potentialUuid)) {
      return potentialUuid;
    }
  }
  
  // Otherwise, return the slugId as-is (might be just the ID)
  return slugId;
}

// Check if a product is posted by admin (has manual contact numbers)
export function isAdminPostedProduct(product: {
  contact_whatsapp?: string | null;
  contact_call?: string | null;
}): boolean {
  return !!(product.contact_whatsapp || product.contact_call);
}
