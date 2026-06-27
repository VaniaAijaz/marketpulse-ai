import React, { useEffect, useState } from 'react';
import PublicLayout from '../../components/layout/PublicLayout';
import { useProductsByShop } from '../../features/products/productHooks';
import useAuthStore from '../../store/useAuthStore';

const categories = ['food', 'beverage', 'grocery', 'mobile', 'clothing', 'other'];

const ProductFullwidth = () => {
  const activeShop = useAuthStore((s) => s.activeShop);
  const shopId = activeShop?._id;

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { data, isLoading, isError } = useProductsByShop(shopId, {
    ...(selectedCategory && { category: selectedCategory }),
  });

  const products = data?.data || [];
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    document.title = 'Products - MarketPulse';
  }, []);

  const openModal = (product) => setSelectedProduct(product);
  const closeModal = () => setSelectedProduct(null);

  return (
    <PublicLayout>

      <div className="page-layout">

        {/* sidebar categories */}
        <div className="catagory-sidebar-area">
          <div className="catagory-sidebar-area-inner">
            <div className="catagory-sidebar all-catagory-option">
              <ul className="catagory-submenu">
                <li>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); setSelectedCategory(''); }}
                    style={{ fontWeight: !selectedCategory ? 'bold' : 'normal' }}
                  >
                    All Categories
                  </a>
                </li>
                {categories.map((cat) => (
                  <li key={cat}>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); setSelectedCategory(cat); }}
                      style={{ fontWeight: selectedCategory === cat ? 'bold' : 'normal' }}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* main content */}
        <div className="main-content-area">

          {/* breadcrumb */}
          <div className="page-header-section">
            <div className="container">
              <div className="row">
                <div className="col-12 d-flex justify-content-between align-items-center">
                  <ul className="breadcrumb" style={{ marginBottom: 0 }}>
                    <li><a href="/">Home</a></li>
                    <li><span>/</span></li>
                    <li>Products</li>
                    {selectedCategory && (
                      <>
                        <li><span>/</span></li>
                        <li>{selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}</li>
                      </>
                    )}
                  </ul>

                  {/* search bar */}
                  <div className="search-form d-flex" style={{ gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Product search karein..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <button className="submit-btn">
                      <i className="fas fa-search"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* products section */}
          <section className="page-content section-ptb-90">
            <div className="container">

              {isLoading && (
                <div className="text-center py-5">
                  <div className="spinner-border" role="status"></div>
                  <p className="mt-3">Products load ho rahe hain...</p>
                </div>
              )}

              {isError && (
                <div className="alert alert-danger text-center">
                  Products load karne mein error aaya. Backend check karein.
                </div>
              )}

              {!shopId && !isLoading && (
                <div className="alert alert-warning text-center">
                  Koi shop select nahi hai. Dashboard se shop select karein.
                </div>
              )}

              {!isLoading && !isError && shopId && filteredProducts.length === 0 && (
                <div className="text-center py-5">
                  <i className="fas fa-box-open fa-3x mb-3" style={{ color: '#ccc' }}></i>
                  <p>Koi product nahi mila.</p>
                </div>
              )}

              {!isLoading && filteredProducts.length > 0 && (
                <div className="row product-list">
                  {filteredProducts.map((product) => (
                    <div key={product._id} className="col-sm-6 col-lg-4 col-xl-3">
                      <div className="product-item">
                        <div className="product-thumb">
                          <a onClick={() => openModal(product)} style={{ cursor: 'pointer' }}>
                            <img
                              src={product.imageUrl || '/assets/images/products/01.png'}
                              alt={product.name}
                              onError={(e) => { e.target.src = '/assets/images/products/01.png'; }}
                            />
                          </a>
                          {product.isLowStock && (
                            <span className="batch sale">Low Stock</span>
                          )}
                        </div>
                        <div className="product-content">
                          <a href="#" className="cata">
                            {product.category?.charAt(0).toUpperCase() + product.category?.slice(1)}
                          </a>
                          <h6>
                            <a
                              href="#"
                              className="product-title"
                              onClick={(e) => { e.preventDefault(); openModal(product); }}
                            >
                              {product.name}
                            </a>
                          </h6>
                          <p className="quantity">
                            {product.stock?.quantity ?? 0} {product.stock?.unit || 'pcs'}
                          </p>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="price">
                              {product.pricing?.currency || 'PKR'} {product.pricing?.sellingPrice}
                              {product.pricing?.costPrice > 0 && (
                                <del className="ml-2">
                                  {product.pricing.currency || 'PKR'} {product.pricing.costPrice}
                                </del>
                              )}
                            </div>
                            <div className="cart-btn-toggle">
                              <span className="cart-btn">
                                <i className="fas fa-shopping-cart"></i> Cart
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </section>

        </div>
      </div>

      {/* product detail modal */}
      {selectedProduct && (
        <section className="product-details-popup" style={{ display: 'block' }}>
          <div className="modal-overlay" onClick={closeModal}></div>
          <div className="container">
            <div className="product-zoom-info-container">
              <div className="closed-modal" onClick={closeModal}>X</div>
              <div className="row align-items-center">
                <div className="col-lg-6">
                  <img
                    src={selectedProduct.imageUrl || '/assets/images/products/01.png'}
                    alt={selectedProduct.name}
                    className="img-fluid"
                    onError={(e) => { e.target.src = '/assets/images/products/01.png'; }}
                  />
                </div>
                <div className="col-lg-6">
                  <div className="product-details-content">
                    <a href="#" className="cata">
                      {selectedProduct.category?.charAt(0).toUpperCase() + selectedProduct.category?.slice(1)}
                    </a>
                    <h2>{selectedProduct.name}</h2>
                    <p className="quantity">
                      Stock: {selectedProduct.stock?.quantity ?? 0} {selectedProduct.stock?.unit || 'pcs'}
                    </p>
                    <h3 className="price">
                      {selectedProduct.pricing?.currency || 'PKR'} {selectedProduct.pricing?.sellingPrice}
                      {selectedProduct.pricing?.costPrice > 0 && (
                        <del className="ml-3">
                          {selectedProduct.pricing.currency || 'PKR'} {selectedProduct.pricing.costPrice}
                        </del>
                      )}
                    </h3>
                    {selectedProduct.description && <p>{selectedProduct.description}</p>}
                    <div className="d-flex justify-content-end mt-3">
                      <button
                        onClick={closeModal}
                        style={{
                          background: '#4CAF50', color: '#fff',
                          padding: '8px 24px', border: 'none',
                          borderRadius: '4px', cursor: 'pointer'
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

    </PublicLayout>
  );
};

export default ProductFullwidth;
