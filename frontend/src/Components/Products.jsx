import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const products = [
  { img: "01", name: "Vegitable Leaf" },
  { img: "02", name: "Green Grave" },
  { img: "03", name: "Kiwi" },
  { img: "04", name: "Red Tomato" },
  { img: "05", name: "Corn on the cob" },
  { img: "06", name: "Radish Vegitable" },
  { img: "07", name: "Healthy Carrots" },
];

// Repeat the 7 base products 3x (21 items) to match original page length
const productList = [...products, ...products, ...products];

const ProductFullwidth = () => {
  useEffect(() => {
    document.title = "eflux - Grocery & Organic Supermarket Responsive Template";
  }, []);

  return (
    <>
      <a className="position-absolute" href="javascript:void(0)">
        <div id="sitebar-drawar" className="sitebar-drawar">
          <div className="cart-count d-flex align-items-center">
            <i className="fas fa-shopping-basket"></i>
            <span>3 Item</span>
          </div>
          <div className="total-price">$15.00</div>
        </div>
      </a>

      {/* admin Modal */}
      <div className="modal fade" id="useradmin1" tabIndex="-1" aria-labelledby="useradmin1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body">
              <div className="header-top-action-dropdown">
                <ul className="submenu">
                  <li><Link to="/profile">Profile</Link></li>
                  <li><a href="#">Sign Out</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* siteinfo Modal */}
      <div className="modal fade" id="siteinfo1" tabIndex="-1" aria-labelledby="siteinfo1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body">
              <div className="header-top-action-dropdown">
                <ul>
                  <li className="site-phone"><a href="tel:000-000-000"><i className="fas fa-phone"></i> 000 000 000</a></li>
                  <li className="site-help"><a href="#"><i className="fas fa-question-circle"></i> Help & More</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* search Modal */}
      <div className="modal fade" id="search-select-id" tabIndex="-1" aria-labelledby="search-select-id" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body">
              <div className="select-search-option">
                <div className="flux-custom-select">
                  <select>
                    <option value="0">Select Catagory</option>
                    <option value="1">Vegetables</option>
                    <option value="2">Fruits</option>
                    <option value="3">Salads</option>
                    <option value="4">Fish & Seafood</option>
                    <option value="5">Fresh Meat</option>
                    <option value="6">Health Product</option>
                    <option value="7">Butter & Eggs</option>
                    <option value="8">Oils & Venegar</option>
                    <option value="9">Frozen Food</option>
                    <option value="10">Jam & Honey</option>
                  </select>
                </div>
                <form action="#" className="search-form">
                  <input type="text" name="search" placeholder="Search for Products" />
                  <button className="submit-btn"><i className="fas fa-search"></i></button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* menu modal */}
      <div className="modal fade" id="menu-id" tabIndex="-1" aria-labelledby="menu-id" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body">
              <ul className="menu d-xl-flex flex-wrap pl-0 list-unstyled">
                <li><Link to="/">Home</Link></li>
                {/* <li><Link to="/about">About</Link></li> */}
                <li><Link to="/contact">Contact Us</Link></li>
                <li><Link to="/products">Products</Link></li>
                <li><Link to="/profile">Profile</Link></li>
                <li><Link to="/signup">Sign Up</Link></li>
                <li><Link to="/signin">Sign In</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* sidebar-cart */}
      <div id="sitebar-cart" className="sitebar-cart">
        <div className="sc-head d-flex justify-content-between align-items-center">
          <div className="cart-count">
            <i className="fas fa-shopping-basket"></i>
            <span>3 Item</span>
          </div>
          <span className="close-icon"><i className="fas fa-times"></i></span>
        </div>
        <div className="cart-product-container">
          {["01", "02", "03"].map((img) => (
            <div className="cart-product-item" key={img}>
              <div className="close-item"><i className="fas fa-times"></i></div>
              <div className="row align-items-center">
                <div className="col-6 p-0">
                  <div className="thumb">
                    <a href="#"><img src={`/assets/images/products/cart/${img}.png`} alt="products" /></a>
                  </div>
                </div>
                <div className="col-6">
                  <div className="product-content">
                    <a href="#" className="product-title">Daisy Cont Oil</a>
                    <div className="product-cart-info">1x 31b</div>
                  </div>
                </div>
              </div>
              <div className="row align-items-center">
                <div className="col-6">
                  <div className="price-increase-decrese-group d-flex">
                    <span className="decrease-btn">
                      <button type="button" className="btn quantity-left-minus" data-type="minus" data-field="">-</button>
                    </span>
                    <input type="text" name="quantity" className="form-controls input-number" defaultValue="1" />
                    <span className="increase">
                      <button type="button" className="btn quantity-right-plus" data-type="plus" data-field="">+</button>
                    </span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="product-price">
                    <del>$8.00</del><span className="ml-4">$5.00</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="cart-footer">
          <div className="product-other-charge">
            <p className="d-flex justify-content-between">
              <span>Delevery charge</span>
              <span>$8.00</span>
            </p>
            <a href="#">Do you have a voucher?</a>
          </div>
          <div className="cart-total">
            <p className="saving d-flex justify-content-between">
              <span>Total Savings</span>
              <span>$11.00</span>
            </p>
            <p className="total-price d-flex justify-content-between">
              <span>Total</span>
              <span>$35.00</span>
            </p>
            <Link to="/checkout" className="procced-checkout">Prosecced Checkout</Link>
          </div>
        </div>
      </div>

      {/* header section start */}
      <header className="header">
        <div className="header-top">
          <div className="mobile-header d-flex justify-content-between align-items-center d-xl-none">
            <div className="all-catagory-option mobile-device">
              <a className="bar-btn"><i className="fas fa-bars"></i><span className="ml-2 d-none d-md-inline">All Catagories</span></a>
              <a className="close-btn"><i className="fas fa-times"></i><span className="ml-2 d-none d-md-inline">All Catagories</span></a>
            </div>
            <Link to="/" className="logo"><img src="/assets/images/logo.png" alt="logo" /></Link>

            <div className="text-center mobile-search">
              <button type="button" data-toggle="modal" data-target="#search-select-id"><i className="fas fa-search"></i></button>
            </div>
          </div>
          <div className="d-none d-xl-flex row align-items-center">
            <div className="col-5 col-md-2">
              <Link to="/" className="logo"><img src="/assets/images/logo.png" alt="logo" /></Link>
            </div>
            <div className="col-5 col-md-9 col-lg-5 pl-lg-5">
              <div className="select-search-option d-none d-md-flex">
                <div className="flux-custom-select">
                  <select>
                    <option value="0">Select Catagory</option>
                    <option value="1">Vegetables</option>
                    <option value="2">Fruits</option>
                    <option value="3">Salads</option>
                    <option value="4">Fish & Seafood</option>
                    <option value="5">Fresh Meat</option>
                    <option value="6">Health Product</option>
                    <option value="7">Butter & Eggs</option>
                    <option value="8">Oils & Venegar</option>
                    <option value="9">Frozen Food</option>
                    <option value="10">Jam & Honey</option>
                  </select>
                </div>
                <form action="#" className="search-form">
                  <input type="text" name="search" placeholder="Search for Products" />
                  <button className="submit-btn"><i className="fas fa-search"></i></button>
                </form>
              </div>
            </div>
            <div className="col-2 col-md-1 col-lg-5">
              <ul className="site-action d-none d-lg-flex align-items-center justify-content-between ml-auto">
                <li className="site-phone"><a href="tel:000-000-000"><i className="fas fa-phone"></i> 000 000 000</a></li>
                <li className="site-help"><a href="#"><i className="fas fa-question-circle"></i> Help & More</a></li>
                <li className="wish-list"><a href="#"><i className="fas fa-heart"></i> <span className="count">04</span></a></li>
                <li className="my-account item-has-children">
                  <a href="#"><i className="fas fa-user mr-1"></i> My Account</a>
                  <ul className="submenu">
                    <li><Link to="/profile">Profile</Link></li>
                    <li><a href="#">Sign Out</a></li>
                  </ul>
                </li>
                <li className="signin-option d-none"><Link to="/signin"><i className="fas fa-user mr-2"></i>Sign In</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <hr />
        <div className="header-bottom">
          <div className="row m-0 align-items-center mega-menu-relative">
            <div className="col-md-2 p-0 d-none d-xl-block">
              <div className="all-catagory-option">
                <a className="bar-btn"><i className="fas fa-bars"></i>All Catagories</a>
                <a className="close-btn"><i className="fas fa-times"></i>All Catagories</a>
              </div>
            </div>
            <div className="col-md-10">
              <div className="menu-area d-none d-xl-flex justify-content-between align-items-center">
                <ul className="menu d-xl-flex flex-wrap list-unstyled">
                  <li><Link to="/">Home</Link></li>
                  <li><Link to="/products">Products</Link></li>
                  {/* <li><Link to="/about">About</Link></li> */}
                  <li><Link to="/contact">Contact Us</Link></li>
                  <li><Link to="/profile">Profile</Link></li>
                  <li><Link to="/signup">Sign Up</Link></li>
                  <li><Link to="/signin">Sign In</Link></li>
                </ul>
                <ul className="menu-action d-none d-lg-block">
                  <li className="cart-option"><a href="#"><span className="cart-icon"><i className="fas fa-shopping-cart"></i><span className="count">3</span></span> <span className="cart-amount">$15.00</span></a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* header section end */}

      <div className="page-layout">
        <div className="catagory-sidebar-area">
          <div className="catagory-sidebar-area-inner">
            <div className="catagory-sidebar all-catagory-option">
              <ul className="catagory-submenu">
                {[
                  ["catagory-widget1", "Vegetables"],
                  ["catagory-widget2", "Fruits"],
                  ["catagory-widget3", "Salads"],
                  ["catagory-widget4", "Fish & seafood"],
                  ["catagory-widget5", "Fresh Meat"],
                  ["catagory-widget6", "Health Products"],
                  ["catagory-widget7", "Butter & Eggs"],
                  ["catagory-widget8", "Oils and Venegar"],
                  ["catagory-widget9", "Frozen Food"],
                  ["catagory-widget10", "Jam & Honey"],
                ].map(([id, label]) => (
                  <li key={id}>
                    <a data-toggle="collapse" href={`#${id}`} role="button" aria-expanded="false" aria-controls={id}>{label}<i className="fas fa-angle-down"></i></a>
                    <ul className="catagory-submenu collapse" id={id}>
                      <li><Link to="/products">Artichoke.</Link></li>
                      <li><Link to="/products">Aubergine (eggplant).</Link></li>
                      <li><Link to="/products">Asparagus.</Link></li>
                      <li><Link to="/products">Broccoflower (a hybrid).</Link></li>
                      <li><Link to="/products">Broccoli (calabrese).</Link></li>
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="main-content-area">
          {/* page-header-section start */}
          <div className="page-header-section">
            <div className="container">
              <div className="row">
                <div className="col-12 d-flex justify-content-between justify-content-md-end">
                  <ul className="breadcrumb">
                    <li><Link to="/">Home</Link></li>
                    <li><span>/</span></li>
                    <li>Fruits & Vegetables</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          {/* page-header-section end */}

          {/* page-content */}
          <section className="page-content section-ptb-90">
            <div className="container">
              <div className="row">
                <div className="col-lg-12">
                  <div className="row product-list">
                    {productList.map((p, idx) => (
                      <div className="col-sm-6 col-lg-4 col-xl-3" key={idx}>
                        <div className="product-item">
                          <div className="product-thumb">
                            <Link to="/products"><img src={`/assets/images/products/${p.img}.png`} alt="product" /></Link>
                            <span className="batch sale">Sale</span>
                            <a className="wish-link" href="#"><i className="fas fa-heart"></i></a>
                          </div>
                          <div className="product-content">
                            <a href="#" className="cata">Catagory</a>
                            <h6><Link to="/products" className="product-title">{p.name}</Link></h6>
                            <p className="quantity">1 kg</p>
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="price">$85.00 <del>$100.00</del></div>
                              <div className="cart-btn-toggle">
                                <span className="cart-btn"><i className="fas fa-shopping-cart"></i> Cart</span>
                                <div className="price-btn">
                                  <div className="price-increase-decrese-group d-flex">
                                    <span className="decrease-btn">
                                      <button type="button" className="btn quantity-left-minus" data-type="minus" data-field="">-</button>
                                    </span>
                                    <input type="text" name="quantity" className="form-controls input-number" defaultValue="1" />
                                    <span className="increase">
                                      <button type="button" className="btn quantity-right-plus" data-type="plus" data-field="">+</button>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="col-12 text-center mt-4">
                      <button className="loadMore">Load More</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* page-content */}

          {/* footer section */}
          <footer className="footer">
            <div className="container">
              <div className="footer-newsletter">
                <div className="row align-items-center">
                  <div className="col-md-6 text-center text-md-left mb-3 mb-md-0">
                    <div className="newsletter-heading"><h5>Know it all first</h5></div>
                  </div>
                  <div className="col-md-6 d-flex justify-content-center justify-content-md-end">
                    <div className="newsletter-form">
                      <input type="text" name="email" placeholder="E-mail Address" />
                      <button className="submit-btn"><i className="fas fa-paper-plane"></i></button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="footer-top">
                <div className="row">
                  <div className="col-md-6 col-lg-3">
                    <div className="footer-widget">
                      <Link to="/" className="footer-logo"><img src="/assets/images/logo.png" alt="logo" /></Link>
                      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod teincididunt ut labore et </p>
                      <ul className="social-media-list d-flex flex-wrap">
                        <li><a href="#"><i className="fab fa-facebook-f"></i></a></li>
                        <li><a href="#"><i className="fab fa-twitter"></i></a></li>
                        <li><a href="#"><i className="fab fa-vimeo-v"></i></a></li>
                        <li><a href="#"><i className="fab fa-pinterest-p"></i></a></li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="footer-widget">
                      <h5 className="footer-title">Product Catalog</h5>
                      <div className="widget-wrapper">
                        <ul>
                          <li><Link to="/products">Fruits</Link></li>
                          <li><Link to="/products">Salads</Link></li>
                          <li><Link to="/products">Fish & Seafood</Link></li>
                          <li><Link to="/products">Fresh Meat</Link></li>
                          <li><Link to="/products">Health Products</Link></li>
                          <li><Link to="/products">Butter & Eggs</Link></li>
                          <li><Link to="/products">Oil & Vinegars</Link></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="footer-widget">
                      <h5 className="footer-title">Useful Links</h5>
                      <div className="widget-wrapper">
                        <ul>
                          <li><Link to="/about">About Us</Link></li>
                          <li><Link to="/products">Offers</Link></li>
                          <li><a href="#">Blog</a></li>
                          <li><a href="#">Faq</a></li>
                          <li><Link to="/contact">Careers</Link></li>
                          <li><Link to="/contact">Contact Us</Link></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="footer-widget">
                      <h5 className="footer-title">Download Apps</h5>
                      <div className="widget-wrapper">
                        <div className="apps-store">
                          <a href="#"><img src="/assets/images/app-store/apple.png" alt="app" /></a>
                          <a href="#"><img src="/assets/images/app-store/google.png" alt="app" /></a>
                        </div>
                        <div className="payment-method d-flex flex-wrap">
                          <a href="#"><img src="/assets/images/payment/visa.png" alt="payment" /></a>
                          <a href="#"><img src="/assets/images/payment/paypal.png" alt="payment" /></a>
                          <a href="#"><img src="/assets/images/payment/master.png" alt="payment" /></a>
                          <a href="#"><img src="/assets/images/payment/discover.png" alt="payment" /></a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="footer-bottom">
                <div className="row">
                  <div className="col-md-6 text-center text-md-left mb-3 mb-md-0">
                    <p className="copyright">Copyright &copy; 2021 <a href="#">eflux</a>. All Rights Reserved.</p>
                  </div>
                  <div className="col-md-6 d-flex justify-content-center justify-content-md-end">
                    <ul className="footer-menu d-flex flex-wrap">
                      <li><a href="#">Privacy policies</a></li>
                      <li><a href="#">Coockies</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </footer>
          {/* footer section */}
        </div>
      </div>

      {/* product-details-popup start */}
      <section id="product-details-popup" className="product-details-popup">
        <div className="modal-overlay"></div>
        <div className="container">
          <div className="product-zoom-info-container">
            <div id="closed-modal" className="closed-modal">X</div>
            <div className="row align-items-center">
              <div className="col-lg-6">
                <div className="product-zoom-area">
                  <span className="batch">30%</span>
                  <div className="cart-btn-toggle d-lg-none">
                    <span className="cart-btn"><i className="fas fa-shopping-cart"></i> Cart</span>
                    <div className="price-btn">
                      <div className="price-increase-decrese-group d-flex">
                        <span className="decrease-btn">
                          <button type="button" className="btn quantity-left-minus" data-type="minus" data-field="">-</button>
                        </span>
                        <input type="text" name="quantity" className="form-controls input-number" defaultValue="1" />
                        <span className="increase">
                          <button type="button" className="btn quantity-right-plus" data-type="plus" data-field="">+</button>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="product-slick">
                    <div><img src="/assets/images/product-detail/01.jpg" alt="" className="img-fluid blur-up lazyload" /></div>
                    <div><img src="/assets/images/product-detail/02.jpg" alt="" className="img-fluid blur-up lazyload" /></div>
                    <div><img src="/assets/images/product-detail/03.jpg" alt="" className="img-fluid blur-up lazyload" /></div>
                    <div><img src="/assets/images/product-detail/01.jpg" alt="" className="img-fluid blur-up lazyload" /></div>
                  </div>
                  <div className="row">
                    <div className="col-12">
                      <div className="slider-nav">
                        <div><img src="/assets/images/product-detail/01.jpg" alt="" className="img-fluid blur-up lazyload" /></div>
                        <div><img src="/assets/images/product-detail/02.jpg" alt="" className="img-fluid blur-up lazyload" /></div>
                        <div><img src="/assets/images/product-detail/03.jpg" alt="" className="img-fluid blur-up lazyload" /></div>
                        <div><img src="/assets/images/product-detail/01.jpg" alt="" className="img-fluid blur-up lazyload" /></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="product-details-content">
                  <a className="wish-link" href="#"><i className="fas fa-heart"></i></a>
                  <a href="#" className="cata">Catagory</a>
                  <h2>Product Title Here</h2>
                  <p className="quantity">1kg</p>
                  <h3 className="price">$329 <del>$400</del></h3>
                  <div className="price-increase-decrese-group d-flex">
                    <span className="decrease-btn">
                      <button type="button" className="btn quantity-left-minus" data-type="minus" data-field="">-</button>
                    </span>
                    <input type="text" name="quantity" className="form-controls input-number" defaultValue="1" />
                    <span className="increase">
                      <button type="button" className="btn quantity-right-plus" data-type="plus" data-field="">+</button>
                    </span>
                  </div>
                  <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penas et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.</p>
                  <div className="d-flex justify-content-end">
                    <a href="#" className="buy-now">Buy Now</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* product-details-popup end */}

      {/* mobile-footer */}
      <div className="mobile-footer d-flex justify-content-between align-items-center d-xl-none">
        <button className="info" type="button" data-toggle="modal" data-target="#siteinfo1"><i className="fas fa-info-circle"></i></button>
        <div className="footer-cart">
          <a href="#" className="d-flex align-items-center"><span className="cart-icon"><i className="fas fa-shopping-cart"></i><span className="count">3</span></span> <span className="cart-amount ml-2">$560.00</span></a>
        </div>
        <div className="footer-admin-area">
          <button className="user-admin" type="button" data-toggle="modal" data-target="#useradmin1"><i className="fas fa-user"></i></button>
        </div>
      </div>
      {/* mobile-footer */}

      <a href="#top-page" className="to-top js-scroll-trigger"><span><i className="fas fa-arrow-up"></i></span></a>
    </>
  );
};

export default ProductFullwidth;