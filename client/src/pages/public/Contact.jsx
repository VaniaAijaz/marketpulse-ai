import React, { useEffect, useState } from 'react';
import PublicLayout from '../../components/layout/PublicLayout';
import useAuthStore from '../../store/useAuthStore';

const Contact = () => {
  const activeShop = useAuthStore((s) => s.activeShop);
  const shopContact = activeShop?.contact;
  const shopLocation = activeShop?.location;

  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Contact Us - MarketPulse';
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setStatus('validation');
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      await new Promise((res) => setTimeout(res, 800));
      setStatus('success');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>

      {/* breadcrumb */}
      <div className="page-header-section">
        <div className="container">
          <div className="row">
            <div className="col-12 d-flex justify-content-end">
              <ul className="breadcrumb">
                <li><a href="/">Home</a></li>
                <li><span>/</span></li>
                <li>Contact Us</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* contact section */}
      <section className="page-content section-ptb-90">
        <div className="container">
          <div className="row">

            {/* shop info cards */}
            <div className="col-lg-4 mb-4">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {activeShop?.name && (
                  <div className="card p-3" style={{ border: '1px solid #eee', borderRadius: '8px' }}>
                    <div className="d-flex align-items-center" style={{ gap: '12px' }}>
                      <i className="fas fa-store fa-lg" style={{ color: '#4CAF50' }}></i>
                      <div>
                        <small style={{ color: '#888' }}>Shop</small>
                        <p style={{ margin: 0, fontWeight: 600 }}>{activeShop.name}</p>
                      </div>
                    </div>
                  </div>
                )}

                {shopContact?.phone && (
                  <div className="card p-3" style={{ border: '1px solid #eee', borderRadius: '8px' }}>
                    <div className="d-flex align-items-center" style={{ gap: '12px' }}>
                      <i className="fas fa-phone fa-lg" style={{ color: '#2196F3' }}></i>
                      <div>
                        <small style={{ color: '#888' }}>Phone</small>
                        <p style={{ margin: 0, fontWeight: 600 }}>
                          <a href={`tel:${shopContact.phone}`}>{shopContact.phone}</a>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {shopContact?.whatsappNumber && (
                  <div className="card p-3" style={{ border: '1px solid #eee', borderRadius: '8px' }}>
                    <div className="d-flex align-items-center" style={{ gap: '12px' }}>
                      <i className="fab fa-whatsapp fa-lg" style={{ color: '#25D366' }}></i>
                      <div>
                        <small style={{ color: '#888' }}>WhatsApp</small>
                        <p style={{ margin: 0, fontWeight: 600 }}>
                          <a href={`https://wa.me/${shopContact.whatsappNumber}`} target="_blank" rel="noreferrer">
                            {shopContact.whatsappNumber}
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {shopContact?.email && (
                  <div className="card p-3" style={{ border: '1px solid #eee', borderRadius: '8px' }}>
                    <div className="d-flex align-items-center" style={{ gap: '12px' }}>
                      <i className="fas fa-envelope fa-lg" style={{ color: '#FF5722' }}></i>
                      <div>
                        <small style={{ color: '#888' }}>Email</small>
                        <p style={{ margin: 0, fontWeight: 600 }}>
                          <a href={`mailto:${shopContact.email}`}>{shopContact.email}</a>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {shopLocation?.address && (
                  <div className="card p-3" style={{ border: '1px solid #eee', borderRadius: '8px' }}>
                    <div className="d-flex align-items-center" style={{ gap: '12px' }}>
                      <i className="fas fa-map-marker-alt fa-lg" style={{ color: '#E91E63' }}></i>
                      <div>
                        <small style={{ color: '#888' }}>Address</small>
                        <p style={{ margin: 0, fontWeight: 600 }}>
                          {shopLocation.address}
                          {shopLocation.area && `, ${shopLocation.area}`}
                          {shopLocation.city && `, ${shopLocation.city}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!activeShop && (
                  <div className="alert alert-warning">
                    <i className="fas fa-info-circle mr-2"></i>
                    Dashboard se shop select karein taake contact info dikhe.
                  </div>
                )}
              </div>
            </div>

            {/* contact form */}
            <div className="col-lg-8">
              <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', border: '1px solid #eee' }}>
                <h4 style={{ marginBottom: '20px' }}>Send us a Message</h4>

                {status === 'success' && (
                  <div className="alert alert-success mb-3">
                    <i className="fas fa-check-circle mr-2"></i>
                    Aapka message bhej diya gaya! Hum jald reply karein ge.
                  </div>
                )}
                {status === 'error' && (
                  <div className="alert alert-danger mb-3">
                    <i className="fas fa-times-circle mr-2"></i>
                    Message bhejne mein error aaya. Dobara koshish karein.
                  </div>
                )}
                {status === 'validation' && (
                  <div className="alert alert-warning mb-3">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    Naam, email aur message zaroori hain.
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label>Naam <span style={{ color: 'red' }}>*</span></label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        placeholder="Apna naam likhein"
                        value={form.name}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label>Email <span style={{ color: 'red' }}>*</span></label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder="Email address"
                        value={form.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        placeholder="03XX-XXXXXXX"
                        value={form.phone}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label>Message <span style={{ color: 'red' }}>*</span></label>
                      <textarea
                        name="message"
                        className="form-control"
                        rows="5"
                        placeholder="Apna message likhein..."
                        value={form.message}
                        onChange={handleChange}
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                    <div className="col-12">
                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          background: '#4CAF50',
                          color: '#fff',
                          padding: '10px 30px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          opacity: loading ? 0.7 : 1,
                        }}
                      >
                        {loading ? (
                          <><i className="fas fa-spinner fa-spin mr-2"></i>Bhej raha hai...</>
                        ) : (
                          <><i className="fas fa-paper-plane mr-2"></i>Send Message</>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

    </PublicLayout>
  );
};

export default Contact;
