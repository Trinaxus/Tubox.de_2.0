import { Gallery } from '@/components/GalleryCard';
import gallery1 from '@/assets/gallery-1.jpg';
import gallery2 from '@/assets/gallery-2.jpg';
import gallery3 from '@/assets/gallery-3.jpg';
import gallery4 from '@/assets/gallery-4.jpg';
import gallery5 from '@/assets/gallery-5.jpg';
import gallery6 from '@/assets/gallery-6.jpg';

export const galleries: Gallery[] = [
  {
    id: '1',
    title: 'Best of Trinax',
    image: gallery1,
    tags: ['Best of Trinax'],
    year: '3000',
    mediaCount: 41,
    isPublic: true,
    category: 'BEST OF TRINAX',
    galerie: 'Best of Trinax',
    accessType: 'public'
  },
  {
    id: '2',
    title: '11.08.2025 - Zoo Leipzig',
    image: gallery2,
    tags: ['Best of Trinax'],
    year: '2025',
    mediaCount: 35,
    isPublic: true,
    category: 'BEST OF TRINAX',
    galerie: '11.08.2025 - Zoo Leipzig',
    accessType: 'public'
  },
  {
    id: '3',
    title: '06.07.2025 - expressions_01',
    image: gallery3,
    tags: ['Best of Trinax'],
    year: '2025',
    mediaCount: 10,
    isPublic: true,
    category: 'BEST OF TRINAX',
    galerie: '06.07.2025 - expressions_01',
    accessType: 'public'
  },
  {
    id: '4',
    title: '20.06.2025 - Leipzig - Random',
    image: gallery4,
    tags: ['Best of Trinax'],
    year: '2025',
    mediaCount: 21,
    isPublic: true,
    category: 'LOSTPLACES',
    galerie: '20.06.2025 - Leipzig - Random',
    accessType: 'public'
  },
  {
    id: '5',
    title: '25.04.2025 - VILLA - Soundlabor',
    image: gallery5,
    tags: ['VILLA - Soundlabor', 'Sony A7R IV'],
    year: '2025',
    mediaCount: 35,
    isPublic: true,
    category: 'VILLA - SOUNDLABOR',
    galerie: '25.04.2025 - VILLA - Soundlabor',
    accessType: 'public'
  },
  {
    id: '6',
    title: '28.03.2025 - VILLA - Soundlabor',
    image: gallery6,
    tags: ['villa', 'soundlabor', 'Sony A7R IV'],
    year: '2025',
    mediaCount: 40,
    isPublic: true,
    category: 'VILLA - SOUNDLABOR',
    galerie: '28.03.2025 - VILLA - Soundlabor',
    accessType: 'public'
  }
];