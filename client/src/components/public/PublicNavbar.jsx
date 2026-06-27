import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

const PublicNavbar = () => {
  const activeShop = useAuthStore((s) => s.activeShop);
  const shopContact = activeShop?.contact;
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="header">
      {/* header top */}
      <div className="header-top">
        <div className="mobile-header d-flex justify-content-between align-items-center d-xl-none">
          <Link to="/" className="logo">
            <img src="/assets/images/logo.png" alt="logo" />
          </Link>
        </div>

        <div className="d-none d-xl-flex row align-items-center">
          <div className="col-md-2">
            <Link to="/" className="logo">
              <img src="/assets/images/logo.png" alt="logo" />
            </Link>
          </div>
          <div className="col-md-10">
            <ul
              className="site-action d-none d-lg-flex align-items-center justify-content-end"
              style={{ gap: '20px', listStyle: 'none', margin: 0 }}
            >
              {shopContact?.phone && (
                <li className="site-phone">
                  <a href={`tel:${shopContact.phone}`}>
                    <i className="fas fa-phone"></i> {shopContact.phone}
                  </a>
                </li>
              )}
              {shopContact?.whatsappNumber && (
                <li>
                  <a
                    href={`https://wa.me/${shopContact.whatsappNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#25D366' }}
                  >
                    <i className="fab fa-whatsapp"></i> WhatsApp
                  </a>
                </li>
              )}
              <li>
                <Link to="/login">
                  <i className="fas fa-user mr-1"></i> My Account
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <hr />

      {/* header bottom - main nav */}
      <div className="header-bottom">
        <div className="row m-0 align-items-center">
          <div className="col-md-12">
            <div className="menu-area d-none d-xl-flex justify-content-between align-items-center">
              <ul
                className="menu d-xl-flex flex-wrap list-unstyled"
                style={{ gap: '24px', margin: 0 }}
              >
                <li>
                  <Link
                    to="/"
                    style={{ fontWeight: isActive('/') ? '700' : '400' }}
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/products"
                    style={{ fontWeight: isActive('/products') ? '700' : '400' }}
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    style={{ fontWeight: isActive('/contact') ? '700' : '400' }}
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/profile"
                    style={{ fontWeight: isActive('/profile') ? '700' : '400' }}
                  >
                    Profile
                  </Link>
                </li>
              </ul>

              <ul className="menu-action d-none d-lg-block" style={{ listStyle: 'none', margin: 0 }}>
                <li>
                  <Link to="/dashboard" style={{ color: '#4CAF50', fontWeight: 600 }}>
                    <i className="fas fa-tachometer-alt mr-1"></i> Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* mobile nav */}
            <div className="d-xl-none d-flex" style={{ gap: '16px', padding: '8px 0', flexWrap: 'wrap' }}>
              <Link to="/">Home</Link>
              <Link to="/products">Products</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/profile">Profile</Link>
              <Link to="/dashboard">Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PublicNavbar;
