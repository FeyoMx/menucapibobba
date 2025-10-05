// script.js
console.log("Script file loaded and executing.");

// Importar funciones de Firebase directamente ya que script.js ahora es un módulo
import { collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Declaración de currentObserver en el ámbito global
let currentObserver = null;

// --- Variables Globales para Firebase y Datos ---
let db; // Instancia de Firestore
let menuId; // ID del menú para la ruta de Firestore
let appId; // ID de la aplicación para la ruta de Firestore (será el projectId de Firebase)

let productsData = { // Objeto para almacenar todos los datos de productos por categoría
    // ... (contenido sin cambios)
    waterFrappes: [],
    milkFrappes: [],
    hotDrinks: [],
    toppings: [],
    specialties: [], // NUEVA categoría para Chamoyadas, Yogurtadas, etc.
    promotions: [],
    desserts: [] // NUEVA categoría para Postres y Snacks (CapiGofre)
};
let availableToppings = []; // Array para almacenar los toppings disponibles globalmente
let cart = []; // Carrito de compras
let lastClickedAddButton = null; // Para el feedback visual del botón "Añadir"
let chamoyadaBaseFlavor = null; // Almacena el sabor base seleccionado para la chamoyada
let isInitialDataLoaded = false; // Flag to track initial data load
let lazyLoadObserver; // Observer para lazy loading de imágenes
let currentProductForToppings = null; // Almacena el producto al que se le están añadiendo toppings

// Variables para personalización de productos
let chamoyadaSelectedToppings = []; // Almacena los toppings seleccionados para la chamoyada
let currentChamoyadaProduct = null; // Almacena el producto Chamoyada original al abrir el modal
let yogurtadaBaseFlavor = null; // Almacena el sabor base seleccionado para la yogurtada
let yogurtadaSelectedToppings = []; // Almacena los toppings seleccionados para la yogurtada
let currentYogurtadaProduct = null; // Almacena el producto Yogurtada original al abrir el modal
let capigofreBaseCama = null; // Almacena la cama seleccionada para CapiGofre (Chocolate o Lechera)
let capigofreSelectedToppings = []; // Almacena los toppings seleccionados para CapiGofre
let currentCapigofreProduct = null; // Almacena el producto CapiGofre original al abrir el modal

// --- Mapeo de tipos de producto de Firestore a las claves de productsData ---
// Esto es crucial para que los productos se asignen a la categoría correcta
// Incluye tanto los tipos "antiguos" (si aún existen en Firestore) como los "nuevos"
const productTypeMap = {
    // Tipos que vienen de la definición original en script.js (si se importaron así)
    "water-based-frappe": "waterFrappes",
    "milk-based-frappe": "milkFrappes",
    "hot-drink": "hotDrinks",
    "yogurtada": "specialties", // Yogurtada es una especialidad
    "chamoyada": "specialties", // Chamoyada es una especialidad
    "capigofre": "desserts", // CapiGofre es un postre
    "promotion": "promotions", // Otros elementos de promoción (singular)
    "promotions": "promotions", // Mapeo para el tipo "promotions" (plural)

    // Tipos que vienen del admin-script.js (los nuevos y consistentes)
    "waterFrappes": "waterFrappes",
    "milkFrappes": "milkFrappes",
    "hotDrinks": "hotDrinks",
    "toppings": "toppings",
    "specialties": "specialties", // NUEVO tipo para especialidades
    "desserts": "desserts" // NUEVO tipo para postres y snacks
};


// --- Referencias del DOM ---
const waterFrappesGrid = document.getElementById('waterFrappesGrid');
const milkFrappesGrid = document.getElementById('milkFrappesGrid');
const hotDrinksGrid = document.getElementById('hotDrinksGrid');
const toppingsGrid = document.getElementById('toppingsGrid');
const specialtiesGrid = document.getElementById('specialtiesGrid'); // Grid para especialidades
const promotionsGrid = document.getElementById('promotionsGrid');
const dessertsGrid = document.getElementById('dessertsGrid'); // Grid para postres y snacks
const cartButton = document.getElementById('cartButton');
const cartItemCount = document.getElementById('cartItemCount');
const cartModal = document.getElementById('cartModal');
const closeCartModalBtn = cartModal.querySelector('.close-modal-button');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalSpan = document.getElementById('cartTotal');
const clearCartBtn = document.getElementById('clearCartBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const whatsappOrderBtn = document.getElementById('whatsappOrderBtn'); // Referencia al botón del footer
const flavorImageModal = document.getElementById('flavorImageModal');
const closeFlavorImageModalBtn = flavorImageModal.querySelector('.close-modal-button');
const flavorImageTitle = document.getElementById('flavorImageTitle');
const flavorImageDisplay = document.getElementById('flavorImageDisplay');
const toppingSelectionModal = document.getElementById('toppingSelectionModal');
const closeToppingSelectionModalBtn = toppingSelectionModal.querySelector('.close-modal-button');
const toppingModalProductName = document.getElementById('toppingModalProductName');
const availableToppingsGrid = document.getElementById('availableToppingsGrid');
const confirmToppingsButton = document.getElementById('confirmToppingsButton');
const cancelToppingsButton = document.getElementById('cancelToppingsButton');
const chamoyadaCustomizationOverlay = document.getElementById('chamoyadaCustomizationOverlay');
const chamoyadaBaseFlavorGrid = document.getElementById('chamoyadaBaseFlavorGrid');
const chamoyadaToppingsGrid = document.getElementById('chamoyadaToppingsGrid');
const confirmChamoyadaButton = document.getElementById('confirmChamoyadaButton');
const cancelChamoyadaButton = document.getElementById('cancelChamoyadaButton');
const closeChamoyadaModalBtn = chamoyadaCustomizationOverlay.querySelector('.close-modal-button');
const yogurtadaCustomizationOverlay = document.getElementById('yogurtadaCustomizationOverlay');
const yogurtadaBaseFlavorGrid = document.getElementById('yogurtadaBaseFlavorGrid');
const yogurtadaToppingsGrid = document.getElementById('yogurtadaToppingsGrid');
const confirmYogurtadaButton = document.getElementById('confirmYogurtadaButton');
const cancelYogurtadaButton = document.getElementById('cancelYogurtadaButton');
const closeYogurtadaModalBtn = yogurtadaCustomizationOverlay.querySelector('.close-modal-button');
const capigofreCustomizationOverlay = document.getElementById('capigofreCustomizationOverlay');
const capigofreBaseCamaGrid = document.getElementById('capigofreBaseCamaGrid');
const capigofreToppingsGrid = document.getElementById('capigofreToppingsGrid');
const confirmCapigofreButton = document.getElementById('confirmCapigofreButton');
const cancelCapigofreButton = document.getElementById('cancelCapigofreButton');
const closeCapigofreModalBtn = capigofreCustomizationOverlay.querySelector('.close-modal-button');
const loadingMessages = document.querySelectorAll('.loading-message');

// --- Funciones de Utilidad ---

/**
 * Elimina acentos y convierte a minúsculas para una comparación de texto robusta.
 * @param {string} text - El texto a normalizar.
 * @returns {string} - El texto normalizado.
 */
function normalizeText(text) {
    if (typeof text !== 'string') return '';
    return text
        .normalize("NFD") // Separa los caracteres base de sus diacríticos
        .replace(/[\u0300-\u036f]/g, "") // Elimina los diacríticos
        .toLowerCase(); // Convierte a minúsculas
}

/**
 * Muestra el modal de alerta personalizado.
 * @param {string} title - Título del modal.
 * @param {string} message - Mensaje del modal.
 */
// window.showCustomAlert ya está definido en index.html para ser global

/**
 * Muestra u oculta los mensajes de carga.
 * @param {boolean} show - True para mostrar, false para ocultar.
 */
function showLoadingMessages(show) {
    loadingMessages.forEach(msg => {
        msg.style.display = show ? 'block' : 'none';
    });

    // Ocultar/mostrar grids mientras carga para evitar mostrar contenido antiguo
    // Solo si no hay productos, mostrar el mensaje de "no hay productos"
    if (!show) {
        // Si no hay productos en una categoría, mostrar el mensaje de "no hay productos"
        // y asegurar que el contenedor esté visible (display: block para el p, o grid para el contenedor)
        if (productsData.waterFrappes.length === 0) { waterFrappesGrid.innerHTML = '<p class="no-products-message">No hay productos disponibles en esta sección.</p>'; waterFrappesGrid.style.display = 'block'; } else { waterFrappesGrid.style.display = 'grid'; }
        if (productsData.milkFrappes.length === 0) { milkFrappesGrid.innerHTML = '<p class="no-products-message">No hay productos disponibles en esta sección.</p>'; milkFrappesGrid.style.display = 'block'; } else { milkFrappesGrid.style.display = 'grid'; }
        if (productsData.hotDrinks.length === 0) { hotDrinksGrid.innerHTML = '<p class="no-products-message">No hay productos disponibles en esta sección.</p>'; hotDrinksGrid.style.display = 'block'; } else { hotDrinksGrid.style.display = 'grid'; }
        if (productsData.toppings.length === 0) { toppingsGrid.innerHTML = '<p class="no-products-message">No hay productos disponibles en esta sección.</p>'; toppingsGrid.style.display = 'block'; } else { toppingsGrid.style.display = 'grid'; }
        if (productsData.promotions.length === 0) { promotionsGrid.innerHTML = '<p class="no-products-message">No hay promociones disponibles en este momento.</p>'; promotionsGrid.style.display = 'block'; } else { promotionsGrid.style.display = 'grid'; }
        if (productsData.specialties.length === 0) { specialtiesGrid.innerHTML = '<p class="no-products-message">No hay especialidades disponibles en este momento.</p>'; specialtiesGrid.style.display = 'block'; } else { specialtiesGrid.style.display = 'grid'; }
    } else {
        // Mientras carga, ocultar los grids para evitar destellos de contenido antiguo
        waterFrappesGrid.style.display = 'none';
        milkFrappesGrid.style.display = 'none';
        hotDrinksGrid.style.display = 'none';
        toppingsGrid.style.display = 'none';
        promotionsGrid.style.display = 'none';
        specialtiesGrid.style.display = 'none';
    }

    // Asegurarse de que las secciones padre sean visibles si estaban ocultas
    document.querySelectorAll('.menu-section').forEach(section => {
        section.style.display = 'block';
    });
}

/**
 * Función de throttling para limitar la ejecución de una función.
 * @param {Function} func - La función a limitar.
 * @param {number} limit - El tiempo en milisegundos para limitar.
 * @returns {Function} - La función limitada.
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// --- Inicialización de Firebase (llamado desde index.html) ---
// Hacemos initMenu global para que el script de inicialización de Firebase en index.html pueda llamarla
window.initMenu = function(_db, _menuId, _appId) {
    db = _db;
    menuId = _menuId;
    appId = _appId;
    console.log('Firebase y Menu ID inicializados en script.js');
    document.body.classList.add('data-loading'); // Add loading state to body
    loadProductsFromFirestore();
};

/**
 * Carga los productos desde Firestore y configura los listeners en tiempo real.
 * Ahora escucha una única colección 'products' y filtra por tipo.
 */
async function loadProductsFromFirestore() {
    showLoadingMessages(true);
    const baseCollectionPath = `artifacts/${appId}/menus/${menuId}`;
    const productsCollectionRef = collection(db, `${baseCollectionPath}/products`);

    onSnapshot(productsCollectionRef, (snapshot) => {
        // Reiniciar todas las categorías
        productsData = {
            waterFrappes: [],
            milkFrappes: [],
            hotDrinks: [],
            toppings: [],
            specialties: [],
            promotions: []
        };

        snapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };

            // FILTRO: Solo procesar productos que están activos.
            // Si `isActive` no existe (productos antiguos), se considera activo (product.isActive !== false).
            if (product.isActive === false) {
                return; // Saltar este producto y no mostrarlo en el menú.
            }
            // Asegurarse de que product.type es un string y limpiarlo de espacios
            const productTypeValue = typeof product.type === 'string' ? product.type.trim() : product.type;

            console.log("DEBUG: Processing product:", product.name, "Raw Type:", product.type, "Trimmed Type:", productTypeValue);
            const categoryKey = productTypeMap[productTypeValue];
            console.log("DEBUG: Resolved categoryKey:", categoryKey);
            console.log("DEBUG: productsData hasOwnProperty(categoryKey):", productsData.hasOwnProperty(categoryKey));


            if (categoryKey && productsData.hasOwnProperty(categoryKey)) {
                productsData[categoryKey].push(product);
            } else {
                console.warn(`Producto con tipo desconocido o sin mapear: ${product.type}`, product);
            }
        });

        console.log("Todos los datos de productos actualizados desde Firestore:", productsData);

        // Actualizar la variable global de toppings
        availableToppings = productsData.toppings;

        // Renderizar todas las secciones después de una carga completa
        renderMenuSections();
        showLoadingMessages(false); // Ocultar mensajes de carga después de renderizar

        // If this is the first successful data load, remove the loading state
        if (!isInitialDataLoaded) {
            document.body.classList.remove('data-loading');
            isInitialDataLoaded = true;
            console.log("Initial data loaded. UI is now fully interactive.");
        }
    }, (error) => {
        console.error(`Error al escuchar la colección 'products' en Firestore:`, error);
        window.showCustomAlert('Error de Carga', `No se pudieron cargar los productos del menú.`);
        showLoadingMessages(false);
        document.body.classList.remove('data-loading'); // Ensure UI is not blocked on error
    });
}

/**
 * Renderiza todas las secciones del menú con los datos actuales.
 */
function renderMenuSections() {
    renderProducts(productsData.waterFrappes, waterFrappesGrid);
    renderProducts(productsData.milkFrappes, milkFrappesGrid);
    renderProducts(productsData.hotDrinks, hotDrinksGrid);
    renderProducts(productsData.toppings, toppingsGrid); // Renderiza toppings en su sección
    renderComplexItems(productsData.specialties, specialtiesGrid); // Renderiza especialidades
    renderComplexItems(productsData.promotions, promotionsGrid); // Renderiza promociones
    renderComplexItems(productsData.desserts, dessertsGrid); // Renderiza postres y snacks
}

/**
 * Renderiza productos complejos como Especialidades y Promociones.
 * @param {Array} items - Array de objetos de item (especialidad o promoción).
 * @param {HTMLElement} container - El elemento DOM donde se renderizarán los items.
 */
function renderComplexItems(items, container) {
    container.innerHTML = ''; // Limpiar el contenedor
    if (!items || items.length === 0) {
        let message = 'No hay productos disponibles en este momento.';
        if (container.id === 'specialtiesGrid') {
            message = 'No hay especialidades disponibles en este momento.';
        } else if (container.id === 'promotionsGrid') {
            message = 'No hay promociones disponibles en este momento.';
        } else if (container.id === 'dessertsGrid') {
            message = 'No hay postres disponibles en este momento.';
        }
        container.innerHTML = `<p class="no-products-message">${message}</p>`;
        container.style.display = 'block';
        return;
    }

    items.forEach(item => {
        const itemCard = document.createElement('article');
        itemCard.className = 'promotion-card'; // Reutilizamos el estilo de la tarjeta de promoción
        itemCard.setAttribute('tabindex', '0');
        itemCard.setAttribute('role', 'button');
        itemCard.setAttribute('aria-label', `Ver detalles de: ${item.displayName || item.name}, ${item.description}, Precio: $${item.price ? item.price.toFixed(2) : '0.00'}`);

        itemCard.innerHTML = `
            <div class="promotion-info">
                <h3 class="promotion-name">${item.displayName || item.name}</h3>
                <p class="promotion-description">${item.description}</p>
                <p class="promotion-price">$${item.price ? item.price.toFixed(2) : '0.00'}</p>
            </div>
            <button class="add-to-cart-btn" data-product-id="${item.id}" aria-label="Añadir ${item.displayName || item.name} al carrito">Añadir ➕</button>
        `;
        container.appendChild(itemCard);

        // Event listener para abrir modal de imagen al hacer click en la tarjeta (no en el botón)
        itemCard.addEventListener('click', (event) => {
            if (event.target.tagName !== 'BUTTON') {
                openFlavorImageModal(item.displayName || item.name, item.imageUrl);
            }
        });
        itemCard.addEventListener('keydown', (event) => {
            if ((event.key === 'Enter' || event.key === ' ') && event.target.tagName !== 'BUTTON') {
                event.preventDefault();
                openFlavorImageModal(item.displayName || item.name, item.imageUrl);
            }
        });
    });

    // Añadir event listeners a los botones "Añadir al Carrito"
    container.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            // Buscar el producto en todas las categorías de datos
            const product = Object.values(productsData).flat().find(p => p.id === productId);

            if (product) {
                // Feedback visual al añadir
                if (lastClickedAddButton) {
                    lastClickedAddButton.classList.remove('added');
                    lastClickedAddButton.textContent = 'Añadir ➕';
                }
                lastClickedAddButton = event.target;
                lastClickedAddButton.classList.add('added');
                lastClickedAddButton.textContent = '¡Añadido! 🎉';
                setTimeout(() => {
                    if (lastClickedAddButton) {
                        lastClickedAddButton.classList.remove('added');
                        lastClickedAddButton.textContent = 'Añadir ➕';
                        lastClickedAddButton = null;
                    }
                }, 1500);

                // Lógica para abrir modal de personalización o añadir directamente
                const productNameLower = (product.name || '').toLowerCase();
                if (productNameLower.includes('chamoyada')) {
                    openChamoyadaCustomizationModal(product);
                } else if (productNameLower.includes('yogurtada')) {
                    openYogurtadaCustomizationModal(product);
                } else if (productNameLower.includes('capigofre') || productNameLower.includes('gofre')) {
                    openCapigofreCustomizationModal(product);
                } else if (product.price < 0) { // Si es un descuento (precio negativo)
                    addToCart(product);
                    window.showCustomAlert('Descuento Añadido', `"${product.displayName || product.name}" ha sido añadido a tu carrito.`);
                } else {
                    // Para otras promociones o especialidades no personalizables
                    addToCart(product);
                    window.showCustomAlert('Producto Añadido', `"${product.displayName || product.name}" ha sido añadido a tu carrito.`);
                }
            }
        });
    });
    container.style.display = 'grid';
}

/**
 * Renderiza una lista de productos en un contenedor específico.
 * @param {Array} products - Array de productos a renderizar.
 * @param {HTMLElement} container - El elemento DOM donde se renderizarán los productos.
 */
function renderProducts(products, container) {
    container.innerHTML = ''; // Limpiar el contenedor
    if (!products || products.length === 0) {
        container.innerHTML = '<p class="no-products-message">No hay productos disponibles en esta sección.</p>';
        container.style.display = 'block'; // Asegurarse de que el mensaje sea visible
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('article');
        productCard.className = 'product-card';
        productCard.setAttribute('tabindex', '0');

        const isToppingCard = container.id === 'toppingsGrid';

        // Condicionalmente crea el botón "Añadir" y ajusta los atributos de la tarjeta.
        const buttonHtml = isToppingCard
            ? '' // No hay botón para los toppings.
            : `<button class="add-to-cart-btn" data-product-id="${product.id}" data-product-category="${productTypeMap[product.type]}" aria-label="Añadir ${product.displayName || product.name} al carrito">Añadir ➕</button>`;

        if (isToppingCard) {
            productCard.classList.add('info-only'); // Añade una clase para estilos específicos.
            productCard.setAttribute('role', 'listitem'); // Más semántico para un ítem no interactivo.
        } else {
            productCard.setAttribute('role', 'button'); // Es interactiva.
        }
        
        productCard.setAttribute('aria-label', `${product.displayName || product.name}, ${product.description}, $${product.price ? product.price.toFixed(2) : '0.00'}`);

        // La imagen no se muestra en la tarjeta, solo en el modal.
        productCard.innerHTML = `
            <div class="product-info">
                <h3 class="product-name">${product.displayName || product.name}</h3>
                <p class="product-description">${product.description}</p>
                <p class="product-price">$${product.price ? product.price.toFixed(2) : '0.00'}</p>
            </div>
            ${buttonHtml}
        `;
        container.appendChild(productCard);

        // Solo añadir listeners de click para abrir modal de imagen si NO es un topping.
        if (!isToppingCard) {
            productCard.addEventListener('click', (event) => {
                if (event.target.tagName !== 'BUTTON') {
                    openFlavorImageModal(product.displayName || product.name, product.imageUrl); // Usar imageUrl
                }
            });
            productCard.addEventListener('keydown', (event) => {
                if ((event.key === 'Enter' || event.key === ' ') && event.target.tagName !== 'BUTTON') {
                    event.preventDefault(); // Prevenir el scroll de la página con espacio
                    openFlavorImageModal(product.displayName || product.name, product.imageUrl); // Usar imageUrl
                }
            });
        }
    });

    // Añadir event listeners a los botones "Añadir al Carrito"
    container.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            const productCategory = event.target.dataset.productCategory; // Obtener la categoría mapeada
            // Buscar el producto en todas las categorías
            const product = Object.values(productsData).flat().find(p => p.id === productId);

            if (product) {
                // Feedback visual al añadir (antes de abrir modal o añadir directamente)
                if (lastClickedAddButton) {
                    lastClickedAddButton.classList.remove('added');
                    lastClickedAddButton.textContent = 'Añadir ➕';
                }
                lastClickedAddButton = event.target;
                lastClickedAddButton.classList.add('added');
                lastClickedAddButton.textContent = '¡Añadido! 🎉';
                setTimeout(() => {
                    if (lastClickedAddButton) {
                        lastClickedAddButton.classList.remove('added');
                        lastClickedAddButton.textContent = 'Añadir ➕';
                        lastClickedAddButton = null;
                    }
                }, 1500);

                // Lógica para abrir modal de toppings o añadir directamente
                if (productCategory === "waterFrappes" || productCategory === "milkFrappes" || productCategory === "hotDrinks") {
                    openToppingSelectionModal(product); // Abre modal de toppings para bebidas normales
                } else if (product.isChamoyada) { // NUEVA LÓGICA: Usar el flag 'isChamoyada'
                    openChamoyadaCustomizationModal(product); // Abre modal de personalización de Chamoyada
                } else {
                    // Para productos que no son bebidas ni chamoyadas (como toppings), abrir modal de toppings
                    openToppingSelectionModal(product);
                }
            }
        });
    });
    container.style.display = 'grid'; // Mostrar el grid una vez cargado
}

// --- Lógica del Carrito ---

/**
 * Añade un producto al carrito o incrementa su cantidad.
 * @param {Object} product - El objeto del producto a añadir.
 * @param {Array} [selectedToppings=[]] - Array de toppings seleccionados para el producto.
 */
function addToCart(product, selectedToppings = []) {
    const existingItemIndex = cart.findIndex(item =>
        item.id === product.id &&
        JSON.stringify(item.selectedToppings || []) === JSON.stringify(selectedToppings)
    );

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1,
            selectedToppings: selectedToppings // Guardar los toppings seleccionados
        });
    }

    // Animar el botón del carrito
    const cartButton = document.getElementById('cartButton');
    if (cartButton) {
        cartButton.classList.add('item-added-animation');
        // Quita la clase después de que la animación termine para poder volver a usarla
        setTimeout(() => {
            cartButton.classList.remove('item-added-animation');
        }, 600); // 600ms es la duración de la animación en styles.css
    }

    updateCartDisplay();
}

/**
 * Elimina un producto del carrito o decrementa su cantidad.
 * @param {string} productId - El ID del producto a eliminar.
 * @param {Array} [selectedToppings=[]] - Array de toppings del producto a eliminar (para ítems personalizados).
 */
function removeFromCart(productId, selectedToppings = []) {
    const itemIndex = cart.findIndex(item =>
        item.id === productId &&
        JSON.stringify(item.selectedToppings || []) === JSON.stringify(selectedToppings)
    );

    if (itemIndex > -1) {
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity--;
        } else {
            cart.splice(itemIndex, 1);
        }
        updateCartDisplay();
    }
}

/**
 * Actualiza la visualización del carrito (contador, lista de ítems, total).
 */
function updateCartDisplay() {
    // Actualiza los enlaces de WhatsApp cada vez que cambia el carrito.
    updateWhatsAppLinks();

    cartItemCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    cartItemsContainer.innerHTML = ''; // Limpiar la lista
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-message">Tu carrito está vacío.</p>';
    } else {
        cart.forEach(item => {
            const itemPrice = item.price;
            const toppingsCost = item.selectedToppings ? item.selectedToppings.reduce((sum, t) => sum + t.price, 0) : 0;
            const itemSubtotal = (itemPrice + toppingsCost) * item.quantity;
            total += itemSubtotal;

            const cartItemDiv = document.createElement('div');
            cartItemDiv.className = 'cart-item';
            cartItemDiv.innerHTML = `
                <img data-src="${item.imageUrl || 'https://placehold.co/50x50/ADD8E6/000000?text=No+Image'}" alt="${item.displayName || item.name}" class="cart-item-image lazy-load">
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.displayName || item.name}</span>
                    ${item.selectedToppings && item.selectedToppings.length > 0 ?
                        `<div class="cart-item-toppings">(${item.selectedToppings.map(t => t.name).join(', ')})</div>` : ''}
                    <span class="cart-item-price">$${item.price ? item.price.toFixed(2) : '0.00'} c/u</span>
                </div>
                <div class="cart-item-quantity-controls">
                    <button class="quantity-btn decrease-quantity" data-product-id="${item.id}" data-toppings='${JSON.stringify(item.selectedToppings || [])}'>-</button>
                    <span class="cart-item-quantity">${item.quantity}</span>
                    <button class="quantity-btn increase-quantity" data-product-id="${item.id}" data-toppings='${JSON.stringify(item.selectedToppings || [])}'>+</button>
                </div>
                <span class="cart-item-total">$${itemSubtotal.toFixed(2)}</span>
            `;
            cartItemsContainer.appendChild(cartItemDiv);
        });
    }

    cartTotalSpan.textContent = `$${total.toFixed(2)}`;

    // Observar las nuevas imágenes del carrito para lazy loading
    cartItemsContainer.querySelectorAll('.lazy-load').forEach(img => lazyLoadObserver.observe(img));

    // Añadir event listeners a los botones de cantidad
    cartItemsContainer.querySelectorAll('.increase-quantity').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            const toppings = JSON.parse(event.target.dataset.toppings);
            // Buscar el producto original en productsData
            const product = Object.values(productsData).flat().find(p => p.id === productId);
            if (product) {
                addToCart(product, toppings);
            }
        });
    });

    cartItemsContainer.querySelectorAll('.decrease-quantity').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            const toppings = JSON.parse(event.target.dataset.toppings);
            removeFromCart(productId, toppings);
        });
    });
}

/**
 * Genera el mensaje de WhatsApp con el contenido del carrito.
 * @returns {string} El mensaje formateado para WhatsApp.
 */
function generateWhatsAppMessage() {
    if (cart.length === 0) {
        return "¡Hola! Mi carrito está vacío, pero me gustaría saber más sobre sus deliciosas bebidas Capibobba. 😊";
    }

    let message = "¡Hola! Me gustaría hacer un pedido con los siguientes productos:\n\n";
    let total = 0;

    cart.forEach((item, index) => {
        const itemPrice = item.price;
        const toppingsCost = item.selectedToppings ? item.selectedToppings.reduce((sum, t) => sum + t.price, 0) : 0;
        const itemSubtotal = (itemPrice + toppingsCost) * item.quantity;
        total += itemSubtotal;

        message += `${index + 1}. ${item.displayName || item.name} x ${item.quantity} ($${itemPrice.toFixed(2)} c/u`;
        if (item.selectedToppings && item.selectedToppings.length > 0) {
            message += ` + Toppings: ${item.selectedToppings.map(t => `${t.name} ($${t.price.toFixed(2)})`).join(', ')}`;
        }
        message += `) - Subtotal: $${itemSubtotal.toFixed(2)}\n`;
    });

    message += `\nTotal del pedido: $${total.toFixed(2)}\n\n`;
    message += "¡Espero su confirmación! Gracias. 😊";

    return encodeURIComponent(message);
}

/**
 * Actualiza los enlaces de WhatsApp con el mensaje actual del carrito.
 */
function updateWhatsAppLinks() {
    const whatsappNumber = "5217711831526"; // Reemplaza con tu número de WhatsApp real
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

    // Actualiza tanto el botón del modal del carrito como el del footer
    if (checkoutBtn) checkoutBtn.href = whatsappUrl;
    if (whatsappOrderBtn) whatsappOrderBtn.href = whatsappUrl;
}

// El enlace de "Ordenar por WhatsApp" en el footer ya es una <a>,
// y su href se actualizará dinámicamente por la función updateWhatsAppLinks().
// No necesita un listener de click propio.

// --- Manejo del Modal de Visualización de Imagen ---
/**
 * Abre el modal para mostrar la imagen de un sabor/producto.
 * @param {string} title - El título del sabor/producto.
 * @param {string} imageUrl - La URL de la imagen.
 */
function openFlavorImageModal(title, imageUrl) {
    flavorImageTitle.textContent = title;
    flavorImageDisplay.src = imageUrl || 'https://placehold.co/200x200/ADD8E6/000000?text=No+Image';
    flavorImageDisplay.onerror = function() {
        this.src = 'https://placehold.co/200x200/ADD8E6/000000?text=Error';
    };
    window.openModal(flavorImageModal);
}
/**
 * Abre el modal de selección de toppings para un producto que no es personalizable.
 * @param {Object} product - El producto al que se le añadirán toppings (frappés, bebidas calientes).
 */
function openToppingSelectionModal(product) {
    currentProductForToppings = product; // Guardar el producto actual
    toppingModalProductName.textContent = product.displayName || product.name;
    availableToppingsGrid.innerHTML = ''; // Limpiar toppings previos

    if (availableToppings.length === 0) {
        availableToppingsGrid.innerHTML = '<p class="no-products-message">No hay toppings disponibles.</p>';
    } else {
        availableToppings.forEach(topping => {
            const toppingItem = document.createElement('div');
            toppingItem.className = 'topping-item';
            toppingItem.innerHTML = `
                <input type="checkbox" id="topping-${topping.id}" value="${topping.id}" data-price="${topping.price}">
                <label for="topping-${topping.id}">
                    <span class="topping-name">${topping.name}</span>
                    <span class="topping-price">($${topping.price ? topping.price.toFixed(2) : '0.00'})</span>
                </label>
            `;
            availableToppingsGrid.appendChild(toppingItem);
        });
    }

    window.openModal(toppingSelectionModal);
}

// --- NUEVO: Manejo del Modal de Personalización de Chamoyada ---

/**
 * Abre el modal de personalización de Chamoyada.
 * @param {Object} chamoyadaProduct - El objeto del producto Chamoyada.
 */
function openChamoyadaCustomizationModal(chamoyadaProduct) {
    currentChamoyadaProduct = chamoyadaProduct; // Guardar el contexto del producto original
    chamoyadaBaseFlavor = null; // Resetear selección de sabor base
    chamoyadaSelectedToppings = []; // Resetear selección de toppings

    // Renderizar sabores base (solo frappés base agua)
    chamoyadaBaseFlavorGrid.innerHTML = '';
    const waterFrappes = productsData.waterFrappes;
    if (waterFrappes.length === 0) {
        chamoyadaBaseFlavorGrid.innerHTML = '<p class="no-products-message">No hay sabores base disponibles.</p>';
    } else {
        waterFrappes.forEach(flavor => {
            // Crear una etiqueta <label> que envuelve todo para una mejor accesibilidad y fiabilidad del clic
            const flavorItemLabel = document.createElement('label');
            flavorItemLabel.className = 'flavor-item';
            flavorItemLabel.setAttribute('for', `chamoyada-flavor-${flavor.id}`);
            flavorItemLabel.innerHTML = `
                <input type="radio" id="chamoyada-flavor-${flavor.id}" name="chamoyadaBaseFlavor" value="${flavor.id}">
                <img data-src="${flavor.imageUrl || 'https://placehold.co/50x50/ADD8E6/000000?text=No+Image'}" alt="${flavor.displayName || flavor.name}" class="flavor-image lazy-load" onerror="this.onerror=null;this.src='https://placehold.co/50x50/ADD8E6/000000?text=No+Image';">
                <span class="flavor-name">${flavor.displayName || flavor.name}</span>
            `;
            chamoyadaBaseFlavorGrid.appendChild(flavorItemLabel);
        });
    }

    // Renderizar toppings disponibles, filtrando por los permitidos para esta chamoyada específica
    chamoyadaToppingsGrid.innerHTML = '';
    // Obtener la lista de NOMBRES de toppings permitidos desde el producto chamoyada
    const allowedToppingNames = chamoyadaProduct.toppings || [];
    // Filtrar la lista global de toppings para obtener solo los objetos completos de los toppings permitidos
    const toppingsToShow = availableToppings.filter(topping => allowedToppingNames.includes(topping.name));

    if (toppingsToShow.length === 0) {
        chamoyadaToppingsGrid.innerHTML = '<p class="no-products-message">No hay toppings adicionales para esta promoción.</p>';
    } else {
        toppingsToShow.forEach(topping => {
            const toppingItem = document.createElement('div');
            toppingItem.className = 'topping-item';
            toppingItem.innerHTML = `
                <input type="checkbox" id="chamoyada-topping-${topping.id}" value="${topping.id}" data-price="${topping.price}">
                <label for="chamoyada-topping-${topping.id}">
                    <span class="topping-name">${topping.displayName || topping.name}</span>
                    <span class="topping-price">($${topping.price ? topping.price.toFixed(2) : '0.00'})</span>
                </label>
            `;
            chamoyadaToppingsGrid.appendChild(toppingItem);
        });
    }

    // Observar las nuevas imágenes de sabores para lazy loading
    chamoyadaBaseFlavorGrid.querySelectorAll('.lazy-load').forEach(img => lazyLoadObserver.observe(img));

    window.openModal(chamoyadaCustomizationOverlay);
}

// --- NUEVO: Manejo del Modal de Personalización de Yogurtada ---
/**
 * Abre el modal de personalización de Yogurtada.
 * @param {Object} yogurtadaProduct - El objeto del producto Yogurtada.
 */
function openYogurtadaCustomizationModal(yogurtadaProduct) {
    currentYogurtadaProduct = yogurtadaProduct; // Guardar el contexto del producto original
    yogurtadaBaseFlavor = null; // Resetear selección de sabor base
    yogurtadaSelectedToppings = []; // Resetear selección de toppings

    // Lista de nombres de sabores permitidos para la Yogurtada (en minúsculas para comparación)
    const allowedYogurtadaFlavorNames = [
        'mango', 'fresa', 'blueberry', 'cereza', 'banana', 'pina colada', 'pay de limon', 'coco'
    ];

    // Renderizar sabores base, buscando en AMBAS categorías (agua y leche) y filtrando por la lista permitida.
    yogurtadaBaseFlavorGrid.innerHTML = '';
    const allFrappes = [...productsData.waterFrappes, ...productsData.milkFrappes]; // Combinar ambas listas
    // Filtrar sabores cuyo nombre (en minúsculas) contenga alguna de las palabras clave permitidas.
    // Se usa normalizeText para eliminar acentos y asegurar una comparación correcta.
    const flavorsToShow = allFrappes.filter(flavor => {
        const normalizedFlavorName = normalizeText(flavor.name);
        return allowedYogurtadaFlavorNames.some(allowedName => normalizedFlavorName.includes(allowedName));
    });

    if (flavorsToShow.length === 0) {
        yogurtadaBaseFlavorGrid.innerHTML = '<p class="no-products-message">No hay sabores base disponibles para la Yogurtada en este momento.</p>';
    } else {
        flavorsToShow.forEach(flavor => {
            const flavorItemLabel = document.createElement('label');
            flavorItemLabel.className = 'flavor-item';
            flavorItemLabel.setAttribute('for', `yogurtada-flavor-${flavor.id}`);
            flavorItemLabel.innerHTML = `
                <input type="radio" id="yogurtada-flavor-${flavor.id}" name="yogurtadaBaseFlavor" value="${flavor.id}">
                <img data-src="${flavor.imageUrl || 'https://placehold.co/50x50/ADD8E6/000000?text=No+Image'}" alt="${flavor.displayName || flavor.name}" class="flavor-image lazy-load" onerror="this.onerror=null;this.src='https://placehold.co/50x50/ADD8E6/000000?text=No+Image';">
                <span class="flavor-name">${flavor.displayName || flavor.name}</span>
            `;
            yogurtadaBaseFlavorGrid.appendChild(flavorItemLabel);
        });
    }

    // Renderizar toppings disponibles, filtrando por los permitidos para esta yogurtada específica
    yogurtadaToppingsGrid.innerHTML = '';
    const allowedToppingNames = yogurtadaProduct.toppings || [];
    const toppingsToShow = availableToppings.filter(topping => allowedToppingNames.includes(topping.name));

    if (toppingsToShow.length === 0) {
        yogurtadaToppingsGrid.innerHTML = '<p class="no-products-message">No hay toppings adicionales para esta promoción.</p>';
    } else {
        toppingsToShow.forEach(topping => {
            const toppingItem = document.createElement('div');
            toppingItem.className = 'topping-item';
            toppingItem.innerHTML = `
                <input type="checkbox" id="yogurtada-topping-${topping.id}" value="${topping.id}" data-price="${topping.price}">
                <label for="yogurtada-topping-${topping.id}">
                    <span class="topping-name">${topping.displayName || topping.name}</span>
                    <span class="topping-price">($${topping.price ? topping.price.toFixed(2) : '0.00'})</span>
                </label>
            `;
            yogurtadaToppingsGrid.appendChild(toppingItem);
        });
    }

    // Observar las nuevas imágenes de sabores para lazy loading
    yogurtadaBaseFlavorGrid.querySelectorAll('.lazy-load').forEach(img => lazyLoadObserver.observe(img));

    window.openModal(yogurtadaCustomizationOverlay);
}

// --- NUEVO: Manejo del Modal de Personalización de CapiGofre ---
/**
 * Abre el modal de personalización de CapiGofre.
 * @param {Object} capigofreProduct - El objeto del producto CapiGofre.
 */
function openCapigofreCustomizationModal(capigofreProduct) {
    currentCapigofreProduct = capigofreProduct; // Guardar el contexto del producto original
    capigofreBaseCama = null; // Resetear selección de cama
    capigofreSelectedToppings = []; // Resetear selección de toppings

    // Opciones de cama (hardcoded ya que son específicas de CapiGofre)
    const camaOptions = [
        { id: 'chocolate', name: 'Chocolate', imageUrl: 'https://i.imgur.com/chocolate-icon.png' },
        { id: 'lechera', name: 'Lechera', imageUrl: 'https://i.imgur.com/lechera-icon.png' }
    ];

    // Renderizar opciones de cama
    capigofreBaseCamaGrid.innerHTML = '';
    camaOptions.forEach(cama => {
        const camaItemLabel = document.createElement('label');
        camaItemLabel.className = 'flavor-item';
        camaItemLabel.setAttribute('for', `capigofre-cama-${cama.id}`);
        camaItemLabel.innerHTML = `
            <input type="radio" id="capigofre-cama-${cama.id}" name="capigofreBaseCama" value="${cama.id}">
            <span class="flavor-name">${cama.name}</span>
        `;
        capigofreBaseCamaGrid.appendChild(camaItemLabel);
    });

    // Toppings específicos para CapiGofre (hardcoded)
    const capigofreToppingOptions = [
        { id: 'nuez', name: 'Nuez', price: 0 },
        { id: 'mazapan', name: 'Mazapán', price: 0 },
        { id: 'granillo', name: 'Granillo de Chocolate', price: 0 }
    ];

    // Renderizar toppings disponibles para CapiGofre
    capigofreToppingsGrid.innerHTML = '';
    capigofreToppingOptions.forEach(topping => {
        const toppingItem = document.createElement('div');
        toppingItem.className = 'topping-item';
        toppingItem.innerHTML = `
            <input type="checkbox" id="capigofre-topping-${topping.id}" value="${topping.id}" data-price="${topping.price}">
            <label for="capigofre-topping-${topping.id}">
                <span class="topping-name">${topping.name}</span>
                ${topping.price > 0 ? `<span class="topping-price">($${topping.price.toFixed(2)})</span>` : ''}
            </label>
        `;
        capigofreToppingsGrid.appendChild(toppingItem);
    });

    window.openModal(capigofreCustomizationOverlay);
}

// Event listener for flavor selection in the Chamoyada modal using event delegation.
// This is more efficient and reliable than attaching a listener to each item.
chamoyadaBaseFlavorGrid.addEventListener('change', (event) => {
    // Check if the event was triggered by one of our radio buttons.
    if (event.target.name === 'chamoyadaBaseFlavor') {
        const selectedFlavorId = event.target.value;

        // Find the full flavor object from our data source.
        const selectedFlavorObject = productsData.waterFrappes.find(f => f.id === selectedFlavorId);

        if (selectedFlavorObject) {
            chamoyadaBaseFlavor = selectedFlavorObject;

            // Update visual feedback
            // 1. Remove 'selected' class from all items
            chamoyadaBaseFlavorGrid.querySelectorAll('.flavor-item').forEach(item => {
                item.classList.remove('selected');
            });

            // 2. Add 'selected' class to the parent label of the checked radio button
            const parentLabel = event.target.closest('.flavor-item');
            if (parentLabel) {
                parentLabel.classList.add('selected');
            }
        } else {
            console.error(`Could not find flavor with ID: ${selectedFlavorId} in productsData.waterFrappes`);
            chamoyadaBaseFlavor = null; // Ensure it's null if not found
        }
    }
});

// Event listener for flavor selection in the Yogurtada modal using event delegation.
yogurtadaBaseFlavorGrid.addEventListener('change', (event) => {
    if (event.target.name === 'yogurtadaBaseFlavor') {
        const selectedFlavorId = event.target.value;

        // Buscar el sabor en AMBAS listas de frappés.
        const allFrappes = [...productsData.waterFrappes, ...productsData.milkFrappes];
        const selectedFlavorObject = allFrappes.find(f => f.id === selectedFlavorId);

        if (selectedFlavorObject) {
            yogurtadaBaseFlavor = selectedFlavorObject;

            // Update visual feedback
            // 1. Remove 'selected' class from all items
            yogurtadaBaseFlavorGrid.querySelectorAll('.flavor-item').forEach(item => {
                item.classList.remove('selected');
            });

            // 2. Add 'selected' class to the parent label of the checked radio button
            const parentLabel = event.target.closest('.flavor-item');
            if (parentLabel) {
                parentLabel.classList.add('selected');
            }
        } else {
            console.error(`Could not find flavor with ID: ${selectedFlavorId} in all frappes`);
            yogurtadaBaseFlavor = null; // Ensure it's null if not found
        }
    }
});

// Event listener for cama selection in the CapiGofre modal using event delegation.
capigofreBaseCamaGrid.addEventListener('change', (event) => {
    if (event.target.name === 'capigofreBaseCama') {
        const selectedCamaId = event.target.value;
        capigofreBaseCama = selectedCamaId; // Guardar solo el ID (chocolate o lechera)

        // Update visual feedback
        capigofreBaseCamaGrid.querySelectorAll('.flavor-item').forEach(item => {
            item.classList.remove('selected');
        });

        const parentLabel = event.target.closest('.flavor-item');
        if (parentLabel) {
            parentLabel.classList.add('selected');
        }
    }
});



// --- Animaciones al Scroll (Intersection Observer) ---

/**
 * Inicializa el IntersectionObserver para la carga diferida de imágenes.
 */
function initializeLazyLoader() {
    const observerOptions = {
        root: null, // Observa intersecciones relativas al viewport
        rootMargin: '0px 0px 200px 0px', // Empieza a cargar cuando la imagen está a 200px de entrar en pantalla
        threshold: 0.01 // Se activa tan pronto como un 1% del elemento es visible
    };

    lazyLoadObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.dataset.src;
                if (!src) return;

                img.src = src;
                img.classList.add('loaded'); // Añade clase para la animación de fade-in
                observer.unobserve(img); // Deja de observar la imagen una vez cargada
            }
        });
    }, observerOptions);
}
document.addEventListener('DOMContentLoaded', () => {
    // --- Inicialización General ---
    initializeLazyLoader(); // Inicializar el observador de imágenes
    updateWhatsAppLinks(); // Establecer el enlace inicial de WhatsApp para un carrito vacío

    const animateOnScrollElements = document.querySelectorAll('.animate-on-scroll');

    if ('IntersectionObserver' in window) {
        const observerOptions = {
            root: null, // viewport
            rootMargin: '0px',
            threshold: 0.1 // 10% del elemento visible
        };

        currentObserver = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const animationClass = entry.target.dataset.animation || 'fade-in';
                    entry.target.classList.add('animated', animationClass);
                    observerInstance.unobserve(entry.target);
                }
            });
        }, observerOptions);

        animateOnScrollElements.forEach(element => {
            currentObserver.observe(element);
        });
    } else {
        // Fallback para navegadores que no soportan IntersectionObserver
        animateOnScrollElements.forEach(element => {
            element.classList.add('animated', element.dataset.animation || 'fade-in');
        });
    }

    // --- Manejo de Eventos del Carrito ---
    cartButton.addEventListener('click', () => {
        window.openModal(cartModal);
        updateCartDisplay(); // Asegurarse de que el carrito esté actualizado al abrir
    });

    closeCartModalBtn.addEventListener('click', () => {
        window.closeModal(cartModal);
    });

    clearCartBtn.addEventListener('click', () => {
        cart = [];
        updateCartDisplay();
        window.showCustomAlert('Carrito Vaciado', 'Tu carrito ha sido vaciado.');
    });

    // El botón de checkout ahora es un enlace <a>. Su href se actualiza dinámicamente.
    // Este listener solo añade feedback al usuario y cierra el modal.
    checkoutBtn.addEventListener('click', () => {
        // No se previene la acción por defecto, se deja que el enlace funcione.
        window.showCustomAlert('Redirigiendo a WhatsApp', 'Se abrirá una nueva pestaña para completar tu pedido. Tu carrito no se vaciará automáticamente.');

        // Se cierra el modal después de un breve momento para que el usuario vea el mensaje.
        setTimeout(() => {
            window.closeModal(cartModal);
        }, 2500);

        // IMPORTANTE: No se vacía el carrito. El usuario puede hacerlo manualmente.
        // Esto es más seguro y evita frustración si el usuario no completa el pedido.
    });

    // --- Manejo de Eventos de Modales ---
    closeFlavorImageModalBtn.addEventListener('click', () => {
        window.closeModal(flavorImageModal);
    });

    closeToppingSelectionModalBtn.addEventListener('click', () => {
        window.closeModal(toppingSelectionModal);
        currentProductForToppings = null;
    });

    confirmToppingsButton.addEventListener('click', () => {
        const selectedToppings = [];
        availableToppingsGrid.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            const toppingId = checkbox.value;
            const topping = availableToppings.find(t => t.id === toppingId);
            if (topping) {
                selectedToppings.push(topping);
            }
        });

        if (currentProductForToppings) {
            addToCart(currentProductForToppings, selectedToppings);
            const message = selectedToppings.length > 0
                ? `"${currentProductForToppings.displayName || currentProductForToppings.name}" con toppings añadido al carrito.`
                : `"${currentProductForToppings.displayName || currentProductForToppings.name}" añadido al carrito sin toppings.`;
            window.showCustomAlert('Producto Añadido', message);
        }
        window.closeModal(toppingSelectionModal);
        currentProductForToppings = null;
    });

    cancelToppingsButton.addEventListener('click', () => {
        window.closeModal(toppingSelectionModal);
        currentProductForToppings = null;
    });

    // --- Manejo de Eventos del Modal de Chamoyada ---
    confirmChamoyadaButton.addEventListener('click', () => {
        // Validar que el producto original exista en el contexto
        if (!currentChamoyadaProduct) {
            console.error("Error: No se encontró el producto Chamoyada original para calcular el precio.");
            window.closeModal(chamoyadaCustomizationOverlay);
            return;
        }

        if (!chamoyadaBaseFlavor) {
            window.showCustomAlert('Selección Requerida', 'Por favor, elige un sabor base para tu Chamoyada.');
            return;
        }

        chamoyadaSelectedToppings = [];
        chamoyadaToppingsGrid.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            const toppingId = checkbox.value;
            const topping = availableToppings.find(t => t.id === toppingId);
            if (topping) {
                chamoyadaSelectedToppings.push(topping);
            }
        });

        // Crear un objeto de producto para la Chamoyada personalizada
        const customChamoyada = {
            id: `chamoyada-${chamoyadaBaseFlavor.id}-${Date.now()}`, // ID único para esta combinación
            name: `Chamoyada de ${chamoyadaBaseFlavor.displayName || chamoyadaBaseFlavor.name}`,
            displayName: `Chamoyada de ${chamoyadaBaseFlavor.displayName || chamoyadaBaseFlavor.name}`,
            description: `Con sabor a ${chamoyadaBaseFlavor.displayName || chamoyadaBaseFlavor.name} y toppings seleccionados.`,
            price: currentChamoyadaProduct.price, // El precio base es el del producto "Chamoyada" original
            imageUrl: chamoyadaBaseFlavor.imageUrl, // Usar la imagen del sabor base
            type: "chamoyada",
            baseFlavor: chamoyadaBaseFlavor, // Guardar el objeto completo del sabor base
            selectedToppings: chamoyadaSelectedToppings // Guardar los objetos completos de los toppings
        };

        addToCart(customChamoyada, chamoyadaSelectedToppings);
        window.showCustomAlert('Chamoyada Añadida', `¡Tu Chamoyada de ${chamoyadaBaseFlavor.displayName || chamoyadaBaseFlavor.name} ha sido añadida al carrito!`);
        window.closeModal(chamoyadaCustomizationOverlay);
        currentChamoyadaProduct = null; // Limpiar el contexto
    });

    cancelChamoyadaButton.addEventListener('click', () => {
        window.closeModal(chamoyadaCustomizationOverlay);
        currentChamoyadaProduct = null; // Limpiar el contexto
    });

    closeChamoyadaModalBtn.addEventListener('click', () => {
        window.closeModal(chamoyadaCustomizationOverlay);
        currentChamoyadaProduct = null; // Limpiar el contexto
    });

    // --- Manejo de Eventos del Modal de Yogurtada ---
    confirmYogurtadaButton.addEventListener('click', () => {
        if (!currentYogurtadaProduct) {
            console.error("Error: No se encontró el producto Yogurtada original para calcular el precio.");
            window.closeModal(yogurtadaCustomizationOverlay);
            return;
        }

        if (!yogurtadaBaseFlavor) {
            window.showCustomAlert('Selección Requerida', 'Por favor, elige un sabor base para tu Yogurtada.');
            return;
        }

        yogurtadaSelectedToppings = [];
        yogurtadaToppingsGrid.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            const toppingId = checkbox.value;
            const topping = availableToppings.find(t => t.id === toppingId);
            if (topping) {
                yogurtadaSelectedToppings.push(topping);
            }
        });

        const customYogurtada = {
            id: `yogurtada-${yogurtadaBaseFlavor.id}-${Date.now()}`,
            name: `Yogurtada de ${yogurtadaBaseFlavor.displayName || yogurtadaBaseFlavor.name}`,
            displayName: `Yogurtada de ${yogurtadaBaseFlavor.displayName || yogurtadaBaseFlavor.name}`,
            description: `Con sabor a ${yogurtadaBaseFlavor.displayName || yogurtadaBaseFlavor.name} y toppings seleccionados.`,
            price: currentYogurtadaProduct.price,
            imageUrl: yogurtadaBaseFlavor.imageUrl,
            type: "yogurtada",
            baseFlavor: yogurtadaBaseFlavor,
            selectedToppings: yogurtadaSelectedToppings
        };

        addToCart(customYogurtada, yogurtadaSelectedToppings);
        window.showCustomAlert('Yogurtada Añadida', `¡Tu Yogurtada de ${yogurtadaBaseFlavor.displayName || yogurtadaBaseFlavor.name} ha sido añadida al carrito!`);
        window.closeModal(yogurtadaCustomizationOverlay);
        currentYogurtadaProduct = null;
    });

    cancelYogurtadaButton.addEventListener('click', () => {
        window.closeModal(yogurtadaCustomizationOverlay);
        currentYogurtadaProduct = null;
    });

    closeYogurtadaModalBtn.addEventListener('click', () => {
        window.closeModal(yogurtadaCustomizationOverlay);
        currentYogurtadaProduct = null;
    });

    // --- Manejo de Eventos del Modal de CapiGofre ---
    confirmCapigofreButton.addEventListener('click', () => {
        if (!currentCapigofreProduct) {
            console.error("Error: No se encontró el producto CapiGofre original para calcular el precio.");
            window.closeModal(capigofreCustomizationOverlay);
            return;
        }

        if (!capigofreBaseCama) {
            window.showCustomAlert('Selección Requerida', 'Por favor, elige una cama (Chocolate o Lechera) para tu CapiGofre.');
            return;
        }

        // Recopilar toppings seleccionados
        capigofreSelectedToppings = [];
        const toppingNames = [];
        capigofreToppingsGrid.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            const toppingId = checkbox.value;
            const toppingName = checkbox.nextElementSibling.querySelector('.topping-name').textContent;
            toppingNames.push(toppingName);
            capigofreSelectedToppings.push({
                id: toppingId,
                name: toppingName,
                price: parseFloat(checkbox.dataset.price || 0)
            });
        });

        // Crear un objeto de producto para el CapiGofre personalizado
        const customCapigofre = {
            id: `capigofre-${capigofreBaseCama}-${Date.now()}`,
            name: `CapiGofre con ${capigofreBaseCama === 'chocolate' ? 'Chocolate' : 'Lechera'}`,
            displayName: `CapiGofre con ${capigofreBaseCama === 'chocolate' ? 'Chocolate' : 'Lechera'}`,
            description: `Gofre belga con cama de ${capigofreBaseCama === 'chocolate' ? 'Chocolate' : 'Lechera'}${toppingNames.length > 0 ? ' y ' + toppingNames.join(', ') : ''}.`,
            price: currentCapigofreProduct.price,
            imageUrl: currentCapigofreProduct.imageUrl || 'https://i.imgur.com/capigofre-default.png',
            type: "capigofre",
            baseCama: capigofreBaseCama,
            selectedToppings: capigofreSelectedToppings
        };

        addToCart(customCapigofre, capigofreSelectedToppings);
        window.showCustomAlert('CapiGofre Añadido', `¡Tu CapiGofre con ${capigofreBaseCama === 'chocolate' ? 'Chocolate' : 'Lechera'} ha sido añadido al carrito!`);
        window.closeModal(capigofreCustomizationOverlay);
        currentCapigofreProduct = null;
    });

    cancelCapigofreButton.addEventListener('click', () => {
        window.closeModal(capigofreCustomizationOverlay);
        currentCapigofreProduct = null;
    });

    closeCapigofreModalBtn.addEventListener('click', () => {
        window.closeModal(capigofreCustomizationOverlay);
        currentCapigofreProduct = null;
    });

    // Lógica para el modo claro/oscuro
    const logoLight = document.getElementById('logoLight');
    const logoDark = document.getElementById('logoDark');

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            if (logoLight) logoLight.style.display = 'none';
            if (logoDark) logoDark.style.display = 'inline-block';
        } else {
            document.body.classList.remove('dark-mode');
            if (logoLight) logoLight.style.display = 'inline-block';
            if (logoDark) logoDark.style.display = 'none';
        }
    }

    // Detectar el tema preferido del sistema al cargar
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyTheme('dark');
    } else {
        applyTheme('light');
    }

    // Escuchar cambios en el tema del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        applyTheme(event.matches ? 'dark' : 'light');
    });
});

// --- Funciones de Accesibilidad para Modales ---
let activeModal = null; // Referencia al modal actualmente activo
let previouslyFocusedElement = null; // Elemento que tenía el foco antes de abrir el modal

/**
 * Atrapa el foco del teclado dentro de un elemento.
 * @param {KeyboardEvent} e - El evento de teclado.
 * @param {HTMLElement} container - El contenedor donde se debe atrapar el foco.
 */
function trapFocus(e, container) {
    if (e.key !== 'Tab') return;

    const focusableElements = Array.from(
        container.querySelectorAll(
            'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        )
    ).filter(el => !el.disabled && el.offsetParent !== null);

    if (focusableElements.length === 0) {
        e.preventDefault();
        return;
    }

    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === firstFocusableElement) {
            lastFocusableElement.focus();
            e.preventDefault();
        }
    } else { // Tab
        if (document.activeElement === lastFocusableElement) {
            firstFocusableElement.focus();
            e.preventDefault();
        }
    }
}

/**
 * Maneja los eventos de teclado para el modal activo (Escape y Tab).
 * @param {KeyboardEvent} e - El evento de teclado.
 */
function handleModalKeydown(e) {
    if (!activeModal) return;
    if (e.key === 'Escape') {
        window.closeModal(activeModal);
    } else {
        trapFocus(e, activeModal);
    }
}

/**
 * Abre un modal, gestiona el foco y añade listeners.
 * @param {HTMLElement} modalElement - El elemento del modal a abrir.
 */
window.openModal = function(modalElement) {
    if (!modalElement) return;
    previouslyFocusedElement = document.activeElement;
    activeModal = modalElement;
    modalElement.classList.add('active');
    const firstFocusable = modalElement.querySelector('button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) firstFocusable.focus();
    document.addEventListener('keydown', handleModalKeydown);
}

/**
 * Cierra el modal activo y restaura el foco.
 * @param {HTMLElement} modalElement - El elemento del modal a cerrar.
 */
window.closeModal = function(modalElement) {
    if (!modalElement || !modalElement.classList.contains('active')) return;
    modalElement.classList.remove('active');
    document.removeEventListener('keydown', handleModalKeydown);
    if (previouslyFocusedElement) previouslyFocusedElement.focus();
    activeModal = null;
    previouslyFocusedElement = null;
}
