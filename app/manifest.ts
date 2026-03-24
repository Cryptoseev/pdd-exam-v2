import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Экзамен ПДД России',
    short_name: 'ПДД',
    description: 'Тренажёр для подготовки к экзамену ГИБДД',
    start_url: '/',
    display: 'standalone',
    background_color: '#F9FAFB',
    theme_color: '#1A56DB',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
