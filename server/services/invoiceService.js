const generateInvoice = (order, shop) => {
  const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    invoiceNumber,
    shop: {
      name: shop?.name || 'My Shop',
      address: shop?.address || 'Pakistan',
      phone: shop?.phone || '',
      businessType: shop?.businessType || 'retail'
    },
    customer: {
      name: order.customerName || 'Guest',
      phone: order.customerPhone || '',
    },
    items: order.items.map(item => ({
      name: item.name,
      qty: item.qty,
      price: item.price,
      total: item.total || (item.qty * item.price)
    })),
    pricing: {
      subtotal: order.pricing.subtotal,
      discount: order.pricing.discount || 0,
      tax: order.pricing.tax || 0,
      total: order.pricing.total
    },
    payment: {
      method: order.payment.method,
      status: order.payment.status,
      transactionId: order.payment.transactionId,
      processedAt: new Date()
    }
  };
};

module.exports = { generateInvoice };
