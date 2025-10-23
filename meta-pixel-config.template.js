const metaPixelConfig = {
  pixelId: 'PLACEHOLDER_PIXEL_ID',
  enabled: true,
  debug: false,
  advanced: {
    autoConfig: true,
    customEvents: {
      viewMenu: 'ViewMenu',
      selectCategory: 'SelectCategory',
      viewProduct: 'ViewContent',
      addToCart: 'AddToCart',
      removeFromCart: 'RemoveFromCart',
      initiateCheckout: 'InitiateCheckout',
      contactWhatsApp: 'Contact'
    }
  }
};

function initMetaPixel() {
  if (!metaPixelConfig.enabled) {
    if (metaPixelConfig.debug) {
      console.log('Meta Pixel está deshabilitado');
    }
    return;
  }

  if (metaPixelConfig.pixelId === 'YOUR_PIXEL_ID_HERE' || !metaPixelConfig.pixelId || metaPixelConfig.pixelId === 'PLACEHOLDER_PIXEL_ID') {
    console.warn('⚠️ Meta Pixel: Configura tu Pixel ID en GitHub Secrets');
    return;
  }

  !function(f,b,e,v,n,t,s) {
    if(f.fbq) return;
    n=f.fbq=function(){
      n.callMethod ? n.callMethod.apply(n,arguments) : n.queue.push(arguments)
    };
    if(!f._fbq) f._fbq=n;
    n.push=n;
    n.loaded=!0;
    n.version='2.0';
    n.queue=[];
    t=b.createElement(e);
    t.async=!0;
    t.src=v;
    s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  fbq('init', metaPixelConfig.pixelId);
  fbq('track', 'PageView');

  if (metaPixelConfig.debug) {
    console.log('✅ Meta Pixel inicializado:', metaPixelConfig.pixelId);
  }
}

function trackMetaEvent(eventName, params = {}) {
  if (!metaPixelConfig.enabled || typeof fbq === 'undefined') {
    return;
  }

  try {
    fbq('track', eventName, params);

    if (metaPixelConfig.debug) {
      console.log(`📊 Meta Pixel Event: ${eventName}`, params);
    }
  } catch (error) {
    console.error('Error al rastrear evento de Meta Pixel:', error);
  }
}

function trackCustomMetaEvent(eventName, params = {}) {
  if (!metaPixelConfig.enabled || typeof fbq === 'undefined') {
    return;
  }

  try {
    fbq('trackCustom', eventName, params);

    if (metaPixelConfig.debug) {
      console.log(`📊 Meta Pixel Custom Event: ${eventName}`, params);
    }
  } catch (error) {
    console.error('Error al rastrear evento personalizado:', error);
  }
}

function trackProductView(product) {
  if (!product) return;

  trackMetaEvent('ViewContent', {
    content_name: product.name,
    content_category: product.category || product.type,
    content_ids: [product.id],
    content_type: 'product',
    value: product.price,
    currency: 'MXN'
  });
}

function trackAddToCart(product, quantity = 1) {
  if (!product) return;

  trackMetaEvent('AddToCart', {
    content_name: product.name,
    content_category: product.category || product.type,
    content_ids: [product.id],
    content_type: 'product',
    value: product.price * quantity,
    currency: 'MXN',
    quantity: quantity
  });
}

function trackInitiateCheckout(cartItems, totalValue) {
  if (!cartItems || cartItems.length === 0) return;

  const contentIds = cartItems.map(item => item.id || item.name);
  const contents = cartItems.map(item => ({
    id: item.id || item.name,
    quantity: item.quantity || 1,
    item_price: item.price
  }));

  trackMetaEvent('InitiateCheckout', {
    content_ids: contentIds,
    contents: contents,
    content_type: 'product',
    value: totalValue,
    currency: 'MXN',
    num_items: cartItems.length
  });
}

function trackWhatsAppContact(source = 'unknown') {
  trackMetaEvent('Contact', {
    contact_type: 'whatsapp',
    source: source
  });
}

function trackCategorySelection(categoryName) {
  trackCustomMetaEvent('SelectCategory', {
    category_name: categoryName
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMetaPixel);
} else {
  initMetaPixel();
}

window.metaPixel = {
  track: trackMetaEvent,
  trackCustom: trackCustomMetaEvent,
  trackProductView,
  trackAddToCart,
  trackInitiateCheckout,
  trackWhatsAppContact,
  trackCategorySelection
};
