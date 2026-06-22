import { MetadataRoute } from 'next';
import { apiFetch } from '@/utils/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://mrlaptop.lk';
  
  // Static routes
  const routes = [
    '',
    '/catalog',
    '/compare',
    '/about',
    '/contact',
    '/faq',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as 'daily',
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dynamic Product details routes
  let productRoutes: any[] = [];
  try {
    const res = await apiFetch('/products?limit=100');
    if (res.ok) {
      const products = await res.json();
      productRoutes = products.map((p: any) => ({
        url: `${baseUrl}/product/${p.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as 'weekly',
        priority: 0.6,
      }));
    }
  } catch (err) {
    console.error("Sitemap compilation product fetch error", err);
  }

  return [...routes, ...productRoutes];
}
