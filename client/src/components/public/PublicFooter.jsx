import React from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

const PublicFooter = () => {
  const activeShop = useAuthStore((s) => s.activeShop);
  const shopContact = activeShop?.contact;
  const shopLocation = activeShop?.location;

  return (
    <footer className="footer">
      <div className="container">

        {/* newsletter */}
        <div className="footer-newsletter">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-left mb-3 mb-md-0">
              <div className="newsletter-heading">
                <h5>Know it all first!</h5>
                <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
                  Latest products aur offers ke liye subscribe karein
                </p>
              </div>
            </div>
            <div className="col-md-6 d-flex justify-content-center justify-content-md-end">
              <div className="newsletter-form">
                <input type="text" name="email" placeholder="E-mail Address" />
                <button className="submit-btn">
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* footer top */}
        <div className="footer-top">
          <div className="row">

            {/* shop info */}
            <div className="col-md-6 col-lg-3">
              <div className="footer-widget">
                <Link to="/" className="footer-logo">
                  <img src="/assets/images/logo.png" alt="logo" />
                </Link>
                {activeShop?.name && (
                  <p style={{ fontWeight: 600, marginTop: '10px' }}>{activeShop.name}</p>
                )}
                {shopLocation?.address && (
                  <p style={{ fontSize: '13px', color: '#888' }}>
                    <i className="fas fa-map-marker-alt mr-1"></i>
                    {shopLocation.address}
                    {shopLocation.city && `, ${shopLocation.city}`}
                  </p>
                )}
                <ul className="social-media-list d-flex flex-wrap" style={{ gap: '8px', listStyle: 'none', padding: 0 }}>
                  <li><a href="#"><i className="fab fa-facebook-f"></i></a></li>
                  <li><a href="#"><i className="fab fa-twitter"></i></a></li>
                  <li><a href="#"><i className="fab fa-instagram"></i></a></li>
                  {shopContact?.whatsappNumber && (
                    <li>
                      <a
                        href={`https://wa.me/${shopContact.whatsappNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#25D366' }}
                      >
                        <i className="fab fa-whatsapp"></i>
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* quick links */}
            <div className="col-md-6 col-lg-3">
              <div className="footer-widget">
                <h5 className="footer-title">Quick Links</h5>
                <div className="widget-wrapper">
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/products">Products</Link></li>
                    <li><Link to="/contact">Contact Us</Link></li>
                    <li><Link to="/profile">My Profile</Link></li>
                    <li><Link to="/dashboard">Dashboard</Link></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* contact info */}
            <div className="col-md-6 col-lg-3">
              <div className="footer-widget">
                <h5 className="footer-title">Contact Info</h5>
                <div className="widget-wrapper">
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {shopContact?.phone && (
                      <li style={{ marginBottom: '8px' }}>
                        <a href={`tel:${shopContact.phone}`}>
                          <i className="fas fa-phone mr-2"></i>{shopContact.phone}
                        </a>
                      </li>
                    )}
                    {shopContact?.whatsappNumber && (
                      <li style={{ marginBottom: '8px' }}>
                        <a
                          href={`https://wa.me/${shopContact.whatsappNumber}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <i className="fab fa-whatsapp mr-2"></i>{shopContact.whatsappNumber}
                        </a>
                      </li>
                    )}
                    {shopContact?.email && (
                      <li style={{ marginBottom: '8px' }}>
                        <a href={`mailto:${shopContact.email}`}>
                          <i className="fas fa-envelope mr-2"></i>{shopContact.email}
                        </a>
                      </li>
                    )}
                    {!shopContact?.phone && !shopContact?.email && (
                      <li style={{ color: '#888', fontSize: '13px' }}>
                        Contact info available nahi hai
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* payment methods */}
            <div className="col-md-6 col-lg-3">
              <div className="footer-widget">
                <h5 className="footer-title">We Accept</h5>
                <div className="widget-wrapper">
                  <div className="payment-method d-flex flex-wrap" style={{ gap: '8px' }}>
                    <img src="/assets/images/payment/visa.png" alt="visa" />
                    <img src="/assets/images/payment/paypal.png" alt="paypal" />
                    <img src="/assets/images/payment/master.png" alt="mastercard" />
                  </div>
                  <div className="apps-store mt-3" style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                    <a href="#"><img src="/assets/images/app-store/apple.png" alt="app store" /></a>
                    <a href="#"><img src="/assets/images/app-store/google.png" alt="google play" /></a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* footer bottom */}
        <div className="footer-bottom">
          <div className="row">
            <div className="col-md-6 text-center text-md-left mb-3 mb-md-0">
              <p className="copyright">
                Copyright &copy; {new Date().getFullYear()}{' '}
                <Link to="/">
                  {activeShop?.name || 'MarketPulse AI'}
                </Link>
                . All Rights Reserved.
              </p>
            </div>
            <div className="col-md-6 d-flex justify-content-center justify-content-md-end">
              <ul
                className="footer-menu d-flex flex-wrap"
                style={{ gap: '16px', listStyle: 'none', margin: 0, padding: 0 }}
              >
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Use</a></li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default PublicFooter;
