import React, { useEffect } from 'react';

const Signup = () => {
  useEffect(() => {
    document.title = "eflux - Grocery & Organic Supermarket Responsive Template";
  }, []);

  return (
    <>
<a className="position-absolute" href="javascript:void(0)" onClick="cartopen()">
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
                            <li><a href="profile.html">Profile</a></li>
                            <li><a href="#">Sign Out</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>

     {/*siteinfo Modal */}
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

     {/*search Modal */}
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
                            <input type="text" name="search" placeholder="Search for Products"/>
                            <button className="submit-btn"><i className="fas fa-search"></i></button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>


    {/* menu modal */}
     <div className="modal fade" id="menu-id" tabIndex="-1" aria-labelledby="menu-id" aria-hidden="true">
        <div className="modal-dialog  modal-dialog-centered">
            <div className="modal-content">
                <div className="modal-body">
                    <ul className="menu d-xl-flex flex-wrap pl-0 list-unstyled">
                        <li className="item-has-children"><a data-toggle="collapse" href="#mainmenuid1" role="button" aria-expanded="false" aria-controls="catagory-widget1"><span>Home</span> <i className="fas fa-angle-down"></i></a>
                            <ul className="submenu collapse" id="mainmenuid1">
                                <li><a href="home-default.html">Home Default</a></li>
                                <li><a href="index-icon.html">Home Default2</a></li>
                                <li><a href="index.html">Home Sticky Sidebar</a></li>
                                <li><a href="home-search.html">Home Search</a></li>
                                <li><a href="home-slider.html">Home Slider</a></li>
                                 <li><a href="home-slider2.html">Home Slider2</a></li>
                                <li><a href="home7.html">Home Seven</a></li>
                            </ul>
                        </li>
                        <li><a href="#">New Products</a></li>
                        <li><a data-toggle="collapse" href="#megamenu-main" role="button" aria-expanded="false" aria-controls="catagory-widget1"><span>Featured Products</span> <i className="fas fa-angle-down"></i></a>
                            <ul className=" collapse" id="megamenu-main">
                                <li><a data-toggle="collapse" href="#megamenu-main01" role="button" aria-expanded="false" aria-controls="megamenu-main01"><span>Vegetables</span> <i className="fas fa-angle-down"></i></a>
                                    <ul className="submenu collapse" id="megamenu-main01">
                                        <li><a href="product-list.html">Artichoke.</a></li>
                                        <li><a href="product-list.html">Aubergune</a></li>
                                        <li><a href="product-list.html">Asparagus</a></li>
                                        <li><a href="product-list.html">Broccoflower</a></li>
                                    </ul>
                                </li>
                                <li><a data-toggle="collapse" href="#megamenu-main02" role="button" aria-expanded="false" aria-controls="megamenu-main02"><span>Fruits</span> <i className="fas fa-angle-down"></i></a>
                                    <ul className="submenu collapse" id="megamenu-main02">
                                        <li><a href="product-list.html">Artichoke.</a></li>
                                        <li><a href="product-list.html">Aubergune</a></li>
                                        <li><a href="product-list.html">Asparagus</a></li>
                                        <li><a href="product-list.html">Broccoflower</a></li>
                                    </ul>
                                </li>
                                <li><a data-toggle="collapse" href="#megamenu-main03" role="button" aria-expanded="false" aria-controls="megamenu-main03"><span>Salads</span> <i className="fas fa-angle-down"></i></a>
                                    <ul className="submenu collapse" id="megamenu-main03">
                                        <li><a href="product-list.html">Artichoke.</a></li>
                                        <li><a href="product-list.html">Aubergune</a></li>
                                        <li><a href="product-list.html">Asparagus</a></li>
                                        <li><a href="product-list.html">Broccoflower</a></li>
                                    </ul>
                                </li>
                                <li><a data-toggle="collapse" href="#megamenu-main04" role="button" aria-expanded="false" aria-controls="megamenu-main04"><span>Health Care</span> <i className="fas fa-angle-down"></i></a>
                                    <ul className="submenu collapse" id="megamenu-main04">
                                        <li><a href="product-list.html">Artichoke.</a></li>
                                        <li><a href="product-list.html">Aubergune</a></li>
                                        <li><a href="product-list.html">Asparagus</a></li>
                                        <li><a href="product-list.html">Broccoflower</a></li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                        <li className="item-has-children"><a data-toggle="collapse" href="#mainmenuid2" role="button" aria-expanded="false" aria-controls="mainmenuid2"><span>Pages</span> <i className="fas fa-angle-down"></i></a>
                            <ul className="submenu collapse" id="mainmenuid2">
                                <li><a href="about.html">About</a></li>
                                <li><a href="contact.html">Contact</a></li>
                                <li className="item-has-children"><a data-toggle="collapse" href="#mobile-product1" role="button" aria-expanded="false" aria-controls="mobile-product1"><span>Products</span> <i className="fas fa-angle-down"></i></a>
                                    <ul className="submenu collapse" id="mobile-product1">
                                        <li><a href="product-list.html">Product List</a></li>
                                        <li><a href="product-leftsidebar.html">Product leftsidebar</a></li>
                                        <li><a href="product-fullwidth.html">Product Fullwidth</a></li>
                                        <li><a href="brand-product.html">Brand Page</a></li>
                                        <li><a href="product-detail.html">Product Details</a></li>
                                    </ul>
                                </li>
                                <li className="item-has-children"><a data-toggle="collapse" href="#mobile-dashboard1" role="button" aria-expanded="false" aria-controls="mobile-dashboard1"><span>Dashboard1</span> <i className="fas fa-angle-down"></i></a>
                                    <ul className="submenu collapse" id="mobile-dashboard1">
                                        <li><a href="user-dashbord.html">User Dashboard</a></li>
                                        <li><a href="profile.html">Profile</a></li>
                                        <li><a href="track-order.html">Track Order</a></li>
                                        <li><a href="wishlist.html">Wish List</a></li>
                                    </ul>
                                </li>
                                <li className="item-has-children"><a data-toggle="collapse" href="#mobile-dashboard2" role="button" aria-expanded="false" aria-controls="mobile-dashboard2"><span>Dashboard2</span> <i className="fas fa-angle-down"></i></a>
                                    <ul className="submenu collapse" id="mobile-dashboard2">
                                        <li><a href="dashboard.html">My Orders</a></li>
                                        <li><a href="dashboard-account.html">Accounts</a></li>
                                        <li><a href="dashboard-address-book.html">Address Book</a></li>
                                        <li><a href="dashboard-order-cancel.html">Order Cancel</a></li>
                                        <li><a href="dashboard-order-process.html">Order Process</a></li>
                                        <li><a href="dashboard-password-change.html">Password Change</a></li>
                                        <li><a href="dashboard-wishlist.html">whistlist</a></li>
                                    </ul>
                                </li>
                                <li><a href="faq.html">FAQ</a></li>
                                <li><a href="checkout.html">Checkout</a></li>
                                <li><a href="checkout.html">Checkout</a></li>
                                <li><a href="singin.html">SignIn</a></li>
                                <li><a href="signup.html">SignUp</a></li>
                                <li><a href="product-order-success.html">Order Success</a></li>
                                <li><a href="comming-soon.html">Comming Soon</a></li>
                                <li><a href="404-page.html">404 page</a></li>
                            </ul>
                        </li>
                        <li className="item-has-children"><a data-toggle="collapse" href="#mainmenuid3" role="button" aria-expanded="false" aria-controls="mainmenuid3"><span>Blog</span> <i className="fas fa-angle-down"></i></a>
                            <ul className="submenu collapse" id="mainmenuid3">
                                <li><a href="blog.html">Blog full width</a></li>
                                <li><a href="blog-rightsidebar.html">Blog Rightsidebar</a></li>
                                <li><a href="single.html">Blog Single</a></li>
                            </ul>
                        </li>
                        <li><a href="contact.html">Contact Us</a></li>
                    </ul>
                </div>
            </div>
        </div>
    </div>


    {/* sidebar-cart */}
    <div id="sitebar-cart" className="sitebar-cart">
        <div className="sc-head d-flex justify-content-between align-items-center">
            <div className="cart-count"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" viewBox="0 0 472.337 472.336" style={{enableBackground: "new 0 0 472.337 472.336"}} xmlSpace="preserve"><path d="M406.113,126.627c0-5.554-4.499-10.05-10.053-10.05h-76.377V91.715C319.684,41.143,278.543,0,227.969,0
                   c-50.573,0-91.713,41.143-91.713,91.715v24.862H70.45c-5.549,0-10.05,4.497-10.05,10.05L3.914,462.284
                   c0,5.554,4.497,10.053,10.055,10.053h444.397c5.554,0,10.057-4.499,10.057-10.053L406.113,126.627z M156.352,91.715
                   c0-39.49,32.13-71.614,71.612-71.614c39.49,0,71.618,32.13,71.618,71.614v24.862h-143.23V91.715z M146.402,214.625
                   c-9.92,0-17.959-8.044-17.959-17.961c0-7.269,4.34-13.5,10.552-16.325v17.994h14.337v-18.237
                   c6.476,2.709,11.031,9.104,11.031,16.568C164.363,206.586,156.319,214.625,146.402,214.625z M310.484,214.625
                   c-9.922,0-17.959-8.044-17.959-17.961c0-7.269,4.341-13.495,10.548-16.325v17.994h14.338v-18.241
                   c6.478,2.714,11.037,9.108,11.037,16.568C328.448,206.586,320.407,214.625,310.484,214.625z"></path></svg>
                   <span>3 Item</span>
                </div>
                <span onClick="cartclose()" className="close-icon"><i className="fas fa-times"></i></span>
        </div>
        <div className="cart-product-container">
            <div className="cart-product-item">
                <div className="close-item"><i className="fas fa-times"></i></div>
                <div className="row align-items-center">
                    <div className="col-6 p-0">
                        <div className="thumb">
                            <a href="#"><img src="/assets/images/products/cart/01.png" alt="products"/></a>
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="product-content">
                            <a href="#" className="product-title">Daisy Cont Oil</a>
                            <div className="product-cart-info">
                                1x 31b
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row align-items-center">
                    <div className="col-6">
                        <div className="price-increase-decrese-group d-flex">
                            <span className="decrease-btn">
                                <button type="button" className="btn quantity-left-minus" data-type="minus" data-field="">-
                                </button> 
                            </span>
                            <input type="text" name="quantity" className="form-controls input-number" value="1"/>
                            <span className="increase">
                                <button type="button" className="btn quantity-right-plus" data-type="plus" data-field="">+
                                </button>
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

            

            <div className="cart-product-item">
                <div className="close-item"><i className="fas fa-times"></i></div>
                <div className="row align-items-center">
                    <div className="col-6 p-0">
                        <div className="thumb">
                            <a href="#"><img src="/assets/images/products/cart/02.png" alt="products"/></a>
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="product-content">
                            <a href="#" className="product-title">Daisy Cont Oil</a>
                            <div className="product-cart-info">
                                1x 31b
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row align-items-center">
                    <div className="col-6">
                        <div className="price-increase-decrese-group d-flex">
                            <span className="decrease-btn">
                                <button type="button" className="btn quantity-left-minus" data-type="minus" data-field="">-
                                </button> 
                            </span>
                            <input type="text" name="quantity" className="form-controls input-number" value="1"/>
                            <span className="increase">
                                <button type="button" className="btn quantity-right-plus" data-type="plus" data-field="">+
                                </button>
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

            <div className="cart-product-item">
                <div className="close-item"><i className="fas fa-times"></i></div>
                <div className="row align-items-center">
                    <div className="col-6 p-0">
                        <div className="thumb">
                            <a href="#"><img src="/assets/images/products/cart/03.png" alt="products"/></a>
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="product-content">
                            <a href="#" className="product-title">Daisy Cont Oil</a>
                            <div className="product-cart-info">
                                1x 31b
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row align-items-center">
                    <div className="col-6">
                        <div className="price-increase-decrese-group d-flex">
                            <span className="decrease-btn">
                                <button type="button" className="btn quantity-left-minus" data-type="minus" data-field="">-
                                </button> 
                            </span>
                            <input type="text" name="quantity" className="form-controls input-number" value="1"/>
                            <span className="increase">
                                <button type="button" className="btn quantity-right-plus" data-type="plus" data-field="">+
                                </button>
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
                <a href="checkout.html" className="procced-checkout">Prosecced Checkout</a>
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
                <a href="index.html" className="logo"><img src="/assets/images/logo.png" alt="logo"/></a>

                {/* search select */}
                <div className="text-center mobile-search">
                    <button type="button" data-toggle="modal" data-target="#search-select-id"><i className="fas fa-search"></i></button>
                </div>

                {/* menubar */}
                <div>
                    <button className="menu-bar" type="button" data-toggle="modal" data-target="#menu-id">
                        Home<i className="fas fa-caret-down"></i>
                    </button>
                </div>

            </div>
            <div className="d-none d-xl-flex row align-items-center">
                <div className="col-5 col-md-2">
                    <a href="index.html" className="logo"><img src="/assets/images/logo.png" alt="logo"/></a>
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
                            <input type="text" name="search" placeholder="Search for Products"/>
                            <button className="submit-btn"><i className="fas fa-search"></i></button>
                        </form>
                    </div>
                </div>
                <div className="col-2 col-md-1 col-lg-5">
                    <ul className="site-action d-none d-lg-flex align-items-center justify-content-between  ml-auto">
                        <li className="site-phone"><a href="tel:000-000-000"><i className="fas fa-phone"></i> 000 000 000</a></li>
                        <li className="site-help"><a href="#"><i className="fas fa-question-circle"></i> Help & More</a></li>
                        <li className="wish-list"><a href="wishlist.html"><i className="fas fa-heart"></i> <span className="count">04</span></a></li>
                        <li className="my-account item-has-children">
                            <a href="#"><i className="fas fa-user mr-1"></i> My Account</a>
                            <ul className="submenu">
                                <li><a href="profile.html">Profile</a></li>
                                <li><a href="#">Sign Out</a></li>
                            </ul>
                        </li>
                        <li className="signin-option d-none"><a onClick="OpenSignUpForm()" href="#"><i className="fas fa-user mr-2"></i>Sign In</a></li>
                    </ul>
                </div>

            </div>
        </div>
        <hr/>
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
                            <li className="item-has-children"><a href="index.html">Home <i className="fas fa-angle-down"></i></a>
                                <ul className="submenu">
                                    <li><a href="home-default.html">Home Default</a></li>
                                    <li><a href="index-icon.html">Home Default2</a></li>
                                    <li><a href="index.html">Home Sticky Sidebar</a></li>
                                    <li><a href="home-search.html">Home Search</a></li>
                                    <li><a href="home-slider.html">Home Slider</a></li>
                                     <li><a href="home-slider2.html">Home Slider2</a></li>
                                <li><a href="home7.html">Home Seven</a></li>
                                </ul>
                            </li>
                            <li><a href="#">New Products</a></li>
                            <li className="item-has-mega-menu"><a href="#">Featured Products <i className="fas fa-angle-down"></i></a>
                                <div className="mega-menu-container">
                                    <div className="row m-0">
                                        <div className="col-lg-7">
                                            <div className="row m-0">
                                                <div className="col-lg-4">
                                                    <div className="ctagory-item">
                                                        <h6 className="title">Vegetables</h6>
                                                        <ul>
                                                            <li><a href="product-list.html">Artichoke.</a></li>
                                                            <li><a href="product-list.html">Aubergune</a></li>
                                                            <li><a href="product-list.html">Asparagus</a></li>
                                                            <li><a href="product-list.html">Broccoflower</a></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <div className="col-lg-4">
                                                    <div className="ctagory-item">
                                                        <h6 className="title">Frouts</h6>
                                                        <ul>
                                                            <li><a href="product-list.html">Artichoke.</a></li>
                                                            <li><a href="product-list.html">Aubergune</a></li>
                                                            <li><a href="product-list.html">Asparagus</a></li>
                                                            <li><a href="product-list.html">Broccoflower</a></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <div className="col-lg-4">
                                                    <div className="ctagory-item">
                                                        <h6 className="title">Salads</h6>
                                                        <ul>
                                                            <li><a href="product-list.html">Artichoke.</a></li>
                                                            <li><a href="product-list.html">Aubergune</a></li>
                                                            <li><a href="product-list.html">Asparagus</a></li>
                                                            <li><a href="product-list.html">Broccoflower</a></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <div className="col-lg-4">
                                                    <div className="ctagory-item">
                                                        <h6 className="title">Health Care</h6>
                                                        <ul>
                                                            <li><a href="product-list.html">Artichoke.</a></li>
                                                            <li><a href="product-list.html">Aubergune</a></li>
                                                            <li><a href="product-list.html">Asparagus</a></li>
                                                            <li><a href="product-list.html">Broccoflower</a></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <div className="col-lg-4">
                                                    <div className="ctagory-item">
                                                        <h6 className="title">Vegetables</h6>
                                                        <ul>
                                                            <li><a href="product-list.html">Artichoke.</a></li>
                                                            <li><a href="product-list.html">Aubergune</a></li>
                                                            <li><a href="product-list.html">Asparagus</a></li>
                                                            <li><a href="product-list.html">Broccoflower</a></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <div className="col-lg-4">
                                                    <div className="ctagory-item">
                                                        <h6 className="title">Frouts</h6>
                                                        <ul>
                                                            <li><a href="product-list.html">Artichoke.</a></li>
                                                            <li><a href="product-list.html">Aubergune</a></li>
                                                            <li><a href="product-list.html">Asparagus</a></li>
                                                            <li><a href="product-list.html">Broccoflower</a></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-5">
                                            <div className="menu-img">
                                                <img className="w-100" src="/assets/images/mega-menu-img.png" alt="menu-image"/>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                            <li className="item-has-mega-menu"><a href="#">Pages <i className="fas fa-angle-down"></i></a>
                                <div className="mega-menu-container style2">
                                    <div className="row m-0">
                                        <div className="col-lg-3">
                                            <div className="ctagory-item">
                                                <h6 className="title">Product Pages</h6>
                                                <ul>
                                                    <li><a href="product-list.html">Product List</a></li>
                                                    <li><a href="product-leftsidebar.html">Product leftsidebar</a></li>
                                                    <li><a href="product-fullwidth.html">Product Fullwidth</a></li>
                                                    <li><a href="brand-product.html">Brand Page</a></li>
                                                    <li><a href="product-detail.html">Product Details</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="col-lg-3">
                                            <div className="ctagory-item">
                                                <h6 className="title">Dashboard 1</h6>
                                                <ul>
                                                    <li><a href="user-dashbord.html">User Dashboard</a></li>
                                                    <li><a href="profile.html">Profile</a></li>
                                                    <li><a href="track-order.html">Track Order</a></li>
                                                    <li><a href="wishlist.html">Wish List</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="col-lg-3">
                                            <div className="ctagory-item">
                                                <h6 className="title">Dashboard 2</h6>
                                                <ul>
                                                    <li><a href="dashboard.html">My Orders</a></li>
                                                    <li><a href="dashboard-account.html">Accounts</a></li>
                                                    <li><a href="dashboard-address-book.html">Address Book</a></li>
                                                    <li><a href="dashboard-order-cancel.html">Order Cancel</a></li>
                                                    <li><a href="dashboard-order-process.html">Order Process</a></li>
                                                    <li><a href="dashboard-password-change.html">Password Change</a></li>
                                                    <li><a href="dashboard-wishlist.html">whistlist</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="col-lg-3">
                                            <div className="ctagory-item">
                                                <h6 className="title">Other Pages</h6>
                                                <ul>
                                                    <li><a href="checkout.html">Checkout</a></li>
                                                    <li><a href="singin.html">SignIn</a></li>
                                                    <li><a href="signup.html">SignUp</a></li>
                                                    <li><a href="product-order-success.html">Order Success</a></li>
                                                    <li><a href="comming-soon.html">Comming Soon</a></li>
                                                    <li><a href="404-page.html">404 page</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                            <li className="item-has-children"><a href="blog.html">Blog <i className="fas fa-angle-down"></i></a>
                                <ul className="submenu">
                                    <li><a href="blog.html">Blog full width</a></li>
                                    <li><a href="blog-rightsidebar.html">Blog Rightsidebar</a></li>
                                    <li><a href="single.html">Blog Single</a></li>
                                </ul>
                            </li>
                            <li><a href="contact.html">Contact Us</a></li>
                        </ul>
                        <ul className="menu-action d-none d-lg-block">
                            <li className="cart-option"><a onClick="cartopen()" href="#"><span className="cart-icon"><i className="fas fa-shopping-cart"></i><span className="count">3</span></span> <span className="cart-amount">$15.00</span></a>
                            </li>
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
                        <li><a data-toggle="collapse" href="#catagory-widget1" role="button" aria-expanded="false" aria-controls="catagory-widget1">Vegetables<i className="fas fa-angle-down"></i></a>
                            <ul className="catagory-submenu collapse show" id="catagory-widget1">
                                <li><a href="product-list.html">Artichoke.</a></li>
                                <li><a href="product-list.html">Aubergine (eggplant).</a></li>
                                <li><a href="product-list.html">Asparagus.</a></li>
                                <li><a href="product-list.html">Broccoflower (a hybrid).</a></li>
                                <li><a href="product-list.html">Broccoli (calabrese).</a></li>
                            </ul>
                        </li>
                        <li><a data-toggle="collapse" href="#catagory-widget2" role="button" aria-expanded="false" aria-controls="catagory-widget2">Fruits<i className="fas fa-angle-down"></i></a>
                            <ul className="catagory-submenu collapse" id="catagory-widget2">
                                <li><a href="product-list.html">Artichoke.</a></li>
                                <li><a href="product-list.html">Aubergine (eggplant).</a></li>
                                <li><a href="product-list.html">Asparagus.</a></li>
                                <li><a href="product-list.html">Broccoflower (a hybrid).</a></li>
                                <li><a href="product-list.html">Broccoli (calabrese).</a></li>
                            </ul>
                        </li>
                        <li><a data-toggle="collapse" href="#catagory-widget3" role="button" aria-expanded="false" aria-controls="catagory-widget3">Salads<i className="fas fa-angle-down"></i></a>
                            <ul className="catagory-submenu collapse" id="catagory-widget3">
                                <li><a href="product-list.html">Artichoke.</a></li>
                                <li><a href="product-list.html">Aubergine (eggplant).</a></li>
                                <li><a href="product-list.html">Asparagus.</a></li>
                                <li><a href="product-list.html">Broccoflower (a hybrid).</a></li>
                                <li><a href="product-list.html">Broccoli (calabrese).</a></li>
                            </ul>
                        </li>
                        <li><a data-toggle="collapse" href="#catagory-widget4" role="button" aria-expanded="false" aria-controls="catagory-widget4">Fish & seafood<i className="fas fa-angle-down"></i></a>
                            <ul className="catagory-submenu collapse" id="catagory-widget4">
                                <li><a href="product-list.html">Artichoke.</a></li>
                                <li><a href="product-list.html">Aubergine (eggplant).</a></li>
                                <li><a href="product-list.html">Asparagus.</a></li>
                                <li><a href="product-list.html">Broccoflower (a hybrid).</a></li>
                                <li><a href="product-list.html">Broccoli (calabrese).</a></li>
                            </ul>
                        </li>
                        <li><a data-toggle="collapse" href="#catagory-widget5" role="button" aria-expanded="false" aria-controls="catagory-widget5">Fresh Meat<i className="fas fa-angle-down"></i></a>
                            <ul className="catagory-submenu collapse" id="catagory-widget5">
                                <li><a href="product-list.html">Artichoke.</a></li>
                                <li><a href="product-list.html">Aubergine (eggplant).</a></li>
                                <li><a href="product-list.html">Asparagus.</a></li>
                                <li><a href="product-list.html">Broccoflower (a hybrid).</a></li>
                                <li><a href="product-list.html">Broccoli (calabrese).</a></li>
                            </ul>
                        </li>
                        <li><a data-toggle="collapse" href="#catagory-widget6" role="button" aria-expanded="false" aria-controls="catagory-widget6">Health Products<i className="fas fa-angle-down"></i></a>
                            <ul className="catagory-submenu collapse" id="catagory-widget6">
                                <li><a href="product-list.html">Artichoke.</a></li>
                                <li><a href="product-list.html">Aubergine (eggplant).</a></li>
                                <li><a href="product-list.html">Asparagus.</a></li>
                                <li><a href="product-list.html">Broccoflower (a hybrid).</a></li>
                                <li><a href="product-list.html">Broccoli (calabrese).</a></li>
                            </ul>
                        </li>
                        <li><a data-toggle="collapse" href="#catagory-widget7" role="button" aria-expanded="false" aria-controls="catagory-widget7">Butter & Eggs<i className="fas fa-angle-down"></i></a>
                            <ul className="catagory-submenu collapse" id="catagory-widget7">
                                <li><a href="product-list.html">Artichoke.</a></li>
                                <li><a href="product-list.html">Aubergine (eggplant).</a></li>
                                <li><a href="product-list.html">Asparagus.</a></li>
                                <li><a href="product-list.html">Broccoflower (a hybrid).</a></li>
                                <li><a href="product-list.html">Broccoli (calabrese).</a></li>
                            </ul>
                        </li>
                        <li><a data-toggle="collapse" href="#catagory-widget8" role="button" aria-expanded="false" aria-controls="catagory-widget8">Oils and Venegar<i className="fas fa-angle-down"></i></a>
                            <ul className="catagory-submenu collapse" id="catagory-widget8">
                                <li><a href="product-list.html">Artichoke.</a></li>
                                <li><a href="product-list.html">Aubergine (eggplant).</a></li>
                                <li><a href="product-list.html">Asparagus.</a></li>
                                <li><a href="product-list.html">Broccoflower (a hybrid).</a></li>
                                <li><a href="product-list.html">Broccoli (calabrese).</a></li>
                            </ul>
                        </li>
                        <li><a data-toggle="collapse" href="#catagory-widget9" role="button" aria-expanded="false" aria-controls="catagory-widget9">Frozen Food<i className="fas fa-angle-down"></i></a>
                            <ul className="catagory-submenu collapse" id="catagory-widget9">
                                <li><a href="product-list.html">Artichoke.</a></li>
                                <li><a href="product-list.html">Aubergine (eggplant).</a></li>
                                <li><a href="product-list.html">Asparagus.</a></li>
                                <li><a href="product-list.html">Broccoflower (a hybrid).</a></li>
                                <li><a href="product-list.html">Broccoli (calabrese).</a></li>
                            </ul>
                        </li>
                        <li><a data-toggle="collapse" href="#catagory-widget10" role="button" aria-expanded="false" aria-controls="catagory-widget10">Jam & Honey<i className="fas fa-angle-down"></i></a>
                            <ul className="catagory-submenu collapse" id="catagory-widget10">
                                <li><a href="product-list.html">Artichoke.</a></li>
                                <li><a href="product-list.html">Aubergine (eggplant).</a></li>
                                <li><a href="product-list.html">Asparagus.</a></li>
                                <li><a href="product-list.html">Broccoflower (a hybrid).</a></li>
                                <li><a href="product-list.html">Broccoli (calabrese).</a></li>
                            </ul>
                        </li>
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
                                <li><a href="index.html">Home</a></li>
                                <li><span>/</span></li>
                                <li>Sing Up</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            {/* page-header-section end */}



            <section className="login-section section-ptb">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-12">
                            <div className="eflux-login-form-area">
                                <form action="#" className="eflux-login-form">
                                    <div className="row">
                                        <div className="col-lg-6">
                                            <div className="input-item">
                                                <label>First Name</label>
                                                <input type="text" name="name" placeholder="First Name"/>
                                            </div>
                                        </div>

                                        <div className="col-lg-6">
                                            <div className="input-item">
                                                <label>Last Name</label>
                                                <input type="text" name="name" placeholder="Last Name"/>
                                            </div>
                                        </div>

                                        <div className="col-lg-6">
                                            <div className="input-item">
                                                <label>Email</label>
                                                <input type="email" name="email" placeholder="Email Address"/>
                                            </div>
                                        </div>

                                        <div className="col-lg-6">
                                            <div className="input-item">
                                                <label>Password</label>
                                                <input type="password" name="website" placeholder="Password"/>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <button type="submit" className="submit">Create Account</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>




            {/* footer section */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-newsletter">
                            <div className="row align-items-center">
                                <div className="col-md-6 text-center text-md-left mb-3 mb-md-0">
                                    <div className="newsletter-heading">
                                        <h5>Know it all first</h5>
                                    </div>
                                </div>
                                <div className="col-md-6 d-flex justify-content-center justify-content-md-end">
                                    <div className="newsletter-form">
                                        <input type="text" name="email" placeholder="E-mail Address"/>
                                        <button className="submit-btn">
                                            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style={{enableBackground: "new 0 0 512 512"}} xmlSpace="preserve"><path style={{fill: "#2196F3"}} d="M511.189,259.954c1.649-3.989,0.731-8.579-2.325-11.627l-192-192 c-4.237-4.093-10.99-3.975-15.083,0.262c-3.992,4.134-3.992,10.687,0,14.82l173.803,173.803H10.667 C4.776,245.213,0,249.989,0,255.88c0,5.891,4.776,10.667,10.667,10.667h464.917L301.803,440.328 c-4.237,4.093-4.355,10.845-0.262,15.083c4.093,4.237,10.845,4.354,15.083,0.262c0.089-0.086,0.176-0.173,0.262-0.262l192-192 C509.872,262.42,510.655,261.246,511.189,259.954z"></path><path d="M309.333,458.546c-5.891,0.011-10.675-4.757-10.686-10.648c-0.005-2.84,1.123-5.565,3.134-7.571L486.251,255.88 L301.781,71.432c-4.093-4.237-3.975-10.99,0.262-15.083c4.134-3.992,10.687-3.992,14.82,0l192,192 c4.164,4.165,4.164,10.917,0,15.083l-192,192C314.865,457.426,312.157,458.546,309.333,458.546z"></path><path d="M501.333,266.546H10.667C4.776,266.546,0,261.771,0,255.88c0-5.891,4.776-10.667,10.667-10.667h490.667 c5.891,0,10.667,4.776,10.667,10.667C512,261.771,507.224,266.546,501.333,266.546z"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                    </div>
                    <div className="footer-top">
                        <div className="row">
                            <div className="col-md-6 col-lg-3">
                                <div className="footer-widget">
                                    <a href="index.html" className="footer-logo"><img src="/assets/images/logo.png" alt="logo"/></a>
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
                                            <li><a href="product-leftsidebar.html">Fruits</a></li>
                                            <li><a href="product-leftsidebar.html">Salads</a></li>
                                            <li><a href="product-leftsidebar.html">Fish & Seafood</a></li>
                                            <li><a href="product-leftsidebar.html">Fresh Meat</a></li>
                                            <li><a href="product-leftsidebar.html">Health Products</a></li>
                                            <li><a href="product-leftsidebar.html">Butter & Eggs</a></li>
                                            <li><a href="product-leftsidebar.html">Oil & Vinegars</a></li>
                                            <li><a href="product-leftsidebar.html">Health Products</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6 col-lg-3">
                                <div className="footer-widget">
                                    <h5 className="footer-title">Useful Links</h5>
                                    <div className="widget-wrapper">
                                        <ul>
                                            <li><a href="about.html">About Us</a></li>
                                            <li><a href="product-leftsidebar.html">Featured Products</a></li>
                                            <li><a href="brand-product.html">Offers</a></li>
                                            <li><a href="blog-rightsidebar.html">Blog</a></li>
                                            <li><a href="faq.html">Faq</a></li>
                                            <li><a href="contact.html">Careers</a></li>
                                            <li><a href="contact.html">Contact Us</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6 col-lg-3">
                                <div className="footer-widget">
                                    <h5 className="footer-title">Download Apps</h5>
                                    <div className="widget-wrapper">
                                        <div className="apps-store">
                                            <a href=""><img src="/assets/images/app-store/apple.png" alt="app"/></a>
                                            <a href=""><img src="/assets/images/app-store/google.png" alt="app"/></a>
                                        </div>
                                        <div className="payment-method d-flex flex-wrap">
                                            <a href="#"><img src="/assets/images/payment/visa.png" alt="payment"/></a>
                                            <a href="#"><img src="/assets/images/payment/paypal.png" alt="payment"/></a>
                                            <a href="#"><img src="/assets/images/payment/master.png" alt="payment"/></a>
                                            <a href="#"><img src="/assets/images/payment/discover.png" alt="payment"/></a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <div className="row">
                            <div className="col-md-6 text-center text-md-left mb-3 mb-md-0">
                                <p className="copyright">Copyright &copy; 2021 <a href="">eflux</a>. All Rights Reserved.</p>
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
        <div className="modal-overlay" onClick="closeModal()"></div>
        <div className="container">
            <div className="product-zoom-info-container">
                <div id="closed-modal" className="closed-modal" onClick="closeModal()">X</div>
                <div className="row align-items-center">
                    <div className="col-lg-6">
                        <div className="product-zoom-area">
                            <span className="batch">30%</span>
                            <div className="cart-btn-toggle d-lg-none">
                                <span className="cart-btn"><i className="fas fa-shopping-cart"></i> Cart</span>

                                <div className="price-btn">
                                    <div className="price-increase-decrese-group d-flex">
                                        <span className="decrease-btn">
                                            <button type="button" className="btn quantity-left-minus" data-type="minus" data-field="">-
                                            </button> 
                                        </span>
                                        <input type="text" name="quantity" className="form-controls input-number" value="1"/>
                                        <span className="increase">
                                            <button type="button" className="btn quantity-right-plus" data-type="plus" data-field="">+
                                            </button>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="product-slick">
                                <div><img src="/assets/images/product-detail/01.jpg" alt="" className="img-fluid blur-up lazyload image_zoom_cls-0"/></div>
                                <div><img src="/assets/images/product-detail/02.jpg" alt="" className="img-fluid blur-up lazyload image_zoom_cls-1"/></div>
                                <div><img src="/assets/images/product-detail/03.jpg" alt="" className="img-fluid blur-up lazyload image_zoom_cls-2"/></div>
                                <div><img src="/assets/images/product-detail/01.jpg" alt="" className="img-fluid blur-up lazyload image_zoom_cls-3"/></div>
                                {/* <div><img src="/assets/images/product-detail/02.jpg" alt=""
                                        className="img-fluid blur-up lazyload image_zoom_cls-4"/></div> */}
                            </div>
                            <div className="row">
                                <div className="col-12">
                                    <div className="slider-nav">
                                        <div><img src="/assets/images/product-detail/01.jpg" alt="" className="img-fluid blur-up lazyload"/></div>
                                        <div><img src="/assets/images/product-detail/02.jpg" alt="" className="img-fluid blur-up lazyload"/></div>
                                        <div><img src="/assets/images/product-detail/03.jpg" alt="" className="img-fluid blur-up lazyload"/></div>
                                        <div><img src="/assets/images/product-detail/01.jpg" alt="" className="img-fluid blur-up lazyload"/></div>
                                        {/* <div><img src="/assets/images/product-detail/02.jpg" alt=""
                                                className="img-fluid blur-up lazyload"/></div> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="product-details-content">
                            <a className="wish-link" href="#">
                                <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="heart" className="svg-inline--fa fa-heart fa-w-16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"></path></svg>
                            </a>
                            <a href="#" className="cata">Catagory</a>
                            <h2>Product Title Here</h2>
                            <p className="quantity">1kg</p>
                            <h3 className="price">$329 <del>$400</del></h3>
                            <div className="price-increase-decrese-group d-flex">
                                <span className="decrease-btn">
                                    <button type="button" className="btn quantity-left-minus" data-type="minus" data-field="">-
                                    </button> 
                                </span>
                                <input type="text" name="quantity" className="form-controls input-number" value="1"/>
                                <span className="increase">
                                    <button type="button" className="btn quantity-right-plus" data-type="plus" data-field="">+
                                    </button>
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
        <div onClick="CloseSignUpForm()" className="overlay"></div>
        <div className="login-body-wrapper">
            <div className="login-body">
                <div className="close-icon" onClick="CloseSignUpForm()">
                    <i className="fas fa-times"></i>
                </div>
                <div className="login-header">
                    <h4>Create Your Account</h4>
                    <p>Login with your email & password</p>
                </div>
                <div className="login-content">
                    <form action="#" className="login-form">
                        <input type="text" name="name" placeholder="Name"/>
                        <input type="email" name="email" placeholder="Email"/>
                        <button type="submit" className="submit">Sign Up</button>
                    </form>
                    <div className="text-center seperator">
                        <span>Or</span>
                    </div>
                    <div className="othersignup-option">
                        <a className="facebook" href="#"><i className="fab fa-facebook-square"></i>Continue with Facebook</a>
                        <a className="google" href="#"><i className="fab fa-google-plus"></i>Continue with Google</a>
                    </div>
                    <div className="text-center dont-account py-4">
                        <p className="mb-0">Don't have any account <a href="#">Sing Up</a></p>
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
            <a onClick="cartopen()" href="#" className="d-flex align-items-center"><span className="cart-icon"><i className="fas fa-shopping-cart"></i><span className="count">3</span></span> <span className="cart-amount ml-2">$560.00</span></a>
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

export default Signup;
