import { useState } from 'react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    const n = name.trim();
    const em = email.trim();
    const m = message.trim();
    if (!n || !em || !m) {
      alert('Please fill in all required fields');
      return;
    }
    alert('Thank you for your message! We will get back to you soon.');
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <main className="contact-main editorial-page">
      <section className="contact-hero">
        <h1>Get In Touch</h1>
        <p>We&apos;d love to hear from you</p>
      </section>

      <section className="contact-content">
        <div className="container">
          <div className="contact-info-container">
            <div className="contact-info">
              <h2>Contact Information</h2>
              <div className="info-item">
                <div className="info-icon">
                  <i className="fas fa-map-marker-alt" />
                </div>
                <div className="info-text">
                  <h3>City Office</h3>
                  <p>6, Kamadhenu 3rd St, Mogappair East, Chennai - 600037, Tamilnadu, INDIA</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">
                  <i className="fas fa-home" />
                </div>
                <div className="info-text">
                  <h3>Facility Address</h3>
                  <p>Amudurmedu Village, Poonamallee - Pattabiram Road, Chennai - 600072, Tamilnadu, INDIA</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">
                  <i className="fas fa-phone" />
                </div>
                <div className="info-text">
                  <h3>Phone Numbers</h3>
                  <p>+91 96771 34399 (Administration)</p>
                  <p>+91 72009 62855 (Facility)</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">
                  <i className="fas fa-envelope" />
                </div>
                <div className="info-text">
                  <h3>Email</h3>
                  <p>swagathamfoundation.oldagehome@gmail.com</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">
                  <i className="fas fa-clock" />
                </div>
                <div className="info-text">
                  <h3>Visiting Hours</h3>
                  <p>Monday to Saturday: 10:00 AM to 5:00 PM</p>
                  <p>Sunday: By prior appointment only</p>
                </div>
              </div>
            </div>
          </div>

          <div className="map-container">
            <h2>Our Location</h2>
            <div className="map">
              <iframe
                title="Swagatham Foundation map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.978940775732!2d80.0604307!3d13.0945261!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5289cbd4e0c071%3A0xfe04890825a9e145!2sSwagatham%20Foundation!5e0!3m2!1sen!2sin!4vXXXXXXXXX"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <section className="contact-form-section" style={{ marginTop: '2rem' }}>
            <div className="container">
              <h2>Send a message</h2>
              <form id="contactForm" onSubmit={onSubmit} style={{ maxWidth: 560 }}>
                <div className="form-group">
                  <label htmlFor="cname">Name</label>
                  <input id="cname" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="cemail">Email</label>
                  <input
                    id="cemail"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cmsg">Message</label>
                  <textarea
                    id="cmsg"
                    name="message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary">
                  Send
                </button>
              </form>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
