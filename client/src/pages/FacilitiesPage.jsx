export default function FacilitiesPage() {
  return (
    <main className="facilities-main editorial-page">
      <section className="facilities-hero">
        <h1>Our Facilities</h1>
        <p>Providing comfort, care and dignity to our senior residents</p>
      </section>

      <section className="intro-section">
        <div className="container">
          <h2>Feel Safe Here...</h2>
          <p>
            God&apos;s greatest gift to us is our parents and the old and infirm deserve the best in the
            evening of their lives. Senior Citizens are allowed to spend their life happily and feel plenty
            of care, love and attention here.
          </p>
        </div>
      </section>

      <section className="project-launch">
        <div className="container">
          <h2>
            <i className="fas fa-home" /> Our Home
          </h2>
          <div className="launch-content">
            <p>
              Swagatham Foundation has commenced its activities in full swing. A piece of prime land of one
              acre has been secured near Pattabhiram on the outskirts of Chennai as a donation from a group
              of well-wishers.
            </p>
            <p>
              The next step was the construction of the premises to accommodate its lofty and ambitious plans.
              The home is equipped with all facilities necessary to make the inmates feel peaceful and
              comfortable. Arrangements have been made for entertainment and healthy pastime as well.
            </p>
          </div>
        </div>
      </section>

      <section className="facilities-list">
        <div className="container">
          <h2>
            <i className="fas fa-list" /> Facilities Offered
          </h2>
          <div className="facility-item">
            <h3>Accommodation</h3>
            <ul>
              <li>Dormitory type accommodation with cot, mattress, bed spreads etc.</li>
              <li>
                Individual items provided: Cot with side cupboard, mattress, Bed spread, Bed sheet, Pillow,
                Towel
              </li>
              <li>SS plate for meals, Tumbler, Coffee mug, small bowl with spoon</li>
            </ul>
          </div>
          <div className="facility-item">
            <h3>Food Services</h3>
            <ul>
              <li>Vegetarian food including morning coffee, breakfast, lunch, evening tea and dinner</li>
              <li>Special meals during festivals or at the request of donors</li>
            </ul>
          </div>
          <div className="facility-item">
            <h3>Recreation & Wellness</h3>
            <ul>
              <li>Entertainment/health facilities like TV/Radio, meditation, yoga etc.</li>
              <li>Special classes/courses may be arranged for happy living</li>
              <li>Medical check-ups arranged periodically</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="terms-section">
        <div className="container">
          <h2>
            <i className="fas fa-file-alt" /> Terms and Conditions for Admission
          </h2>
          <div className="terms-content">
            <div className="terms-item">
              <h3>Eligibility</h3>
              <ul>
                <li>
                  Admission is restricted to Senior Citizens of Indian nationality (both male and female) of
                  60 years and above who cannot stay with family
                </li>
                <li>Medical examination by qualified medical practitioner required before admission</li>
                <li>
                  Persons with contagious/communicable diseases or terminal illness/bedridden condition are
                  not admitted
                </li>
              </ul>
            </div>
            <div className="terms-item">
              <h3>Requirements</h3>
              <ul>
                <li>Must furnish name/address/telephone of close relatives (spouse/children/friends)</li>
                <li>
                  Expected to volunteer in home maintenance (kitchen, washing, cleaning, gardening) for
                  cooperative living
                </li>
              </ul>
            </div>
            <div className="terms-item">
              <h3>Healthcare</h3>
              <ul>
                <li>First aid and necessary medical help provided for normal illness</li>
                <li>
                  Referral to local Govt Hospital or specialty hospital when needed (relatives informed and
                  responsible for expenses)
                </li>
              </ul>
            </div>
            <div className="terms-item">
              <h3>Other Conditions</h3>
              <ul>
                <li>In case of death, relatives will be informed and must handle last rites</li>
                <li>Management will perform last rites if no response from relatives</li>
                <li>Management reserves right of admission and discharge/termination</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
