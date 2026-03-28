export default function AboutPage() {
  return (
    <main className="about-main editorial-page">
      <section className="about-hero">
        <h1>Our Story</h1>
        <p>Learn about our mission, vision, and the people behind Swagatham Foundation</p>
      </section>

      <section className="detailed-about">
        <div className="container">
          <div className="about-history">
            <h2>About Us</h2>
            <p>
              Swagatham Foundation was formed by eminent and successful personalities who were driven by the
              urge to pay back to society for the gift of prosperity bestowed upon them by providence.
            </p>
            <h3>Project Launched</h3>
            <p>
              Swagatham Foundation has commenced its activities in full swing. A piece of prime land of one
              acre has been secured near Pattabhiram on the outskirts of Chennai as a donation from a group
              of well-wishers.
            </p>
            <p>
              The next step was the construction of the premises to accommodate its lofty and ambitious
              plans. The home is equipped with all facilities necessary to make the inmates feel peaceful and
              comfortable. Arrangements have been made for entertainment and healthy pastime as well.
            </p>
            <h3>Charitable Trust - Home for Senior Citizens</h3>
            <p>
              This home has been established on a no loss no profit basis for old people irrespective of their
              social or economic status. All the inmates are provided with a clean, hygienic environment,
              healthy food and good medical care.
            </p>
            <p>
              The home is created with utmost care and no one would ever feel the lack of love, affection and
              attention. The success of this noble effort hinges on the generous contribution from people like
              yourselves. The infirm old look up to your succour.
            </p>
          </div>

          <div className="trustees-section">
            <h2>Our Leadership</h2>
            <div className="trustees-grid">
              {[
                ['images/trustee1.jpg', 'M Anandan', 'Founder Trustee', 'Chairman & MD, Aptus Value Housing Finance Ltd'],
                ['images/trustee2.jpg', 'M K Ganeshram', 'Founder Trustee', 'Asoka Brickyard, Prasanthi Brick Industry'],
                ['images/trustee3.jpg', 'Dr. R Jayachandran', 'Founder Trustee', 'MD, Guest Hospital'],
                ['images/trustee4.jpg', 'C R Raju', 'Founder Trustee', 'Architect, C R Raju Associates'],
                ['images/trustee5.jpg', 'V K Ranganathan', 'Managing Trustee', 'Mentor & Chief Advisor, Five-star Business Credits Ltd'],
              ].map(([img, name, role, title]) => (
                <div key={name} className="trustee-card">
                  <div className="trustee-image">
                    <img src={`/${img}`} alt={name} />
                  </div>
                  <h3>{name}</h3>
                  <p>{role}</p>
                  <p className="trustee-title">{title}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="donors-section">
            <h2>Our Generous Donors</h2>
            <p>
              The home has come up in a sprawling campus of an acre. We are grateful to the following donors
              for their generous gift of one acre land at Poonamallee-Pattabiram Road:
            </p>
            <ul className="donors-list">
              <li>Dr. R. Jayachandran</li>
              <li>Mr. L. Janarthanan</li>
              <li>Mr. D. Lakshmipathy</li>
              <li>Mr. D. Gowthaman</li>
            </ul>
            <p>The Trust has named Two Halls in the name of the following donors who contributed immensely:</p>
            <ul className="donors-list">
              <li>Mrs Devaki Ammal / Mr. Krishnaswamy Naidu</li>
              <li>Mrs. Krishnaveni / Mr. M. Kothandapany Naidu</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="achievements">
        <div className="container">
          <h2>Our Achievements</h2>
          <div className="achievements-grid">
            <div className="achievement-card">
              <div className="achievement-icon">
                <i className="fas fa-home" />
              </div>
              <div className="achievement-content">
                <h3>150+ Residents</h3>
                <p>Cared for since our inception in 2010</p>
              </div>
            </div>
            <div className="achievement-card">
              <div className="achievement-icon">
                <i className="fas fa-utensils" />
              </div>
              <div className="achievement-content">
                <h3>500,000+ Meals</h3>
                <p>Served to our residents</p>
              </div>
            </div>
            <div className="achievement-card">
              <div className="achievement-icon">
                <i className="fas fa-hand-holding-heart" />
              </div>
              <div className="achievement-content">
                <h3>100+ Donors</h3>
                <p>Supporting our cause annually</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
