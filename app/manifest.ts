import type { MetadataRoute } from 'next';

// Next does not prefix URLs inside the generated manifest with basePath.
export const dynamic = 'force-static';
const BASE_PATH = process.env.NODE_ENV === 'production' ? '/cimulity' : '';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tradição Esporte Clube',
    short_name: 'Tradição E.C.',
    description: 'Tradição Esporte Clube — Uma campanha histórica procedural em Cidade de Minas (1910–1959).',
    start_url: `${BASE_PATH}/`,
    scope: `${BASE_PATH}/`,
    display: 'standalone',
    background_color: '#19201d',
    theme_color: '#19201d',
    icons: [{ src: `${BASE_PATH}/icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
