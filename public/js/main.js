document.addEventListener('DOMContentLoaded', function () {
    window.scrollTo(0, 0); // Прокручиваем страницу в самый верх при загрузке
    const cartItemsContainer = document.querySelector('.cart-items');
    const orderForm = document.getElementById('order-form');
    const deliveryFields = document.querySelectorAll('.delivery-fields');
    const deliveryInfo = document.getElementById('delivery-info');
    const totalPriceElement = document.getElementById('total-price');
    const summaryName = document.getElementById('summary-name');
    const summaryPhone = document.getElementById('summary-phone');
    const summaryAddress = document.getElementById('summary-address');
    const summaryComment = document.getElementById('summary-comment');
    const menuCheckbox = document.getElementById('menu-checkbox');
    const navLinks = document.querySelector('.nav-links');
    const body = document.querySelector('body');
    const checkoutButtons = document.querySelectorAll('.checkout-button');
    const orderButton = document.querySelector('.order-button');
    const mobileCartButton = document.querySelector('.mobile-cart-button');
    const mobileCartModal = document.querySelector('.mobile-cart-modal');
    const mobileCartModalClose = document.querySelector('.mobile-cart-modal-close');
    const mobileTotalPrice = document.getElementById('mobile-total-price');
    const productModal = document.querySelector('.product-modal');
    const productModalClose = document.querySelector('.product-modal-close');
    const footer = document.querySelector('.footer');
    const mobileCategories = document.querySelector('.mobile-categories');
    const mobileCartItems = document.querySelector('.mobile-cart-modal .cart-items');
    const topBar = document.querySelector('.top-bar');

    let items = JSON.parse(localStorage.getItem('cartItems')) || [];
    let totalPrice = 0;
    let lastScrollTop = 0;
    let scrollUpDistance = 0;
    const scrollUpThreshold = 50;

    // Состояние для отслеживания открытых окон
    let isProductModalOpen = false;
    let isMobileCartModalOpen = false;
    let isMenuOpen = false;

    // Устанавливаем начальный режим доставки
    if (!localStorage.getItem('deliveryType')) {
        localStorage.setItem('deliveryType', 'delivery');
    }

    // Функции управления прокруткой
    function disableScroll() {
        body.style.overflow = 'hidden';
    }

    function enableScroll() {
        // Включаем прокрутку только если ничего не открыто
        if (!isProductModalOpen && !isMobileCartModalOpen && !isMenuOpen) {
            body.style.overflow = 'auto';
        }
    }

    // Модальное окно успешного заказа
    const orderSuccessModal = document.createElement('div');
    orderSuccessModal.classList.add('order-success-modal');
    orderSuccessModal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    orderSuccessModal.innerHTML = `
        <div style="background-color: white; padding: 20px; border-radius: 10px; text-align: center; max-width: 500px;">
            <h2>Заказ успешно оформлен</h2>
            <p>Ваш заказ передан оператору. Вам позвонят для уточнения заказа в течение 5 минут. Если этого не произошло, повторно произведите заказ или позвоните по номеру <strong>+7(958)655-94-00</strong> для заказа по телефону.</p>
            <button id="close-success-modal" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Перейти на главную</button>
        </div>
    `;
    document.body.appendChild(orderSuccessModal);

    const closeSuccessModal = document.getElementById('close-success-modal');
    if (closeSuccessModal) {
        closeSuccessModal.addEventListener('click', () => {
            orderSuccessModal.style.display = 'none';
            window.location.href = 'index.html';
        });
    }

    if (orderSuccessModal) {
        orderSuccessModal.addEventListener('click', (e) => {
            if (e.target === orderSuccessModal) {
                orderSuccessModal.style.display = 'none';
                window.location.href = 'index.html';
            }
        });
    }

    const isOperatorPage = window.location.pathname.includes('operator');

    if (navLinks && !isOperatorPage) {
        if (window.innerWidth >= 780) {
            navLinks.style.opacity = '1';
            navLinks.style.transform = 'translateY(0)';
            navLinks.classList.remove('active');
        }
    }

    // Обработка бургер-меню
    if (menuCheckbox && navLinks && !isOperatorPage) {
        menuCheckbox.addEventListener('change', function () {
            if (this.checked) {
                navLinks.classList.add('active');
                body.classList.add('menu-open');
                isMenuOpen = true;
                disableScroll();
            } else {
                navLinks.classList.remove('active');
                body.classList.remove('menu-open');
                isMenuOpen = false;
                enableScroll();
            }
        });

        document.addEventListener('click', function (e) {
            if (!document.getElementById('menu-btn-container').contains(e.target) && 
                !navLinks.contains(e.target)) {
                menuCheckbox.checked = false;
                navLinks.classList.remove('active');
                body.classList.remove('menu-open');
                isMenuOpen = false;
                enableScroll();
            }
        });

        document.addEventListener('touchstart', function (e) {
            if (menuCheckbox.checked && !navLinks.contains(e.target) && 
                !document.getElementById('menu-btn-container').contains(e.target)) {
                menuCheckbox.checked = false;
                navLinks.classList.remove('active');
                body.classList.remove('menu-open');
                isMenuOpen = false;
                enableScroll();
            }
        });

        function adjustNavPosition() {
            if (window.innerWidth <= 339) {
                const topBarHeight = document.querySelector('.top-bar').offsetHeight;
                navLinks.style.top = `${topBarHeight}px`;
            } else if (window.innerWidth <= 780) {
                navLinks.style.top = '60px';
            }
        }

        window.addEventListener('resize', adjustNavPosition);
        adjustNavPosition();
    }

    // Обработка мобильной кнопки корзины
    if (mobileCartButton && mobileCartModal) {
        mobileCartButton.addEventListener('click', function () {
            mobileCartModal.classList.add('active');
            mobileCartButton.style.display = 'none';
            updateMobileCart();
            isMobileCartModalOpen = true;
            disableScroll();
        });
    }

    if (mobileCartModalClose) {
        mobileCartModalClose.addEventListener('click', function () {
            mobileCartModal.classList.remove('active');
            if (window.innerWidth <= 1200) {
                mobileCartButton.style.display = 'block';
            }
            isMobileCartModalOpen = false;
            enableScroll();
        });
    }

    if (mobileCartModal) {
        mobileCartModal.addEventListener('click', function (e) {
            if (e.target === mobileCartModal) {
                mobileCartModal.classList.remove('active');
                if (window.innerWidth <= 1200) {
                    mobileCartButton.style.display = 'block';
                }
                isMobileCartModalOpen = false;
                enableScroll();
            }
        });
    }

    // Закрытие модального окна товара
    if (productModalClose) {
        productModalClose.addEventListener('click', function () {
            productModal.classList.remove('active');
            if (footer) footer.style.display = 'block';
            if (window.innerWidth <= 1200 && mobileCartButton) {
                mobileCartButton.style.display = 'block';
            }
            isProductModalOpen = false;
            enableScroll();
        });
    }

    if (productModal) {
        productModal.addEventListener('click', function (e) {
            if (e.target === productModal) {
                productModal.classList.remove('active');
                if (footer) footer.style.display = 'block';
                if (window.innerWidth <= 1200 && mobileCartButton) {
                    mobileCartButton.style.display = 'block';
                }
                isProductModalOpen = false;
                enableScroll();
            }
        });
    }

    // Обработка кнопок "Перейти к оформлению"
    checkoutButtons.forEach(button => {
        button.addEventListener('click', function () {
            window.location.href = 'cart.html';
        });
    });

    // Функция для добавления товара в корзину
    function addToCart(productName, productImage, productPrice, productQuantity) {
        const existingItem = items.find(item => item.name === productName);

        if (existingItem) {
            existingItem.quantity += productQuantity;
        } else {
            items.push({
                name: productName,
                image: productImage,
                price: Math.round(productPrice),
                quantity: productQuantity
            });
        }

        updateCart();
        saveCartToLocalStorage();
        updateMobileCart();
    }

    // Функция обновления корзины (десктоп)
    function updateCart() {
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = '';
            totalPrice = 0;

            if (items.length === 0) {
                cartItemsContainer.innerHTML = '<div>Корзина пуста</div>';
            } else {
                items.forEach(item => {
                    const cartItem = document.createElement('div');
                    cartItem.classList.add('cart-item');
                    cartItem.innerHTML = `
                        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                        <div class="cart-item-info">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-quantity">
                                <button class="quantity-minus">-</button>
                                <input type="number" class="quantity-input" value="${item.quantity}" min="1">
                                <button class="quantity-plus">+</button>
                            </div>
                            <div class="cart-item-price">${Math.round(item.price * item.quantity)} ₽</div>
                        </div>
                        <button class="remove-item-btn">
                            <img src="фото/trashcan_106521.png" alt="Удалить" class="remove-icon">
                        </button>
                    `;
                    cartItemsContainer.appendChild(cartItem);
                    totalPrice += item.price * item.quantity;
                });
            }

            if (totalPriceElement) {
                const deliveryType = localStorage.getItem('deliveryType');
                let totalText = `${Math.round(totalPrice)} ₽`;

                if (deliveryType === 'delivery') {
                    if (totalPrice < 1500) {
                        totalText += ' (бесплатная доставка от 1500, оператор уточнит стоимость доставки при подтверждении заказа)';
                    } else {
                        totalText += ' (доставка бесплатная)';
                    }
                }

                totalPriceElement.textContent = totalText;
            }

            checkoutButtons.forEach(button => {
                button.textContent = `Перейти к оформлению (${Math.round(totalPrice)} ₽)`;
            });

            if (mobileTotalPrice) {
                mobileTotalPrice.textContent = Math.round(totalPrice);
            }

            if (mobileCartButton) {
                if (window.innerWidth <= 1200) {
                    mobileCartButton.style.display = 'block';
                } else {
                    mobileCartButton.style.display = 'none';
                }
            }
        }
    }

    // Функция обновления мобильной корзины
    function updateMobileCart() {
        if (mobileCartItems) {
            mobileCartItems.innerHTML = '';
            totalPrice = 0;

            if (items.length === 0) {
                mobileCartItems.innerHTML = '<div>Корзина пуста</div>';
            } else {
                items.forEach(item => {
                    const cartItem = document.createElement('div');
                    cartItem.classList.add('cart-item');
                    cartItem.innerHTML = `
                        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                        <div class="cart-item-info">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-quantity">
                                <button class="quantity-minus">-</button>
                                <input type="number" class="quantity-input" value="${item.quantity}" min="1">
                                <button class="quantity-plus">+</button>
                            </div>
                            <div class="cart-item-price">${Math.round(item.price * item.quantity)} ₽</div>
                        </div>
                        <button class="remove-item-btn">
                            <img src="фото/trashcan_106521.png" alt="Удалить" class="remove-icon">
                        </button>
                    `;
                    mobileCartItems.appendChild(cartItem);
                    totalPrice += item.price * item.quantity;
                });
            }

            if (mobileTotalPrice) {
                mobileTotalPrice.textContent = Math.round(totalPrice);
            }

            if (mobileCartButton) {
                if (window.innerWidth <= 1200) {
                    mobileCartButton.style.display = 'block';
                } else {
                    mobileCartButton.style.display = 'none';
                }
            }
        }
    }

    // Функция сохранения корзины в localStorage
    function saveCartToLocalStorage() {
        try {
            localStorage.setItem('cartItems', JSON.stringify(items));
        } catch (error) {
            console.error('Ошибка сохранения корзины:', error);
        }
    }

    // Функция для обновления видимости полей доставки
    function updateDeliveryFields() {
        if (window.location.pathname.includes('cart.html')) {
            const deliveryType = localStorage.getItem('deliveryType');
            const isDelivery = deliveryType === 'delivery';

            if (deliveryFields.length > 0) {
                deliveryFields.forEach(field => {
                    field.style.display = isDelivery ? 'block' : 'none';
                });
            }

            if (deliveryInfo) {
                deliveryInfo.textContent = isDelivery ? 'Доставка' : 'Самовывоз';
            }

            if (summaryAddress) {
                summaryAddress.textContent = isDelivery ? 'Адрес доставки будет указан' : 'г. Орел, ул. Карачевская, д. 58';
            }
        }
    }

    // Обработка ввода в форме заказа
    if (orderForm && window.location.pathname.includes('cart.html')) {
        orderForm.addEventListener('input', function (e) {
            const formData = new FormData(orderForm);

            if (summaryName) summaryName.textContent = formData.get('name') || '';
            if (summaryPhone) summaryPhone.textContent = formData.get('phone') || '';

            const deliveryType = localStorage.getItem('deliveryType');
            if (deliveryType === 'delivery') {
                if (summaryAddress) {
                    summaryAddress.textContent = `${formData.get('street') || ''}, ${formData.get('house') || ''}, кв. ${formData.get('apartment') || ''}, ${formData.get('floor') || ''} этаж, подъезд ${formData.get('entrance') || ''}`;
                }
                if (summaryComment) summaryComment.textContent = formData.get('comment') || '';
            } else {
                if (summaryAddress) summaryAddress.textContent = 'г. Орел, ул. Карачевская, д. 58';
                if (summaryComment) summaryComment.textContent = '';
            }
        });
    }

    // Валидация номера телефона
    function validatePhoneNumber(phone) {
        const cleanedPhone = phone.replace(/\D/g, '');
        return (cleanedPhone.startsWith('8') || cleanedPhone.startsWith('7')) && cleanedPhone.length === 11;
    }

    // Валидация формы заказа
    function validateOrderForm(formData, deliveryType) {
        const phone = formData.get('phone');
        const street = formData.get('street');
        const house = formData.get('house');

        if (!validatePhoneNumber(phone)) {
            alert('Номер телефона должен быть в формате +7XXXXXXXXXX или 8XXXXXXXXXX.');
            return false;
        }

        if (deliveryType === 'delivery') {
            if (!street || !house) {
                alert('Пожалуйста, заполните улицу и дом.');
                return false;
            }
        }

        if (items.length === 0) {
            alert('Корзина пуста. Добавьте хотя бы один товар.');
            return false;
        }

        return true;
    }

    // Обработка переключателей доставки/самовывоза
    document.querySelectorAll('.toggle input[type="checkbox"]').forEach(toggle => {
        toggle.addEventListener('change', function () {
            const deliveryType = this.checked ? 'delivery' : 'pickup';
            localStorage.setItem('deliveryType', deliveryType);

            document.querySelectorAll('.toggle input[type="checkbox"]').forEach(otherToggle => {
                if (otherToggle !== toggle) {
                    otherToggle.checked = this.checked;
                }
            });

            updateDeliveryFields();
            updateCart();
        });
    });

    const deliveryType = localStorage.getItem('deliveryType');
    document.querySelectorAll('.toggle input[type="checkbox"]').forEach(toggle => {
        toggle.checked = deliveryType === 'delivery';
    });
    updateDeliveryFields();

    // Функция для загрузки товаров
    function loadProducts() {
        fetch('/api/products')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка загрузки товаров');
                }
                return response.json();
            })
            .then(products => {
                const categorySections = document.querySelector('.category-sections');
                if (categorySections) {
                    categorySections.innerHTML = '';
                    const categories = {};
                    products.forEach(product => {
                        if (!categories[product.category]) {
                            categories[product.category] = [];
                        }
                        categories[product.category].push(product);
                    });
    
                    const categoryOrder = [
                        'shashlyk', 'shaurma', 'garnir', 'bread', 'sauces', 'salads', 'hinkali', 'burgers', 'desserts'
                    ];
    
                    categoryOrder.forEach(categoryId => {
                        if (categories[categoryId]) {
                            const categorySection = document.createElement('div');
                            categorySection.classList.add('category-section');
                            categorySection.id = `category-${categoryId}`;
    
                            const categoryTitle = document.createElement('h2');
                            categoryTitle.classList.add('category-title');
                            const categoryName = getCategoryName(categoryId);
                            categoryTitle.textContent = categoryName;
                            categorySection.appendChild(categoryTitle);
    
                            const productGrid = document.createElement('div');
                            productGrid.classList.add('product-grid');
    
                            categories[categoryId].forEach(product => {
                                const productCard = document.createElement('div');
                                productCard.classList.add('product-card');
                                if (!product.inStock) {
                                    productCard.classList.add('out-of-stock');
                                }
                                productCard.setAttribute('data-product-id', product.id);
                                productCard.setAttribute('data-description', product.description);
                                productCard.setAttribute('data-weight', product.weight);
                                productCard.setAttribute('data-composition', product.composition);
                                productCard.setAttribute('data-calories', product.calories);
                                productCard.setAttribute('data-protein', product.protein);
                                productCard.setAttribute('data-fat', product.fat);
                                productCard.setAttribute('data-carbs', product.carbs);
                                productCard.setAttribute('data-in-stock', product.inStock);
                                productCard.innerHTML = `
                                    <img src="${product.image}" alt="${product.name}">
                                    <div class="product-info">
                                        <div class="product-name">${product.name}</div>
                                        <div class="product-price">${Math.round(product.price)} ₽</div>
                                    </div>
                                    ${product.inStock ? '<button class="add-to-cart-btn">+</button>' : ''}
                                `;
                                productGrid.appendChild(productCard);
                            });
    
                            categorySection.appendChild(productGrid);
                            categorySections.appendChild(categorySection);
                        }
                    });
    
                    bindAddToCartButtons();
                    bindProductCardClicks();
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки товаров:', error);
                alert('Не удалось загрузить товары. Пожалуйста, попробуйте позже.');
            });
    }

    function getCategoryName(categoryId) {
        const categoryNames = {
            'shashlyk': 'Шашлык',
            'shaurma': 'Шаурма',
            'manty': 'Манты',
            'garnir': 'Гарнир',
            'bread': 'Хлеб',
            'sauces': 'Соусы',
            'salads': 'Салаты',
            'hinkali': 'Хинкали',
            'burgers': 'Бургеры',
            'desserts': 'Десерты'
        };
        return categoryNames[categoryId] || categoryId;
    }

    function bindAddToCartButtons() {
        document.querySelectorAll('.product-card .add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                openProductModal(button.closest('.product-card'));
            });
        });
    }

    function bindProductCardClicks() {
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                openProductModal(card);
            });
        });
    }

    function openProductModal(card) {
        const productId = card.getAttribute('data-product-id');
        const productDescription = card.getAttribute('data-description');
        const productWeight = card.getAttribute('data-weight');
        const productComposition = card.getAttribute('data-composition');
        const productCalories = card.getAttribute('data-calories');
        const productProtein = card.getAttribute('data-protein');
        const productFat = card.getAttribute('data-fat');
        const productCarbs = card.getAttribute('data-carbs');
        const inStock = card.getAttribute('data-in-stock') === '1';
        const modal = document.querySelector('.product-modal');
        const modalImg = modal.querySelector('.product-modal-image img');
        const modalName = modal.querySelector('.product-modal-name');
        const modalWeight = modal.querySelector('.product-modal-weight');
        const modalDescription = modal.querySelector('.product-modal-description');
        const modalComposition = modal.querySelector('.product-modal-composition');
        const modalNutritionTable = modal.querySelector('.nutrition-table');
        const modalQuantityInput = modal.querySelector('.quantity-input');
        const modalAddButton = modal.querySelector('.product-modal-add');

        if (modalImg) modalImg.src = card.querySelector('img').src;
        if (modalName) modalName.textContent = card.querySelector('.product-name').textContent;
        if (modalWeight) modalWeight.textContent = productWeight;
        if (modalDescription) modalDescription.textContent = productDescription;
        if (modalComposition) modalComposition.textContent = productComposition;
        if (modalNutritionTable) {
            modalNutritionTable.innerHTML = `
                <div class="nutrition-cell">
                    <span>ккал</span>
                    <span>${productCalories}</span>
                </div>
                <div class="nutrition-cell">
                    <span>белки</span>
                    <span>${productProtein}г</span>
                </div>
                <div class="nutrition-cell">
                    <span>жиры</span>
                    <span>${productFat}г</span>
                </div>
                <div class="nutrition-cell">
                    <span>углеводы</span>
                    <span>${productCarbs}г</span>
                </div>
            `;
        }
        if (modalQuantityInput) modalQuantityInput.value = 1;
        if (modalAddButton) modalAddButton.disabled = !inStock;
        modal.setAttribute('data-product-id', productId);

        modal.classList.add('active');
        if (footer) footer.style.display = 'none';
        if (window.innerWidth <= 1200 && mobileCartButton) {
            mobileCartButton.style.display = 'none';
        }
        isProductModalOpen = true;
        disableScroll();
    }

    const addButton = document.querySelector('.product-modal-add');
    if (addButton) {
        addButton.addEventListener('click', function () {
            if (this.disabled) return;

            const productName = document.querySelector('.product-modal-name').textContent;
            const productImage = document.querySelector('.product-modal-image img').src;
            const productQuantityInput = document.querySelector('.product-modal .quantity-input');
            const productQuantity = parseInt(productQuantityInput.value);

            if (productQuantity < 1) {
                alert('Количество товара должно быть не менее 1.');
                return;
            }

            const productId = document.querySelector('.product-modal').getAttribute('data-product-id');
            const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
            if (!productCard) {
                console.error('Карточка товара не найдена');
                return;
            }

            const productPriceText = productCard.querySelector('.product-price').textContent.trim();
            const productPrice = parseFloat(productPriceText.replace(' ₽', ''));

            if (isNaN(productPrice)) {
                console.error('Цена товара не является числом:', productPriceText);
                return;
            }

            addToCart(productName, productImage, productPrice, productQuantity);
            productQuantityInput.value = 1;
            document.querySelector('.product-modal').classList.remove('active');
            if (footer) footer.style.display = 'block';
            if (window.innerWidth <= 1200 && mobileCartButton) {
                mobileCartButton.style.display = 'block';
            }
            isProductModalOpen = false;
            enableScroll();
        });
    }

    if (productModal) {
        productModal.addEventListener('click', function (e) {
            const quantityInput = productModal.querySelector('.quantity-input');
            let value = parseInt(quantityInput.value);

            if (e.target.classList.contains('quantity-plus')) {
                quantityInput.value = value + 1;
            }

            if (e.target.classList.contains('quantity-minus')) {
                if (value > 1) {
                    quantityInput.value = value - 1;
                }
            }
        });
    }

    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', function (e) {
            if (e.target.classList.contains('quantity-minus')) {
                const cartItem = e.target.closest('.cart-item');
                const productName = cartItem.querySelector('.cart-item-name').textContent;
                const quantityInput = cartItem.querySelector('.quantity-input');
                let value = parseInt(quantityInput.value);

                if (value > 1) {
                    quantityInput.value = value - 1;
                    const item = items.find(item => item.name === productName);
                    if (item) {
                        item.quantity = value - 1;
                        updateCart();
                        updateMobileCart();
                        saveCartToLocalStorage();
                    }
                }
            }

            if (e.target.classList.contains('quantity-plus')) {
                const cartItem = e.target.closest('.cart-item');
                const productName = cartItem.querySelector('.cart-item-name').textContent;
                const quantityInput = cartItem.querySelector('.quantity-input');
                let value = parseInt(quantityInput.value);

                quantityInput.value = value + 1;
                const item = items.find(item => item.name === productName);
                if (item) {
                    item.quantity = value + 1;
                    updateCart();
                    updateMobileCart();
                    saveCartToLocalStorage();
                }
            }

            if (e.target.classList.contains('remove-item-btn')) {
                const cartItem = e.target.closest('.cart-item');
                const productName = cartItem.querySelector('.cart-item-name').textContent;

                items = items.filter(item => item.name !== productName);
                updateCart();
                updateMobileCart();
                saveCartToLocalStorage();
            }
        });
    }

    if (mobileCartItems) {
        mobileCartItems.addEventListener('click', function (e) {
            if (e.target.classList.contains('quantity-minus')) {
                const cartItem = e.target.closest('.cart-item');
                const productName = cartItem.querySelector('.cart-item-name').textContent;
                const quantityInput = cartItem.querySelector('.quantity-input');
                let value = parseInt(quantityInput.value);

                if (value > 1) {
                    quantityInput.value = value - 1;
                    const item = items.find(item => item.name === productName);
                    if (item) {
                        item.quantity = value - 1;
                        updateCart();
                        updateMobileCart();
                        saveCartToLocalStorage();
                    }
                }
            }

            if (e.target.classList.contains('quantity-plus')) {
                const cartItem = e.target.closest('.cart-item');
                const productName = cartItem.querySelector('.cart-item-name').textContent;
                const quantityInput = cartItem.querySelector('.quantity-input');
                let value = parseInt(quantityInput.value);

                quantityInput.value = value + 1;
                const item = items.find(item => item.name === productName);
                if (item) {
                    item.quantity = value + 1;
                    updateCart();
                    updateMobileCart();
                    saveCartToLocalStorage();
                }
            }

            if (e.target.classList.contains('remove-item-btn')) {
                const cartItem = e.target.closest('.cart-item');
                const productName = cartItem.querySelector('.cart-item-name').textContent;

                items = items.filter(item => item.name !== productName);
                updateCart();
                updateMobileCart();
                saveCartToLocalStorage();
            }
        });
    }

    updateCart();
    updateMobileCart();

    document.querySelectorAll('.category-item').forEach(category => {
        category.addEventListener('click', function () {
            const categoryId = this.getAttribute('data-category');
            const categorySection = document.getElementById(`category-${categoryId}`);

            if (categorySection) {
                if (window.innerWidth >= 1201) {
                    const contentContainer = document.querySelector('.content-container');
                    const rect = categorySection.getBoundingClientRect();
                    const containerRect = contentContainer.getBoundingClientRect();
                    const offsetTop = contentContainer.scrollTop + rect.top - containerRect.top - 100;
                    contentContainer.scrollTo({ top: offsetTop, behavior: 'smooth' });
                } else {
                    const offsetTop = categorySection.getBoundingClientRect().top + window.pageYOffset - 100;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
            }

            document.querySelectorAll('.category-item').forEach(item => {
                item.classList.remove('active');
            });

            this.classList.add('active');
        });
    });

    if (orderButton && orderForm && window.location.pathname.includes('cart.html')) {
        orderButton.addEventListener('click', function () {
            const formData = new FormData(orderForm);
            const deliveryType = localStorage.getItem('deliveryType');
    
            if (!validateOrderForm(formData, deliveryType)) {
                return;
            }
    
            const order = {
                date: new Date().toLocaleString(),
                items: items,
                totalPrice: Math.round(totalPrice),
                name: formData.get('name'),
                phone: formData.get('phone'),
                address: deliveryType === 'delivery' ? 
                    `${formData.get('street') || ''}${formData.get('street') ? ', ' : ''}${formData.get('house') || ''}${formData.get('entrance') ? ', подъезд ' + formData.get('entrance') : ''}${formData.get('floor') ? ', ' + formData.get('floor') + ' этаж' : ''}${formData.get('apartment') ? ', кв. ' + formData.get('apartment') : ''}` 
                    : 'Самовывоз',
                comment: formData.get('comment'),
                status: 'В обработке',
                deliveryType: deliveryType
            };
    
            console.log('Отправляемый заказ:', order); // Для отладки
            fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Ошибка оформления заказа');
                    }
                    return response.json();
                })
                .then(data => {
                    items = [];
                    updateCart();
                    updateMobileCart();
                    saveCartToLocalStorage();
                    orderSuccessModal.style.display = 'flex';
                })
                .catch(error => {
                    console.error('Ошибка оформления заказа:', error);
                    alert('Не удалось оформить заказ. Пожалуйста, попробуйте позже.');
                });
        });
    }

    function handleHeaderScroll() {
        if (window.innerWidth <= 1200 && topBar && mobileCategories) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollDelta = scrollTop - lastScrollTop;

            if (scrollDelta > 0 && scrollTop > 100) {
                topBar.classList.add('hidden');
                mobileCategories.classList.add('fixed');
                scrollUpDistance = 0;
            } else if (scrollDelta < 0) {
                scrollUpDistance += Math.abs(scrollDelta);
                if (scrollUpDistance >= scrollUpThreshold) {
                    topBar.classList.remove('hidden');
                    mobileCategories.classList.remove('fixed');
                    scrollUpDistance = 0;
                }
            }

            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        }
    }

    window.addEventListener('resize', function () {
        if (mobileCartButton) {
            if (window.innerWidth <= 1200) {
                mobileCartButton.style.display = 'block';
            } else {
                mobileCartButton.style.display = 'none';
            }
        }
    });

    window.addEventListener('scroll', handleHeaderScroll);
    window.addEventListener('resize', handleHeaderScroll);
    handleHeaderScroll();

    loadProducts();

    // Устанавливаем начальное состояние прокрутки
    if (window.innerWidth <= 1200) {
        body.style.overflow = 'auto'; // Разрешаем прокрутку на мобильных по умолчанию
    }
});