import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const HomeDefault = () => {
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
                <ul>
                  <li className="signin-option"><Link to="/signin" data-dismiss="modal"><i className="fas fa-user mr-2"></i>Sign In</Link></li>
                  <li className="site-phone"><a href="tel:000-000-000"><i className="fas fa-phone"></i> 000 000 000</a></li>
                  <li className="site-help"><a href="#"><i className="fas fa-question-circle"></i> Help & More</a></li>
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

            <div>
              <button className="menu-bar" type="button" data-toggle="modal" data-target="#menu-id">
                Home<i className="fas fa-caret-down"></i>
              </button>
            </div>
          </div>
          <div className="d-none d-xl-flex row align-items-center">
            <div className="col-5 col-md-2">
              <Link to="/" className="logo"><img src="/assets/images/logo.png" alt="logo" /></Link>
            </div>
            <div className="col-5 col-md-9 col-lg-5">
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
                <li className="my-account d-none"><a className="dropdown-toggle" href="#" role="button" id="myaccount" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i className="fas fa-user mr-1"></i> My Account</a>
                  <ul className="submenu dropdown-menu" aria-labelledby="myaccount">
                    <li><Link to="/profile">Profile</Link></li>
                    <li><a href="#">Sign Out</a></li>
                  </ul>
                </li>
                <li className="signin-option"><Link to="/signin"><i className="fas fa-user mr-2"></i>Sign In</Link></li>
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
          {/* banner-section start */}
          <section className="banner-section bg-img3 d-flex align-items-center">
            <div className="banner-content-area">
              <div className="container">
                <div className="banner-content">
                  <h6>Organic and fresh food</h6>
                  <h2>Get freshness delivered<br />on your doorstep.</h2>
                  <a href="#" className="banner-btn">Read More</a>
                </div>
              </div>
            </div>
          </section>
          {/* banner-section end */}

          {/* info-box-section start */}
          <section className="info-box-section">
            <div className="container">
              <div className="info-box-container">
                <div className="swiper-wrapper">
                  <div className="swiper-slide">
                    <div className="info-box-item d-sm-flex text-center text-sm-left">
                      <div className="info-icon"><img src="/assets/images/info-item/info.svg" alt="info icon" /></div>
                      <div className="info-content">
                        <h6>Place order</h6>
                        <p>Lorem ipsum dolor sit amet, conse ctetur adipisicing elit, sed do.</p>
                      </div>
                    </div>
                  </div>
                  <div className="swiper-slide">
                    <div className="info-box-item d-sm-flex text-center text-sm-left">
                      <div className="info-icon"><img src="/assets/images/info-item/credit-card.svg" alt="info icon" /></div>
                      <div className="info-content">
                        <h6>Easy Payment</h6>
                        <p>Lorem ipsum dolor sit amet, conse ctetur adipisicing elit, sed do.</p>
                      </div>
                    </div>
                  </div>
                  <div className="swiper-slide">
                    <div className="info-box-item d-sm-flex text-center text-sm-left">
                      <div className="info-icon"><img src="/assets/images/info-item/info.svg" alt="info icon" /></div>
                      <div className="info-content">
                        <h6>First Delevary</h6>
                        <p>Lorem ipsum dolor sit amet, conse ctetur adipisicing elit, sed do.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* info-box-section end */}

          {/* catagory section start */}
          <section className="catagory-section">
            <div className="container p-lg-0">
              <div className="section-heading">
                <h4 className="heading-title"><span className="heading-circle green"></span> Products Catagories</h4>
              </div>
              <div className="section-wrapper">
                <div className="catagory-container">
                  <div className="swiper-wrapper">
                    {["Baby Care", "Home Appliances", "Fruits and Vegetables", "Home and Cleaning", "Health Products"].map((name) => (
                      <div className="swiper-slide" key={name}>
                        <Link to="/products" className="catagory-item">
                          <div className="catagory-icon">
                            <i className="fas fa-leaf fa-2x"></i>
                          </div>
                          <p className="catagory-name">{name}</p>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* catagory section end */}

          {/* trending product-section start */}
          <section className="trending-product-section">
            <div className="container">
              <div className="section-heading">
                <h4 className="heading-title"><span className="heading-circle"></span> Trending Products</h4>
              </div>
              <div className="section-wrapper">
                <div className="mlr-20">
                  <div className="trending-product-container">
                    <div className="swiper-wrapper">
                      {[
                        { img: "02", name: "Green Graves" },
                        { img: "03", name: "Kiwi" },
                        { img: "04", name: "Tomato" },
                        { img: "05", name: "Corn on the Cob" },
                        { img: "06", name: "Raddish Vegitable" },
                      ].map((p) => (
                        <div className="swiper-slide" key={p.img}>
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
                                <div className="price">$8.00 <del>$10.00</del></div>
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
                    </div>
                  </div>
                  <div className="text-center pt-3">
                    <Link to="/products" className="more-product-btn">More Products</Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* trending product-section end */}

          {/* advertisement-section start */}
          <div className="advertisement-section pb-5">
            <div className="container">
              <div className="row mb-4">
                <div className="col-lg-6"><a href="#"><img src="/assets/images/advertise/01.jpg" alt="advertise" /></a></div>
                <div className="col-lg-6"><a href="#"><img src="/assets/images/advertise/02.jpg" alt="advertise" /></a></div>
              </div>
            </div>
          </div>
          {/* advertisement-section end */}

          {/* recommended product-section start */}
          <section className="recomended-product-section pb-5">
            <div className="container">
              <div className="section-heading">
                <h4 className="heading-title"><span className="heading-circle"></span> We Recommend You</h4>
              </div>
              <div className="section-wrapper">
                <div className="mlr-20">
                  <div className="recommend-product-container">
                    <div className="swiper-wrapper">
                      {[
                        { img: "05", name: "Corn on the Cob" },
                        { img: "06", name: "Raddish Vegitable" },
                        { img: "07", name: "Carrot" },
                        { img: "08", name: "Apple" },
                        { img: "05", name: "Corn on the Cob" },
                      ].map((p, idx) => (
                        <div className="swiper-slide" key={idx}>
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
                                <div className="price">$8.00 <del>$10.00</del></div>
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
                    </div>
                  </div>
                  <div className="text-center pt-3">
                    <Link to="/products" className="more-product-btn">More Products</Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* recommended product-section end */}

          {/* advertisement-section start */}
          <div className="advertisement-section pb-5">
            <div className="container">
              <div className="row">
                <div className="col-lg-4"><a href="#"><img src="/assets/images/advertise/10.jpg" alt="advertise" /></a></div>
                <div className="col-lg-4"><a href="#"><img src="/assets/images/advertise/11.jpg" alt="advertise" /></a></div>
                <div className="col-lg-4"><a href="#"><img src="/assets/images/advertise/12.jpg" alt="advertise" /></a></div>
              </div>
            </div>
          </div>
          {/* advertisement-section end */}

          {/* testimonial-section start */}
          <section className="testimonial-section">
            <div className="container">
              <div className="section-heading">
                <h4 className="heading-title"><span className="heading-circle"></span>Testimonial</h4>
              </div>
              <div className="section-wrapper">
                <div className="testimonial-container">
                  <div className="swiper-wrapper">
                    <div className="swiper-slide">
                      <div className="testimonial-body">
                        <div className="testi-author-pic"><img src="/assets/images/testimonial/author.jpg" alt="author" /></div>
                        <p className="desc">What a load of rubbish bits and bobs pear shaped owt to do with me good tinkety tonk old fruit, car boot my good sir buggered plastered cheeky David, haggle young delinquent say so I said bite your arm off</p>
                        <div className="author-info">
                          <h6 className="name">Jhon Doe</h6>
                          <div className="rating">
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* testimonial-section end */}

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
                          <li><Link to="/products">Featured Products</Link></li>
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

      {/* login-area */}
      <section id="login-area" className="login-area">
        <div className="overlay"></div>
        <div className="login-body-wrapper">
          <div className="login-body">
            <div className="close-icon"><i className="fas fa-times"></i></div>
            <div className="login-header">
              <h4>Create Your Account</h4>
              <p>Login with your email & password</p>
            </div>
            <div className="login-content">
              <form action="#" className="login-form">
                <input type="text" name="name" placeholder="Name" />
                <input type="email" name="email" placeholder="Email" />
                <button type="submit" className="submit">Sign Up</button>
              </form>
              <div className="text-center seperator"><span>Or</span></div>
              <div className="othersignup-option">
                <a className="facebook" href="#"><i className="fab fa-facebook-square"></i>Continue with Facebook</a>
                <a className="google" href="#"><i className="fab fa-google-plus"></i>Continue with Google</a>
              </div>
              <div className="text-center dont-account py-4">
                <p className="mb-0">Don't have any account <Link to="/signup">Sing Up</Link></p>
              </div>
            </div>
          </div>
          <div className="forgot-password text-center">
            <p>forgot Passowrd? <a href="#">Reset It</a></p>
          </div>
        </div>
      </section>
      {/* login-area */}

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

export default HomeDefault;
