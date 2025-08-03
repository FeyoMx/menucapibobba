// admin-script.js
console.log("Admin script loaded.");

// Importar funciones de Firebase directamente ya que admin-script.js ahora es un módulo
import { collection, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Variables Globales ---
let currentCategory = 'waterFrappes'; // Categoría activa por defecto
let editingProduct = null; // Almacena el producto que se está editando
let productsData = {}; // Objeto para almacenar todos los datos de productos por categoría
let db; // Instancia de Firestore
let menuId = 'menu-capibobba'; // ID fijo para el menú. Coincide con el del script público.
let userId; // ID del usuario autenticado
let appId; // ID de la aplicación para la ruta de Firestore

// --- Referencias del DOM ---
const categoryNav = document.querySelector('.category-nav');
const productsGrid = document.getElementById('productsGrid');
const addProductBtn = document.getElementById('addProductBtn');
const productModal = document.getElementById('productModal');
const modalTitle = document.getElementById('modalTitle');
const productForm = document.getElementById('productForm');
const cancelBtn = document.getElementById('cancelBtn');
const closeProductModalBtn = productModal.querySelector('.close-modal-button');
const confirmModal = document.getElementById('confirmModal');
const confirmCancelBtn = document.getElementById('confirmCancel');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const toast = document.getElementById('toast');
const productImageInput = document.getElementById('productImage');
const imagePreview = document.getElementById('imagePreview');
const categorySpecificFields = document.getElementById('categorySpecificFields');
const currentCategoryTitle = document.getElementById('currentCategoryTitle');
const exportDataBtn = document.getElementById('exportDataBtn');
const importDataBtn = document.getElementById('importDataBtn');
const importFileInput = document.getElementById('importFileInput');
const loadingMessage = productsGrid.querySelector('.loading-message');
let lazyLoadObserver; // Observer para lazy loading de imágenes

// Mapeo de categorías para obtener el 'type' correcto al GUARDAR productos
const categoryMap = {
    'waterFrappes': { title: 'Frappés Base Agua', type: 'waterFrappes' },
    'milkFrappes': { title: 'Frappés Base Leche', type: 'milkFrappes' },
    'hotDrinks': { title: 'Bebidas Calientes', type: 'hotDrinks' },
    'toppings': { title: 'Toppings', type: 'toppings' },
    'promotions': { title: 'Promociones', type: 'promotions' }
};

// NUEVO: Mapeo de tipos de producto de Firestore a las claves de productsData al LEER productos
// Esto es crucial para que los productos se asignen a la categoría correcta,
// especialmente para tipos que pueden haber sido guardados con nombres diferentes.
const firestoreProductTypeMap = {
    "water-based-frappe": "waterFrappes",
    "milk-based-frappe": "milkFrappes",
    "hot-drink": "hotDrinks",
    "chamoyada": "promotions", // Chamoyada se mapea a la categoría "promotions"
    "promotion": "promotions", // Otros elementos con tipo "promotion" (singular)
    "promotions": "promotions", // Mapeo para el tipo "promotions" (plural)
    "toppings": "toppings",

    // Asegurarse de que los tipos nuevos también se mapeen a sí mismos
    "waterFrappes": "waterFrappes",
    "milkFrappes": "milkFrappes",
    "hotDrinks": "hotDrinks",
    // "toppings" ya está arriba
    // "promotions" ya está arriba
};

// --- Funciones de Utilidad ---

/**
 * Muestra un mensaje de notificación (toast).
 * @param {string} message - El mensaje a mostrar.
 * @param {string} type - Tipo de mensaje ('success', 'error', 'info').
 */
function showToast(message, type) {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Muestra el modal de alerta personalizado.
 * @param {string} title - Título del modal.
 * @param {string} message - Mensaje del modal.
 */
// window.showCustomAlert ya está definido en admin.html para ser global

/**
 * Muestra u oculta el spinner de carga.
 * @param {boolean} show - True para mostrar, false para ocultar.
 */
function showLoading(show) {
    if (show) {
        productsGrid.classList.add('loading');
        loadingMessage.style.display = 'block';
    } else {
        productsGrid.classList.remove('loading');
        loadingMessage.style.display = 'none';
    }
}

// --- Lógica de Firebase (Inicializada desde admin.html) ---
// Hacemos initAdminPanel global para que el script de inicialización de Firebase en admin.html pueda llamarla
window.initAdminPanel = function(_db, _userId, _appId) {
    db = _db;
    userId = _userId;
    appId = _appId;
    console.log('Firebase y User ID inicializados en admin-script.js');

    // Cargar datos iniciales y configurar listeners de Firestore
    loadProductsAndSetupListeners();
};

/**
 * Carga los productos desde Firestore y configura los listeners en tiempo real.
 * Ahora escucha una única colección 'products' y filtra por tipo.
 */
async function loadProductsAndSetupListeners() {
    showLoading(true);
    const baseCollectionPath = `artifacts/${appId}/menus/${menuId}`;
    const productsCollectionRef = collection(db, `${baseCollectionPath}/products`);

    onSnapshot(productsCollectionRef, (snapshot) => {
        // Reiniciar todas las categorías
        productsData = {
            waterFrappes: [],
            milkFrappes: [],
            hotDrinks: [],
            toppings: [],
            promotions: []
        };

        snapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            // Usar el mapeo para asignar el producto a la categoría correcta
            const categoryKey = firestoreProductTypeMap[product.type];
            if (categoryKey && productsData.hasOwnProperty(categoryKey)) {
                productsData[categoryKey].push(product);
            } else {
                console.warn(`Producto con tipo desconocido en Firestore: ${product.type}`, product);
            }
        });

        console.log("Todos los datos de productos actualizados desde Firestore (Admin):", productsData);
        renderProducts(productsData[currentCategory] || []); // Renderizar la categoría actual
        showLoading(false);
    }, (error) => {
        console.error(`Error al escuchar la colección '${baseCollectionPath}/products' en Firestore (Admin):`, error);
        showToast(`Error al cargar productos: Permisos insuficientes.`, 'error');
        showLoading(false);
    });
}


/**
 * Renderiza los productos de la categoría actual en la cuadrícula.
 * @param {Array} products - Array de productos a renderizar.
 */
function renderProducts(products) {
    const template = document.getElementById('productCardTemplate');
    productsGrid.innerHTML = ''; // Limpiar la cuadrícula
    if (!products || products.length === 0) {
        productsGrid.innerHTML = `
            <div class="empty-state">
                <p>No hay productos en esta categoría.</p>
                <button class="admin-btn add-product" id="addFirstProductBtn">
                    ➕ Agregar primer producto
                </button>
            </div>
        `;
        // Añadir listener al botón "Agregar primer producto" si existe
        const addFirstProductBtn = document.getElementById('addFirstProductBtn');
        if (addFirstProductBtn) {
            addFirstProductBtn.addEventListener('click', () => openProductModal());
        }
        return;
    }

    products.forEach(product => {
        const cardFragment = template.content.cloneNode(true);
        const cardElement = cardFragment.querySelector('.product-card');

        // Si el producto está inactivo, añade una clase para el estilo visual
        if (product.isActive === false) {
            cardElement.classList.add('inactive');
        }

        // Determinar si mostrar el campo de imagen basado en la categoría
        const hasImage = !['toppings'].includes(currentCategory);
        const imageEl = cardElement.querySelector('.product-image');
        if (hasImage) {
            imageEl.dataset.src = product.imageUrl || 'https://placehold.co/100x100/ADD8E6/000000?text=No+Image';
            imageEl.alt = product.name;
        } else {
            imageEl.remove(); // Eliminar el elemento de imagen si no es necesario
        }

        // Poblar los datos del producto
        cardElement.dataset.id = product.id;
        cardElement.querySelector('.product-name').textContent = product.displayName || product.name;
        cardElement.querySelector('.product-description').textContent = product.description;
        cardElement.querySelector('.product-price').textContent = `$${product.price ? product.price.toFixed(2) : '0.00'}`;

        // Configurar el interruptor de estado
        const statusToggle = cardElement.querySelector('.status-toggle');
        statusToggle.checked = product.isActive !== false; // Activo por defecto si no está definido

        // Asignar los IDs a los botones para los event listeners
        cardElement.querySelector('.edit-btn').dataset.id = product.id;
        cardElement.querySelector('.delete-btn').dataset.id = product.id;

        productsGrid.appendChild(cardElement);
    });

    // Observar las nuevas imágenes para lazy loading
    productsGrid.querySelectorAll('.lazy-load').forEach(img => lazyLoadObserver.observe(img));
}

/**
 * Cambia el estado de activación de un producto en Firestore.
 * @param {string} productId - El ID del producto a actualizar.
 * @param {boolean} isActive - El nuevo estado de activación.
 */
async function toggleProductStatus(productId, isActive) {
    const docRef = doc(db, `artifacts/${appId}/menus/${menuId}/products`, productId);
    try {
        await updateDoc(docRef, {
            isActive: isActive
        });
        showToast(`Producto ${isActive ? 'activado' : 'desactivado'}`, 'success');
    } catch (error) {
        console.error("Error al actualizar el estado del producto:", error);
        showToast('Error al cambiar el estado', 'error');
    }
}

// --- Manejo de Eventos con Delegación ---
productsGrid.addEventListener('click', (event) => {
    const editBtn = event.target.closest('.edit-btn');
    if (editBtn) {
        openEditProductModal(event);
        return;
    }

    const deleteBtn = event.target.closest('.delete-btn');
    if (deleteBtn) {
        openConfirmDeleteModal(event);
        return;
    }
});

productsGrid.addEventListener('change', (event) => {
    const statusToggle = event.target.closest('.status-toggle');
    if (statusToggle) {
        // Encontrar el ID del producto desde el elemento padre de la tarjeta
        const card = statusToggle.closest('.product-card');
        if (card && card.dataset.id) {
            const productId = card.dataset.id;
            toggleProductStatus(productId, statusToggle.checked);
        } else {
            console.error("No se pudo encontrar el ID del producto para el interruptor de estado.");
        }
    }
});


// --- Manejo de la Navegación de Categorías ---
categoryNav.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') {
        // Remover clase 'active' de todos los botones
        categoryNav.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        // Añadir clase 'active' al botón clickeado
        event.target.classList.add('active');

        currentCategory = event.target.dataset.category;
        updateCategoryTitle(currentCategory);
        renderProducts(productsData[currentCategory] || []); // Renderizar productos de la nueva categoría
        updateCategorySpecificFields(); // Actualizar campos específicos si los hubiera
    }
});

/**
 * Actualiza el título de la sección de productos.
 * @param {string} categoryKey - La clave de la categoría.
 */
function updateCategoryTitle(categoryKey) {
    currentCategoryTitle.textContent = categoryMap[categoryKey].title || 'Productos';
}

/**
 * Actualiza los campos específicos del formulario según la categoría.
 * Esto es un placeholder; la lógica real se añadiría aquí.
 * Ahora incluye la lógica para personalizar Chamoyadas.
 */
function updateCategorySpecificFields() {
    const imageGroup = document.getElementById('productImage').closest('.form-group');
    const specificFields = document.getElementById('categorySpecificFields');
    specificFields.innerHTML = ''; // Limpiar campos previos

    if (currentCategory === 'toppings') {
        imageGroup.style.display = 'none'; // Ocultar campo de imagen para toppings
    } else {
        imageGroup.style.display = 'flex'; // Mostrar campo de imagen para otras categorías
    }

    // Lógica específica para productos personalizables (Chamoyada, Yogurtada) en la categoría de Promociones
    const isCustomizablePromo = currentCategory === 'promotions' &&
                                editingProduct &&
                                (editingProduct.name.toLowerCase().includes('chamoyada') || editingProduct.name.toLowerCase().includes('yogurtada'));

    if (isCustomizablePromo) {
        const productName = editingProduct.name.toLowerCase().includes('chamoyada') ? 'esta Chamoyada' : 'esta Yogurtada';

        // --- Selector de Toppings Permitidos ---
        const toppingsContainer = document.createElement('div');
        toppingsContainer.className = 'form-group';
        const toppingsLabel = document.createElement('label');
        toppingsLabel.textContent = `Toppings Permitidos para ${productName}:`;
        toppingsContainer.appendChild(toppingsLabel);

        const allToppings = productsData.toppings || [];
        const savedToppings = editingProduct.toppings || []; // Array de nombres de toppings

        if (allToppings.length > 0) {
            allToppings.forEach(topping => {
                const isChecked = savedToppings.includes(topping.name);
                const toppingId = `promo-topping-check-${topping.id}`;
                const checkboxWrapper = document.createElement('div');
                // Usar un nombre genérico para los checkboxes
                checkboxWrapper.innerHTML = `
                    <input type="checkbox" id="${toppingId}" name="allowedTopping" value="${topping.name}" ${isChecked ? 'checked' : ''}>
                    <label for="${toppingId}">${topping.displayName || topping.name}</label>
                `;
                toppingsContainer.appendChild(checkboxWrapper);
            });
        } else {
            toppingsContainer.innerHTML += '<p>No hay toppings creados. Añade toppings en su categoría primero.</p>';
        }
        specificFields.appendChild(toppingsContainer);
    }
}

// --- Manejo del Modal de Producto (Añadir/Editar) ---
addProductBtn.addEventListener('click', () => {
    editingProduct = null;
    modalTitle.textContent = 'Añadir Nuevo Producto';
    productForm.reset(); // Limpiar el formulario
    imagePreview.innerHTML = ''; // Limpiar la vista previa de la imagen
    window.openModal(productModal);
    updateCategorySpecificFields(); // Asegurarse de que los campos específicos estén correctos
});

closeProductModalBtn.addEventListener('click', () => {
    window.closeModal(productModal);
});

cancelBtn.addEventListener('click', () => {
    window.closeModal(productModal);
});

productImageInput.addEventListener('input', () => {
    const imageUrl = productImageInput.value;
    if (imageUrl) {
        imagePreview.innerHTML = `<img src="${imageUrl}" alt="Vista previa" class="preview-image" onerror="this.onerror=null;this.src='https://placehold.co/100x100/ADD8E6/000000?text=Error';">`;
    } else {
        imagePreview.innerHTML = '';
    }
});

/**
 * Abre el modal para editar un producto existente.
 * @param {Event} event - El evento de click.
 */
function openEditProductModal(event) {
    const productId = event.target.dataset.id;
    // Buscar el producto en la categoría actual de productsData
    editingProduct = productsData[currentCategory].find(p => p.id === productId);

    if (editingProduct) {
        modalTitle.textContent = 'Editar Producto';
        document.getElementById('productName').value = editingProduct.name || '';
        document.getElementById('productDisplayName').value = editingProduct.displayName || '';
        document.getElementById('productDescription').value = editingProduct.description || '';
        document.getElementById('productPrice').value = editingProduct.price || '';
        document.getElementById('productImage').value = editingProduct.imageUrl || ''; // Usar imageUrl
        document.getElementById('productIsActive').checked = editingProduct.isActive !== false; // Activo por defecto
        updateImagePreview(); // Actualizar la vista previa de la imagen

        // Cargar campos específicos si los hubiera
        updateCategorySpecificFields(); // Esto también maneja la visibilidad del campo de imagen

        window.openModal(productModal);
    } else {
        showToast('Producto no encontrado para editar.', 'error');
    }
}

/**
 * Actualiza la vista previa de la imagen en el modal de producto.
 */
function updateImagePreview() {
    const imageUrl = document.getElementById('productImage').value;
    if (imageUrl) {
        imagePreview.innerHTML = `<img src="${imageUrl}" alt="Vista previa" class="preview-image" onerror="this.onerror=null;this.src='https://placehold.co/100x100/ADD8E6/000000?text=Error';">`;
    } else {
        imagePreview.innerHTML = '';
    }
}


/**
 * Maneja el envío del formulario para añadir o actualizar un producto en Firestore.
 * @param {Event} event - El evento de envío del formulario.
 */
productForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showLoading(true);

    const product = {
        name: document.getElementById('productName').value.trim(),
        displayName: document.getElementById('productDisplayName').value.trim() || document.getElementById('productName').value.trim(),
        description: document.getElementById('productDescription').value.trim(),
        price: parseFloat(document.getElementById('productPrice').value),
        imageUrl: document.getElementById('productImage').value.trim() || '', // Usar imageUrl
        type: categoryMap[currentCategory].type, // Asignar el tipo de categoría (el nuevo nombre)
        isActive: document.getElementById('productIsActive').checked
    };

    // Añadir datos específicos de productos personalizables (Chamoyada, Yogurtada) si aplica
    const isCustomizablePromo = product.type === 'promotions' &&
                                (product.name.toLowerCase().includes('chamoyada') || product.name.toLowerCase().includes('yogurtada'));

    if (isCustomizablePromo) {
        // Guardar la lista de nombres de toppings permitidos
        const selectedToppings = Array.from(document.querySelectorAll('input[name="allowedTopping"]:checked'))
                                      .map(cb => cb.value);
        product.toppings = selectedToppings;
    }


    // Validaciones
    if (!product.name) {
        showToast('El nombre del producto es requerido', 'error');
        showLoading(false);
        return;
    }

    if (isNaN(product.price) || product.price < 0) {
        showToast('El precio debe ser un número válido', 'error');
        showLoading(false);
        return;
    }

    try {
        const productsCollectionRef = collection(db, `artifacts/${appId}/menus/${menuId}/products`);
        if (editingProduct) {
            // Actualizar producto existente
            const docRef = doc(db, `artifacts/${appId}/menus/${menuId}/products`, editingProduct.id);
            await updateDoc(docRef, product);
            showToast('Producto actualizado exitosamente', 'success');
        } else {
            // Añadir nuevo producto
            await addDoc(productsCollectionRef, product);
            showToast('Producto añadido exitosamente', 'success');
        }
        window.closeModal(productModal);
    } catch (error) {
        console.error('Error al guardar el producto:', error);
        showToast('Error al guardar el producto', 'error');
    } finally {
        showLoading(false);
    }
});

// --- Manejo del Modal de Confirmación de Eliminación ---
let productToDeleteId = null; // Almacena el ID del producto a eliminar

/**
 * Abre el modal de confirmación para eliminar un producto.
 * @param {Event} event - El evento de click.
 */
function openConfirmDeleteModal(event) {
    productToDeleteId = event.target.dataset.id;
    const product = productsData[currentCategory].find(p => p.id === productToDeleteId);
    if (product) {
        document.getElementById('confirmMessage').textContent = `¿Estás seguro de que quieres eliminar "${product.displayName || product.name}"?`;
        window.openModal(confirmModal);
    } else {
        showToast('Producto no encontrado para eliminar.', 'error');
    }
}

confirmCancelBtn.addEventListener('click', () => {
    window.closeModal(confirmModal);
    productToDeleteId = null;
});

/**
 * Elimina un producto de Firestore.
 */
confirmDeleteBtn.addEventListener('click', async () => {
    if (!productToDeleteId) return;

    showLoading(true);
    try {
        const docRef = doc(db, `artifacts/${appId}/menus/${menuId}/products`, productToDeleteId);
        await deleteDoc(docRef);
        showToast('Producto eliminado exitosamente', 'success');
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        showToast('Error al eliminar el producto', 'error');
    } finally {
        window.closeModal(confirmModal);
        productToDeleteId = null;
        showLoading(false);
    }
});

// --- Funcionalidad de Exportar/Importar (Local, como respaldo) ---
// Estas funciones seguirán usando localStorage y JSON para exportar/importar un snapshot local de los datos.
// No interactuarán con Firestore directamente.

exportDataBtn.addEventListener('click', () => {
    // Convertir productsData de objeto a un formato plano para exportar
    const dataToExport = {};
    for (const category in productsData) {
        dataToExport[category] = productsData[category].map(({ id, ...rest }) => rest); // Eliminar el ID de Firestore
    }
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'capibobba_menu_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Datos exportados exitosamente', 'success');
});

importDataBtn.addEventListener('click', () => {
    importFileInput.click();
});

importFileInput.addEventListener('change', handleImportFile);

/**
 * Muestra un modal de confirmación antes de ejecutar la importación destructiva.
 * @param {object} importedData - Los datos del archivo JSON listos para ser importados.
 */
function showImportConfirmation(importedData) {
    const confirmTitle = document.getElementById('confirmModalTitle');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmActionBtn = document.getElementById('confirmDelete'); // Reutilizamos el botón de acción
    const cancelBtn = document.getElementById('confirmCancel');

    // Guardar el estado original del botón para restaurarlo después
    const originalBtnText = confirmActionBtn.innerHTML;
    const originalBtnClasses = confirmActionBtn.className;

    // Personalizar el modal para la confirmación de importación
    confirmTitle.textContent = '¿Confirmar Importación?';
    confirmMessage.innerHTML = '<strong>¡Atención!</strong> Estás a punto de <strong>borrar todo el menú actual</strong> y reemplazarlo con los datos del archivo. <br><br>Esta acción no se puede deshacer. ¿Estás seguro?';
    confirmActionBtn.innerHTML = '✔️ Sí, Importar';
    confirmActionBtn.className = 'admin-btn import'; // Aplicar estilo de importación

    const restoreButton = () => {
        confirmActionBtn.innerHTML = originalBtnText;
        confirmActionBtn.className = originalBtnClasses;
    };

    const onConfirm = async () => {
        restoreButton();
        confirmActionBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', onCancel);
        await performImport(importedData);
    };

    const onCancel = () => {
        restoreButton();
        confirmActionBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', onCancel);
        window.closeModal(confirmModal);
    };

    confirmActionBtn.addEventListener('click', onConfirm, { once: true });
    cancelBtn.addEventListener('click', onCancel, { once: true });

    window.openModal(confirmModal);
}

/**
 * Realiza la importación de datos a Firestore después de la confirmación del usuario.
 * @param {object} importedData - Los datos a importar.
 */
async function performImport(importedData) {
    window.closeModal(confirmModal);
    await importDataToFirestore(importedData);
}

/**
 * Lógica central para borrar los datos existentes y añadir los nuevos.
 * @param {object} importedData - Los datos a importar.
 */
async function importDataToFirestore(importedData) {
    showLoading(true);
    try {
        const productsCollectionRef = collection(db, `artifacts/${appId}/menus/${menuId}/products`);

        // 1. Eliminar todos los documentos existentes
        const existingDocs = await getDocs(productsCollectionRef);
        const deletePromises = existingDocs.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // 2. Añadir los nuevos documentos
        const addPromises = [];
        for (const categoryKey in importedData) {
            if (importedData.hasOwnProperty(categoryKey)) {
                const productsInCategory = importedData[categoryKey];
                productsInCategory.forEach(product => {
                    const productWithType = { ...product, type: categoryKey };
                    addPromises.push(addDoc(productsCollectionRef, productWithType));
                });
            }
        }
        await Promise.all(addPromises);

        showToast('Datos importados exitosamente a Firestore', 'success');
    } catch (error) {
        console.error('Error durante la importación a Firestore:', error);
        window.showCustomAlert('Error de Importación', 'Ocurrió un error durante la importación a Firestore.');
    } finally {
        showLoading(false);
    }
}

/**
 * Maneja la importación de un archivo JSON.
 * @param {Event} event - El evento de cambio del input de archivo.
 */
function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            if (validateDataStructure(importedData)) {
                showImportConfirmation(importedData); // Mostrar confirmación en lugar de importar directamente
            } else {
                window.showCustomAlert('Error de Importación', 'Formato de archivo JSON inválido. Asegúrate de que contenga las categorías correctas (waterFrappes, milkFrappes, etc.).');
            }
        } catch (error) {
            console.error('Error al leer o importar el archivo:', error);
            window.showCustomAlert('Error de Importación', 'Error al leer o procesar el archivo. Asegúrate de que sea un JSON válido.');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Limpiar el input para permitir importar el mismo archivo de nuevo
}

/**
 * Valida la estructura de los datos importados.
 * @param {Object} data - Los datos a validar.
 * @returns {boolean} - True si la estructura es válida, false en caso contrario.
 */
function validateDataStructure(data) {
    const requiredKeys = ['waterFrappes', 'milkFrappes', 'hotDrinks', 'toppings', 'promotions'];
    if (typeof data !== 'object' || data === null) return false;
    for (const key of requiredKeys) {
        if (!Array.isArray(data[key])) return false;
    }
    return true;
}

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

// Inicializar la vista al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    updateCategoryTitle(currentCategory);
    updateCategorySpecificFields();
    initializeLazyLoader();
    // La función de inicialización de Firebase será llamada por el script de tipo módulo en admin.html
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
