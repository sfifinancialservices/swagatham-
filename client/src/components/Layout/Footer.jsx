import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="main-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <h3>Contact Info</h3>
            <address>
              <p>
                <i className="fas fa-map-marker-alt" /> City Office: 6, Kamadhenu 3rd St, Mogappair East,
                Chennai
              </p>
              <p>
                <i className="fas fa-home" /> Facility: Amudurmedu Village, Chennai
              </p>
              <p>
                <i className="fas fa-phone" /> +91 96771 34399
              </p>
              <p>
                <i className="fas fa-envelope" /> swagathamfoundation.oldagehome@gmail.com
              </p>
            </address>
            <div className="social-icons">
              <a href="https://www.facebook.com/Swagatham-Foundation-1440815902866146" target="_blank" rel="noreferrer">
                <i className="fab fa-facebook" />
              </a>
              <a href="#" aria-label="Twitter">
                <i className="fab fa-twitter" />
              </a>
              <a href="https://www.instagram.com/p/DJgLrWwyplf/?img_index=7" target="_blank" rel="noreferrer">
                <i className="fab fa-instagram" />
              </a>
              <a href="https://www.youtube.com/channel/UC3WJFBLv5bYwRrmcbWR1yoQ" target="_blank" rel="noreferrer">
                <i className="fab fa-youtube" />
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h3>Quick Links</h3>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/about">About Us</Link>
              </li>
              <li>
                <Link to="/facilities">Facilities</Link>
              </li>
              <li>
                <Link to="/gallery">Gallery</Link>
              </li>
              <li>
                <Link to="/donate">Donate</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Legal</h3>
            <ul>
              <li>
                <a href="#">Privacy Policy</a>
              </li>
              <li>
                <a href="#">Terms of Service</a>
              </li>
              <li>
                <a href="#">Trust Registration</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2023 Swagatham Foundation. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
