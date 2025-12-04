export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 50); // Limit length
}

export function createProductUrl(id: string, title: string): string {
  const slug = slugify(title);
  return `/product/${slug}-${id}`;
}

export function extractProductId(slugWithId: string): string {
  // Extract UUID from end of slug (format: slug-uuid)
  const parts = slugWithId.split('-');
  // UUID has 5 parts when split by dash, so we need last 5 parts
  if (parts.length >= 5) {
    return parts.slice(-5).join('-');
  }
  return slugWithId;
}
