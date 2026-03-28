import { useState } from 'react';

const ITEMS = [
  { filter: 'living', src: '/images/dormitory1.jpg', alt: 'Dormitory', cap: 'Spacious dormitories' },
  { filter: 'dining', src: '/images/dining1.jpg', alt: 'Dining Area', cap: 'Community dining' },
  { filter: 'activities', src: '/images/yoga.jpg', alt: 'Yoga Session', cap: 'Morning yoga' },
  { filter: 'medical', src: '/images/checkup.jpg', alt: 'Medical Checkup', cap: 'Regular checkups' },
  { filter: 'activities', src: '/images/games.jpg', alt: 'Indoor Games', cap: 'Indoor games' },
  { filter: 'living', src: '/images/garden.jpg', alt: 'Garden Area', cap: 'Peaceful garden' },
  { filter: 'dining', src: '/images/festival-food.jpg', alt: 'Festival Food', cap: 'Festival special meals' },
  { filter: 'activities', src: '/images/celebration.jpg', alt: 'Celebration', cap: 'Birthday celebrations' },
];

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'living', label: 'Living Spaces' },
  { id: 'dining', label: 'Dining' },
  { id: 'activities', label: 'Activities' },
  { id: 'medical', label: 'Medical Care' },
];

export default function GalleryPage() {
  const [active, setActive] = useState('all');

  return (
    <main className="gallery-main editorial-page">
      <section className="gallery-hero">
        <h1>Photo Gallery</h1>
        <p>Glimpses of life at Swagatham Foundation</p>
      </section>

      <section className="full-gallery">
        <div className="container">
          <div className="gallery-filter">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`filter-btn${active === f.id ? ' active' : ''}`}
                data-filter={f.id}
                onClick={() => setActive(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="gallery-container">
            {ITEMS.map((item) => (
              <div
                key={item.src}
                className={`gallery-item ${item.filter}`}
                style={{
                  display: active === 'all' || active === item.filter ? 'block' : 'none',
                }}
              >
                <img src={item.src} alt={item.alt} />
                <div className="gallery-caption">{item.cap}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
