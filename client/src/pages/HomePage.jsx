import { Link } from 'react-router-dom';
import MarqueeStrip from '../components/MarqueeStrip';
import { useHeroRotation } from '../hooks/useHeroRotation';
import { useStatsAnimation } from '../hooks/useStatsAnimation';

const HERO_IMAGES = [1, 2, 3, 4, 5, 6].map((n) => `/images/hero-bg${n}.jpg`);

const MARQUEE_ITEMS = [
  'Registered NGO',
  '·',
  'Chennai',
  '·',
  'Senior care since 2010',
  '·',
  '80G eligible',
  '·',
  'Love & dignity',
  '·',
];

export default function HomePage() {
  useHeroRotation('hero', 'hero-bg', 6000);
  useStatsAnimation();

  return (
    <>
      <section className="hero">
        {HERO_IMAGES.map((src) => (
          <div key={src} className="hero-bg" style={{ backgroundImage: `url('${src}')` }} />
        ))}
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-kicker">Swagatham Foundation</p>
          <h1>Providing Love, Care & Dignity to Our Elders</h1>
          <p>A peaceful home for senior citizens in Chennai</p>
          <div className="hero-buttons">
            <Link to="/donate" className="btn-primary">
              Donate Now
            </Link>
            <Link to="/about" className="btn-secondary">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <MarqueeStrip items={MARQUEE_ITEMS} variant="dark" />

      <section className="about-section section-editorial section-editorial--light">
        <div className="container">
          <div className="about-content">
            <h2 className="section-title">About Swagatham Foundation</h2>
            <p>
              Established by successful individuals aiming to give back to society, Swagatham Foundation
              provides a loving home for senior citizens who cannot stay with their families. Our facility
              offers comfortable living, nutritious food, and medical care in a peaceful environment.
            </p>
            <div className="founder-quote">
              <blockquote>&quot;Giving back to society what we&apos;ve received&quot;</blockquote>
            </div>

            <div className="bento-grid bento-home-stats stats-container">
              <div className="bento-cell bento-cell--stat">
                <span className="stat-number" data-count="150">
                  0
                </span>
                <span className="stat-label">Seniors cared for</span>
              </div>
              <div className="bento-cell bento-cell--stat">
                <span className="stat-number" data-count="2010">
                  0
                </span>
                <span className="stat-label">Since year</span>
              </div>
              <div className="bento-cell bento-cell--cta">
                <h3 className="bento-cta-title">Our story</h3>
                <p className="bento-cta-text">Leadership, donors, and the journey so far.</p>
                <Link to="/about" className="btn-primary">
                  Our Story
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="value-props section-editorial section-editorial--dark">
        <div className="container">
          <h2 className="section-title section-title--on-dark">We provide</h2>
          <div className="bento-grid bento-value">
            <article className="bento-cell bento-cell--feature bento-cell--wide">
              <div className="card-icon" aria-hidden>
                🛏️
              </div>
              <h3>Comfortable living</h3>
              <p>
                Dormitory accommodations with all essentials including cots, mattresses, and utensils for
                peaceful living.
              </p>
            </article>
            <article className="bento-cell bento-cell--feature">
              <div className="card-icon" aria-hidden>
                🍲
              </div>
              <h3>Healthy nourishment</h3>
              <p>
                Nutritious vegetarian meals with special dishes during festivals as requested by our donors.
              </p>
            </article>
            <article className="bento-cell bento-cell--feature">
              <div className="card-icon" aria-hidden>
                🩺
              </div>
              <h3>Medical care</h3>
              <p>Regular checkups and emergency care with hospital referrals when needed.</p>
            </article>
          </div>
        </div>
      </section>

      <MarqueeStrip items={['Meals · Yoga · Community · Dignity · Chennai · Swagatham · ']} variant="light" />

      <section className="gallery-preview section-editorial section-editorial--light">
        <div className="container">
          <h2 className="section-title">Life at Swagatham</h2>
          <div className="gallery-grid">
            <div className="gallery-item">
              <img src="/images/dormitory.jpg" alt="Clean dormitories" />
              <div className="gallery-caption">Clean Dormitories</div>
            </div>
            <div className="gallery-item">
              <img src="/images/dining.jpg" alt="Dining area" />
              <div className="gallery-caption">Dining Area</div>
            </div>
            <div className="gallery-item">
              <img src="/images/activities.jpg" alt="Recreational activities" />
              <div className="gallery-caption">Recreational Activities</div>
            </div>
          </div>
          <Link to="/gallery" className="btn-primary">
            View Full Gallery
          </Link>
        </div>
      </section>

      <section className="donation-cta section-editorial section-editorial--accent">
        <div className="container">
          <div className="donation-content">
            <h2>Your Support Brings Smiles to 100+ Seniors</h2>
            <p>Help us continue providing love and care to our elderly residents</p>
            <div className="donation-options">
              <Link to="/donate" className="donation-btn">
                <i className="fas fa-hand-holding-heart" /> One-time Donation
              </Link>
              <Link to="/donate" className="donation-btn">
                <i className="fas fa-calendar-check" /> Monthly Pledge
              </Link>
              <Link to="/donate" className="donation-btn">
                <i className="fas fa-hands-helping" /> Other Ways to Help
              </Link>
            </div>
            <div className="trust-badges">
              <div className="badge">
                <i className="fas fa-certificate" /> Registered NGO
              </div>
              <div className="badge">
                <i className="fas fa-file-invoice-dollar" /> 80G Tax Benefits
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="facilities-preview section-editorial section-editorial--light">
        <div className="container">
          <h2 className="section-title">Our Facilities</h2>
          <div className="bento-grid bento-facilities">
            <div className="bento-cell bento-cell--facility">
              <div className="facility-icon">
                <i className="fas fa-tv" />
              </div>
              <h3>Entertainment</h3>
              <p>TV, radio, and other recreational activities to keep our residents engaged.</p>
            </div>
            <div className="bento-cell bento-cell--facility">
              <div className="facility-icon">
                <i className="fas fa-spa" />
              </div>
              <h3>Wellness</h3>
              <p>Regular yoga and meditation sessions for physical and mental wellbeing.</p>
            </div>
          </div>
          <Link to="/facilities" className="btn-primary">
            See All Facilities
          </Link>
        </div>
      </section>
    </>
  );
}
