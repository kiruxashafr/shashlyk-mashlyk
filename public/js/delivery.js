document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded'); // Проверка, что DOM полностью загрузился

    // Бургер-меню
    const menuCheckbox = document.getElementById('menu-checkbox');
    const navLinks = document.querySelector('.nav-links');
    const body = document.body;

    if (menuCheckbox && navLinks && body) {
        console.log('Burger menu elements found');
        menuCheckbox.addEventListener('change', () => {
            console.log('Menu checkbox changed');
            navLinks.classList.toggle('active');
            body.classList.toggle('menu-open');
        });
    } else {
        console.error('Burger menu elements not found');
    }

    // Модальное окно
    const contactButton = document.querySelector('.contact-button');
    const contactModal = document.querySelector('.contact-modal');
    const contactModalClose = document.querySelector('.contact-modal-close');

    if (contactButton && contactModal && contactModalClose) {
        console.log('Modal elements found');
        contactButton.addEventListener('click', () => {
            console.log('Contact button clicked');
            contactModal.classList.add('active');
        });

        contactModalClose.addEventListener('click', () => {
            console.log('Modal close clicked');
            contactModal.classList.remove('active');
        });

        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) {
                console.log('Modal background clicked');
                contactModal.classList.remove('active');
            }
        });
    } else {
        console.error('Modal elements not found');
    }

    // Яндекс.Карта
    if (typeof ymaps !== 'undefined') {
        console.log('Yandex Maps script loaded');
        ymaps.ready(() => {
            console.log('Yandex Maps ready');
            const mapContainer = document.getElementById('map');
            if (mapContainer) {
                console.log('Map container found');
                const myMap = new ymaps.Map("map", {
                    center: [52.957096331794304, 36.05950076438327], // Координаты: ул. Карачевская, 58, Орел
                    zoom: 18
                });
        
                const myPlacemark = new ymaps.Placemark([52.957096331794304, 36.05950076438327], {
                    hintContent: 'Шашлык-Машлык',
                    balloonContent: 'г. Орел, ул. Карачевская, д. 58'
                });
        
                myMap.geoObjects.add(myPlacemark);
                console.log('Map initialized');
            } else {
                console.error('Map container #map not found');
            }
        });
    } else {
        console.error('Yandex Maps script not loaded');
    }
});