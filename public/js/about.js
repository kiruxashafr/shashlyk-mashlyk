document.addEventListener('DOMContentLoaded', function () {
    const contactButton = document.querySelector('.contact-button');
    const contactModal = document.querySelector('.contact-modal');
    const contactModalClose = document.querySelector('.contact-modal-close');
    const menuCheckbox = document.getElementById('menu-checkbox');
    const navLinks = document.querySelector('.nav-links');
    const body = document.querySelector('body');

    // Бургер-меню (синхронизировано с main.js)
    if (menuCheckbox && navLinks) {
        menuCheckbox.addEventListener('change', function () {
            if (this.checked) {
                navLinks.classList.add('active');
                body.classList.add('menu-open');
                body.style.overflow = 'hidden';
            } else {
                navLinks.classList.remove('active');
                body.classList.remove('menu-open');
                body.style.overflow = 'auto';
            }
        });

        document.addEventListener('click', function (e) {
            if (!document.getElementById('menu-btn-container').contains(e.target) && 
                !navLinks.contains(e.target)) {
                menuCheckbox.checked = false;
                navLinks.classList.remove('active');
                body.classList.remove('menu-open');
                body.style.overflow = 'auto';
            }
        });

        document.addEventListener('touchstart', function (e) {
            if (menuCheckbox.checked && !navLinks.contains(e.target) && 
                !document.getElementById('menu-btn-container').contains(e.target)) {
                menuCheckbox.checked = false;
                navLinks.classList.remove('active');
                body.classList.remove('menu-open');
                body.style.overflow = 'auto';
            }
        });

        function adjustNavPosition() {
            if (window.innerWidth <= 339) {
                const topBarHeight = document.querySelector('.top-bar').offsetHeight;
                navLinks.style.top = `${topBarHeight}px`;
            } else if (window.innerWidth <= 768) {
                navLinks.style.top = '60px';
            }
        }

        window.addEventListener('resize', adjustNavPosition);
        adjustNavPosition();
    }

    // Открытие модального окна контактов
    if (contactButton && contactModal) {
        contactButton.addEventListener('click', function () {
            contactModal.classList.add('active');
        });
    }

    // Закрытие модального окна контактов
    if (contactModalClose) {
        contactModalClose.addEventListener('click', function () {
            contactModal.classList.remove('active');
        });
    }

    if (contactModal) {
        contactModal.addEventListener('click', function (e) {
            if (e.target === contactModal) {
                contactModal.classList.remove('active');
            }
        });
    }

// Инициализация Яндекс.Карты
ymaps.ready(init);
function init() {
    const myMap = new ymaps.Map("map", {
        center: [56.344, 37.520], // Координаты: ул. Подчерково, 67, Дмитров
        zoom: 10 // Уменьшенный зум, чтобы радиус был виден
    });

    // Метка для кафе
    const myPlacemark = new ymaps.Placemark([56.344, 37.520], {
        hintContent: 'Шашлык-Машлык',
        balloonContent: 'г. Дмитров, ул. Подчерково, д. 67'
    });

    // Круг для радиуса доставки
    const deliveryCircle = new ymaps.Circle([
        [56.344, 37.520], // Центр круга
        5000 // Радиус 10 км
    ], {
        hintContent: 'Зона доставки',
        balloonContent: 'Доставка по Дмитрову и Дмитровскому району'
    }, {
        fillColor: '#FF000033', // Красная заливка с прозрачностью
        strokeColor: '#FF0000', // Красная обводка
        strokeOpacity: 0.8,
        strokeWidth: 2,
        fillOpacity: 0.2
    });

    // Добавляем метку и круг на карту
    myMap.geoObjects.add(myPlacemark);
    myMap.geoObjects.add(deliveryCircle);
}
});