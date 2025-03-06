import slugify from 'slugify';

// Custom slug generation with advanced options
export function generateCustomSlug(
  input: string, 
  options: {
    maxLength?: number;
    preserveSpecialChars?: boolean;
    prefix?: string;
    suffix?: string;
  } = {}
): string {
  const {
    maxLength = 50,  // Default max length
    preserveSpecialChars = false,
    prefix = '',
    suffix = ''
  } = options;

  // Base slugify configuration
  const baseSlug = slugify(input, {
    replacement: '-',     // replace spaces with -
    remove: preserveSpecialChars ? undefined : /[*+~.()'"!:@]/g,
    lower: true,          // convert to lowercase
    strict: true,         // strip special characters
    locale: 'vi',         // language-specific transliterations
    trim: true            // trim leading/trailing separator
  });

  // Truncate to max length
  let truncatedSlug = baseSlug.slice(0, maxLength);

  // Remove trailing hyphens
  truncatedSlug = truncatedSlug.replace(/-+$/, '');

  // Add optional prefix and suffix
  const finalSlug = `${prefix}${truncatedSlug}${suffix}`.replace(/-+/g, '-');

  return finalSlug;
}

// Example use cases
export function generateBlogPostSlug(
  title: string, 
  date?: string,
  options: Parameters<typeof generateCustomSlug>[1] = {}
): string {
  // Optional date prefix
  const datePrefix = date 
    ? new Date(date).toISOString().split('T')[0].replace(/-/g, '') + '-' 
    : '';

  return generateCustomSlug(title, {
    maxLength: 60,
    prefix: datePrefix,
    ...options
  });
}

// Unique slug generator for database
export async function generateUniqueSlug(
  supabase: any, 
  baseSlug: string, 
  tableName: string = 'blog_posts'
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('slug')
      .eq('slug', slug)
      .single();

    if (error) {
      // No matching slug found, this is unique
      return slug;
    }

    // Slug exists, try with a number
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
