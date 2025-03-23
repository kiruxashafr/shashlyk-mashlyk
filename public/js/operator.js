document.addEventListener('DOMContentLoaded', function () {
    // Элементы авторизации
    const authModal = document.getElementById('auth-modal');
    const authPasswordInput = document.getElementById('auth-password');
    const authError = document.getElementById('auth-error');
    const operatorContainer = document.querySelector('.operator-container');

    // Показываем модальное окно при каждой загрузке
    authModal.style.display = 'flex';

    // Проверка пароля
    window.checkPassword = function () {
        const password = authPasswordInput.value;
        if (password === 'operator123') {
            authModal.style.display = 'none';
            operatorContainer.style.display = 'block';
            fetchActiveOrders();
            startAutoRefresh();
        } else {
            authError.textContent = 'Неверный пароль';
        }
    };

    const activeOrdersContainer = document.getElementById('active-orders');
    const historyButton = document.getElementById('history-button');
    const stockButton = document.getElementById('stock-button');
    const manageButton = document.getElementById('manage-button');
    const priceButton = document.getElementById('price-button');
    const orderHistoryModal = document.getElementById('order-history-modal');
    const stockModal = document.getElementById('stock-modal');
    const priceModal = document.getElementById('price-modal');
    const closeModal = document.querySelectorAll('.close-modal');
    const priceModalClose = document.querySelector('#price-modal .manage-products-close');
    const historyTabs = document.querySelectorAll('.tab-button');
    const successOrdersContainer = document.getElementById('success-orders');
    const canceledOrdersContainer = document.getElementById('canceled-orders');
    const stockListContainer = document.getElementById('stock-list');
    const priceListContainer = document.getElementById('price-list');
    const manageProductsModal = document.querySelector('.manage-products-modal');
    const manageProductsClose = document.querySelector('.manage-products-close');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const addProductForm = document.getElementById('add-product-form');
    const productList = document.getElementById('product-list');
    const confirmDeleteModal = document.querySelector('.confirm-delete-modal');
    const confirmPriceModal = document.getElementById('confirm-price-modal');
    const confirmCancel = document.querySelector('.confirm-cancel');
    const confirmDelete = document.querySelector('.confirm-delete');
    const confirmPriceCancel = document.querySelector('#confirm-price-modal .confirm-cancel');
    const confirmPriceButton = document.querySelector('.confirm-price');

    let productToDelete = null;
    let productToChangePrice = null;

    console.log('operator.js загружен');

    if (!activeOrdersContainer) {
        console.error('Контейнер active-orders не найден');
        return;
    }

    let orders = [];
    let history = { success: [], canceled: [] };
    let previousOrdersCount = 0;

    const notificationSound = new Audio('/audio/notification-4-270132.mp3');

    // Обновление активных заказов
    function updateActiveOrders() {
        activeOrdersContainer.innerHTML = '';
        if (orders.length === 0) {
            activeOrdersContainer.innerHTML = '<div>Нет активных заказов</div>';
        } else {
            orders.forEach(order => {
                const orderCard = document.createElement('div');
                orderCard.classList.add('order-card');
                orderCard.innerHTML = `
                    <h3>Заказ #${order.id} (${order.deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'})</h3>
                    ${order.status === 'В обработке' ? '<span class="new-order-indicator">Новый заказ!</span>' : ''}
                    <p><strong>Дата и время:</strong> ${order.date}</p>
                    <p><strong>Товары:</strong></p>
                    <ul>
                        ${JSON.parse(order.items).map(item => `<li>${item.name} - ${item.quantity} шт.</li>`).join('')}
                    </ul>
                    <p><strong>Общая сумма:</strong> ${Math.round(order.totalPrice)} ₽</p>
                    <p><strong>Имя:</strong> ${order.name}</p>
                    <p><strong>Телефон:</strong> ${order.phone}</p>
                    ${order.deliveryType === 'delivery' ? `<p><strong>Адрес:</strong> ${order.address || 'Не указан'}</p>` : ''}
                    <p><strong>Комментарий:</strong> ${order.comment || 'Нет'}</p>
                    <p class="status">Статус: ${order.status}</p>
                    <div class="buttons">
                        <button class="accept-button" onclick="updateOrderStatus(${order.id}, '${order.status}')">
                            ${order.status === 'В обработке' ? 'Принять' : order.status === 'Готовится' ? 'Передать в доставку' : 'Завершить'}
                        </button>
                        <button class="reject-button" onclick="rejectOrder(${order.id})">Отменить</button>
                    </div>
                `;
                activeOrdersContainer.appendChild(orderCard);
            });
        }
    }

    // Получение активных заказов
    function fetchActiveOrders() {
        fetch('/api/orders')
            .then(response => {
                if (!response.ok) throw new Error('Ошибка загрузки заказов');
                return response.json();
            })
            .then(data => {
                const newOrders = data.filter(order => order.status !== 'Успешно завершен' && order.status !== 'Удален');
                newOrders.sort((a, b) => {
                    if (a.status === 'В обработке' && b.status !== 'В обработке') return -1;
                    if (a.status !== 'В обработке' && b.status === 'В обработке') return 1;
                    return b.id - a.id;
                });
                if (newOrders.length > previousOrdersCount) {
                    const hasNewOrder = newOrders.some(order => order.status === 'В обработке' && !orders.some(o => o.id === order.id));
                    if (hasNewOrder) {
                        notificationSound.play().catch(error => console.error('Ошибка воспроизведения звука:', error));
                    }
                }
                orders = newOrders;
                previousOrdersCount = orders.length;
                updateActiveOrders();
            })
            .catch(error => console.error('Ошибка загрузки заказов:', error));
    }

    // Обновление статуса заказа
    window.updateOrderStatus = function (orderId, currentStatus) {
        let newStatus;
        if (currentStatus === 'В обработке') newStatus = 'Готовится';
        else if (currentStatus === 'Готовится') newStatus = 'В доставке';
        else if (currentStatus === 'В доставке') newStatus = 'Успешно завершен';

        if (newStatus) {
            fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
                .then(response => {
                    if (!response.ok) throw new Error('Ошибка обновления статуса');
                    return response.json();
                })
                .then(() => {
                    console.log(`Заказ #${orderId} обновлён до ${newStatus}`);
                    fetchActiveOrders();
                    if (orderHistoryModal.style.display === 'flex') {
                        fetchOrderHistory();
                    }
                })
                .catch(error => console.error('Ошибка обновления:', error));
        }
    };

    // Отмена заказа
    window.rejectOrder = function (orderId) {
        fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Удален' })
        })
            .then(response => {
                if (!response.ok) throw new Error('Ошибка отмены заказа');
                return response.json();
            })
            .then(() => {
                console.log(`Заказ #${orderId} отменён`);
                fetchActiveOrders();
                if (orderHistoryModal.style.display === 'flex') {
                    fetchOrderHistory();
                }
            })
            .catch(error => console.error('Ошибка отмены:', error));
    };

    // Получение истории заказов
    function fetchOrderHistory() {
        fetch('/api/orders')
            .then(response => {
                if (!response.ok) throw new Error('Ошибка загрузки истории');
                return response.json();
            })
            .then(data => {
                console.log('Получена история заказов:', data);
                history.success = data.filter(order => order.status === 'Успешно завершен');
                history.canceled = data.filter(order => order.status === 'Удален');
                updateHistory();
            })
            .catch(error => console.error('Ошибка загрузки истории:', error));
    }

    // Обновление истории заказов
    function updateHistory() {
        successOrdersContainer.innerHTML = history.success.length === 0 
            ? '<div>Нет успешных заказов</div>'
            : history.success.map(order => `
                <div class="order-card">
                    <h3>Заказ #${order.id} (${order.deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'})</h3>
                    <p><strong>Дата и время:</strong> ${order.date}</p>
                    <p><strong>Товары:</strong></p>
                    <ul>${JSON.parse(order.items).map(item => `<li>${item.name} - ${item.quantity} шт.</li>`).join('')}</ul>
                    <p><strong>Общая сумма:</strong> ${Math.round(order.totalPrice)} ₽</p>
                    <p><strong>Имя:</strong> ${order.name}</p>
                    <p><strong>Телефон:</strong> ${order.phone}</p>
                    ${order.deliveryType === 'delivery' ? `<p><strong>Адрес:</strong> ${order.address || 'Не указан'}</p>` : ''}
                    <p><strong>Комментарий:</strong> ${order.comment || 'Нет'}</p>
                    <p class="status">Статус: ${order.status}</p>
                </div>
            `).join('');
    
        canceledOrdersContainer.innerHTML = history.canceled.length === 0 
            ? '<div>Нет отменённых заказов</div>'
            : history.canceled.map(order => `
                <div class="order-card">
                    <h3>Заказ #${order.id} (${order.deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'})</h3>
                    <p><strong>Дата и время:</strong> ${order.date}</p>
                    <p><strong>Товары:</strong></p>
                    <ul>${JSON.parse(order.items).map(item => `<li>${item.name} - ${item.quantity} шт.</li>`).join('')}</ul>
                    <p><strong>Общая сумма:</strong> ${Math.round(order.totalPrice)} ₽</p>
                    <p><strong>Имя:</strong> ${order.name}</p>
                    <p><strong>Телефон:</strong> ${order.phone}</p>
                    ${order.deliveryType === 'delivery' ? `<p><strong>Адрес:</strong> ${order.address || 'Не указан'}</p>` : ''}
                    <p><strong>Комментарий:</strong> ${order.comment || 'Нет'}</p>
                    <p class="status">Статус: ${order.status}</p>
                </div>
            `).join('');
    }
    
    // Получение списка товаров для управления наличием
    function fetchStockList() {
        fetch('/api/products')
            .then(response => {
                if (!response.ok) throw new Error('Ошибка загрузки товаров');
                return response.json();
            })
            .then(products => {
                stockListContainer.innerHTML = '';
                if (products.length === 0) {
                    stockListContainer.innerHTML = '<div>Нет товаров</div>';
                } else {
                    products.forEach(product => {
                        const stockItem = document.createElement('div');
                        stockItem.classList.add('stock-item');
                        stockItem.innerHTML = `
                            <span class="stock-item-name">${product.name}</span>
                            <button class="stock-status-button ${product.inStock ? 'in-stock' : 'out-of-stock'}" 
                                    data-product-id="${product.id}" 
                                    data-in-stock="${product.inStock}">
                                ${product.inStock ? 'В наличии' : 'Нет в наличии'}
                            </button>
                        `;
                        stockListContainer.appendChild(stockItem);
                    });
                }

                document.querySelectorAll('.stock-status-button').forEach(button => {
                    button.addEventListener('click', function () {
                        const productId = this.getAttribute('data-product-id');
                        const currentStatus = this.getAttribute('data-in-stock') === '1';
                        const newStatus = !currentStatus;

                        fetch(`/api/products/${productId}/inStock`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ inStock: newStatus ? 1 : 0 })
                        })
                            .then(response => {
                                if (!response.ok) throw new Error('Ошибка обновления статуса');
                                return response.json();
                            })
                            .then(() => {
                                this.classList.toggle('in-stock');
                                this.classList.toggle('out-of-stock');
                                this.setAttribute('data-in-stock', newStatus ? '1' : '0');
                                this.textContent = newStatus ? 'В наличии' : 'Нет в наличии';
                            })
                            .catch(error => console.error('Ошибка обновления статуса:', error));
                    });
                });
            })
            .catch(error => console.error('Ошибка загрузки товаров:', error));
    }

    // Загрузка списка товаров для удаления
    function loadProductsForDeletion() {
        fetch('/api/products')
            .then(response => response.json())
            .then(products => {
                productList.innerHTML = '';
                products.forEach(product => {
                    const productItem = document.createElement('div');
                    productItem.classList.add('product-item');
                    productItem.innerHTML = `
                        <span>${product.name} (${product.category})</span>
                        <button class="delete-btn" data-id="${product.id}">Удалить</button>
                    `;
                    productList.appendChild(productItem);
                });

                document.querySelectorAll('.delete-btn').forEach(button => {
                    button.addEventListener('click', () => {
                        productToDelete = button.getAttribute('data-id');
                        confirmDeleteModal.classList.add('active');
                    });
                });
            })
            .catch(error => {
                console.error('Ошибка загрузки товаров:', error);
                alert('Не удалось загрузить товары');
            });
    }

    // Загрузка списка товаров для изменения цены
    function loadProductsForPriceChange() {
        fetch('/api/products')
            .then(response => response.json())
            .then(products => {
                priceListContainer.innerHTML = '';
                if (products.length === 0) {
                    priceListContainer.innerHTML = '<div>Нет товаров</div>';
                } else {
                    products.forEach(product => {
                        const priceItem = document.createElement('div');
                        priceItem.classList.add('stock-item');
                        priceItem.innerHTML = `
                            <span class="stock-item-name">${product.name}</span>
                            <span>Цена сейчас: ${Math.round(product.price)} ₽</span>
                            <span>Изменить на: </span>
                            <input type="number" class="price-input" step="0.01" min="0" >
                            <button class="change-price-btn" data-id="${product.id}">Изменить</button>
                        `;
                        priceListContainer.appendChild(priceItem);
                    });

                    document.querySelectorAll('.change-price-btn').forEach(button => {
                        button.addEventListener('click', () => {
                            const productId = button.getAttribute('data-id');
                            const newPrice = parseFloat(button.previousElementSibling.value);
                            if (isNaN(newPrice) || newPrice < 0) {
                                alert('Пожалуйста, введите корректную цену');
                                return;
                            }
                            productToChangePrice = { id: productId, price: newPrice };
                            const productName = button.closest('.stock-item').querySelector('.stock-item-name').textContent;
                            document.getElementById('confirm-price-text').textContent = 
                                `Вы действительно хотите изменить цену товара "${productName}" на ${Math.round(newPrice)} ₽?`;
                            confirmPriceModal.classList.add('active');
                        });
                    });
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки товаров для изменения цены:', error);
                alert('Не удалось загрузить товары');
            });
    }

    // Обработчики событий для модальных окон с закрытием при клике вне области
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                authModal.style.display = 'none';
            }
        });
    }

    if (orderHistoryModal) {
        orderHistoryModal.addEventListener('click', (e) => {
            if (e.target === orderHistoryModal) {
                orderHistoryModal.style.display = 'none';
            }
        });
    }

    if (stockModal) {
        stockModal.addEventListener('click', (e) => {
            if (e.target === stockModal) {
                stockModal.style.display = 'none';
            }
        });
    }

    if (priceModal) {
        priceModal.addEventListener('click', (e) => {
            if (e.target === priceModal) {
                priceModal.style.display = 'none';
            }
        });
    }

    if (manageProductsModal) {
        manageProductsModal.addEventListener('click', (e) => {
            if (e.target === manageProductsModal) {
                manageProductsModal.classList.remove('active');
            }
        });
    }

    if (confirmDeleteModal) {
        confirmDeleteModal.addEventListener('click', (e) => {
            if (e.target === confirmDeleteModal) {
                confirmDeleteModal.classList.remove('active');
                productToDelete = null;
            }
        });
    }

    if (confirmPriceModal) {
        confirmPriceModal.addEventListener('click', (e) => {
            if (e.target === confirmPriceModal) {
                confirmPriceModal.classList.remove('active');
                productToChangePrice = null;
            }
        });
    }

    // Обработчики событий для кнопок
    if (historyButton) {
        historyButton.addEventListener('click', () => {
            orderHistoryModal.style.display = 'flex';
            fetchOrderHistory();
        });
    }

    if (stockButton) {
        stockButton.addEventListener('click', () => {
            stockModal.style.display = 'flex';
            fetchStockList();
        });
    }

    if (priceButton) {
        priceButton.addEventListener('click', () => {
            priceModal.style.display = 'flex';
            loadProductsForPriceChange();
        });
    }

    closeModal.forEach(button => {
        button.addEventListener('click', () => {
            orderHistoryModal.style.display = 'none';
            stockModal.style.display = 'none';
            priceModal.style.display = 'none';
            manageProductsModal.classList.remove('active');
        });
    });

    if (priceModalClose) {
        priceModalClose.addEventListener('click', () => {
            priceModal.style.display = 'none';
        });
    }

    historyTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            historyTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
            document.getElementById(`${tab.dataset.tab}-orders`).style.display = 'block';
        });
    });

    if (manageButton) {
        manageButton.addEventListener('click', () => {
            manageProductsModal.classList.add('active');
            loadProductsForDeletion();
        });
    }

    if (manageProductsClose) {
        manageProductsClose.addEventListener('click', () => {
            manageProductsModal.classList.remove('active');
        });
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    if (confirmCancel) {
        confirmCancel.addEventListener('click', () => {
            confirmDeleteModal.classList.remove('active');
            productToDelete = null;
        });
    }

    if (confirmDelete) {
        confirmDelete.addEventListener('click', () => {
            if (productToDelete) {
                fetch(`/api/products/${productToDelete}`, {
                    method: 'DELETE'
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.changes > 0) {
                            alert('Товар успешно удалён');
                            loadProductsForDeletion();
                        } else {
                            alert('Товар не найден');
                        }
                        confirmDeleteModal.classList.remove('active');
                        productToDelete = null;
                    })
                    .catch(error => {
                        console.error('Ошибка удаления товара:', error);
                        alert('Не удалось удалить товар');
                    });
            }
        });
    }

    if (confirmPriceCancel) {
        confirmPriceCancel.addEventListener('click', () => {
            confirmPriceModal.classList.remove('active');
            productToChangePrice = null;
        });
    }

    if (confirmPriceButton) {
        confirmPriceButton.addEventListener('click', () => {
            if (productToChangePrice) {
                fetch(`/api/products/${productToChangePrice.id}/price`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ price: productToChangePrice.price })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.changes > 0) {
                            alert('Цена товара успешно изменена');
                            loadProductsForPriceChange();
                        } else {
                            alert('Товар не найден');
                        }
                        confirmPriceModal.classList.remove('active');
                        productToChangePrice = null;
                    })
                    .catch(error => {
                        console.error('Ошибка изменения цены товара:', error);
                        alert('Не удалось изменить цену товара');
                    });
            }
        });
    }

    if (addProductForm) {
        addProductForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = new FormData(addProductForm);
            const imageFile = formData.get('image');

            const uploadFormData = new FormData();
            uploadFormData.append('image', imageFile);

            fetch('/api/upload', {
                method: 'POST',
                body: uploadFormData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        throw new Error(data.error);
                    }

                    const productData = {
                        name: formData.get('name'),
                        description: formData.get('description'),
                        price: Math.round(parseFloat(formData.get('price'))),
                        image: data.filePath,
                        weight: formData.get('weight'),
                        composition: formData.get('composition'),
                        calories: parseFloat(formData.get('calories')),
                        protein: parseFloat(formData.get('protein')),
                        fat: parseFloat(formData.get('fat')),
                        carbs: parseFloat(formData.get('carbs')),
                        category: formData.get('category'),
                        inStock: parseInt(formData.get('inStock'))
                    };

                    return fetch('/api/products', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(productData)
                    });
                })
                .then(response => response.json())
                .then(data => {
                    alert('Товар успешно добавлен');
                    addProductForm.reset();
                    manageProductsModal.classList.remove('active');
                })
                .catch(error => {
                    console.error('Ошибка добавления товара:', error);
                    alert('Не удалось добавить товар: ' + error.message);
                });
        });
    }

    // Автообновление
    function startAutoRefresh() {
        setInterval(fetchActiveOrders, 3000);
    }
});