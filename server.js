const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const basicAuth = require('express-basic-auth');
const https = require('https');

const app = express();

// Настройка Multer для загрузки файлов
const uploadDir = path.join(__dirname, 'public', 'фото', 'фото товаров');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Ограничение 5 МБ
});

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Защита страницы оператора
app.use('/operator', basicAuth({
    users: { 'admin': 'operator123' },
    challenge: true,
    unauthorizedResponse: 'Доступ запрещён. Введите правильный логин и пароль.'
}));

// Маршруты для страниц
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

app.get('/operator', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'operator.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Файл operator.html не найден');
    }
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/delivery', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'delivery.html'));
});

// Подключение к базе данных
const dbPath = path.resolve(__dirname, 'database.sqlite');
console.log('Путь к базе данных:', dbPath);
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err);
        process.exit(1);
    } else {
        console.log('Подключение к базе данных успешно');
    }
});

// Создание таблиц
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            description TEXT,
            price REAL,
            image TEXT,
            weight TEXT,
            composition TEXT,
            calories REAL,
            protein REAL,
            fat REAL,
            carbs REAL,
            category TEXT,
            inStock INTEGER DEFAULT 1
        )`, (err) => {
        if (err) console.error('Ошибка создания таблицы products:', err);
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            items TEXT,
            totalPrice REAL,
            name TEXT,
            phone TEXT,
            address TEXT,
            comment TEXT,
            status TEXT,
            deliveryType TEXT
        )`, (err) => {
        if (err) console.error('Ошибка создания таблицы orders:', err);
    });
});

// Мониторинг памяти
setInterval(() => {
    const used = process.memoryUsage();
    console.log(`Использование памяти: RSS=${(used.rss / 1024 / 1024).toFixed(2)}MB, ` +
                `HeapTotal=${(used.heapTotal / 1024 / 1024).toFixed(2)}MB, ` +
                `HeapUsed=${(used.heapUsed / 1024 / 1024).toFixed(2)}MB`);
}, 60000);

// API для товаров (главная страница, только inStock = 1)
app.get('/api/products', (req, res) => {
    const stmt = db.prepare('SELECT * FROM products');
    stmt.all((err, rows) => {
        if (err) {
            console.error('Ошибка выполнения запроса к products:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        } else {
            res.json(rows);
        }
        stmt.finalize();
    });
});

// API для добавления товара
app.post('/api/products', (req, res) => {
    const { name, description, price, image, weight, composition, calories, protein, fat, carbs, category, inStock } = req.body;
    const stmt = db.prepare(`
        INSERT INTO products (name, description, price, image, weight, composition, calories, protein, fat, carbs, category, inStock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(name, description, price, image, weight, composition, calories, protein, fat, carbs, category, inStock, function(err) {
        if (err) {
            console.error('Ошибка добавления товара:', err);
            res.status(500).json({ error: err.message });
        } else {
            console.log('Товар добавлен с ID:', this.lastID);
            res.json({ id: this.lastID });
        }
        stmt.finalize();
    });
});

// API для удаления товара
app.delete('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    stmt.run(productId, function(err) {
        if (err) {
            console.error('Ошибка удаления товара:', err);
            res.status(500).json({ error: err.message });
        } else {
            console.log(`Товар #${productId} удалён`);
            res.json({ changes: this.changes });
        }
        stmt.finalize();
    });
});

// API для обновления статуса inStock
app.put('/api/products/:id/inStock', (req, res) => {
    const productId = req.params.id;
    const { inStock } = req.body;
    const stmt = db.prepare('UPDATE products SET inStock = ? WHERE id = ?');
    stmt.run(inStock, productId, function(err) {
        if (err) {
            console.error('Ошибка обновления статуса наличия:', err);
            res.status(500).json({ error: err.message });
        } else {
            console.log(`Статус наличия товара #${productId} обновлён на ${inStock}`);
            res.json({ changes: this.changes });
        }
        stmt.finalize();
    });
});

// API для обновления цены
app.put('/api/products/:id/price', (req, res) => {
    const productId = req.params.id;
    const { price } = req.body;
    const stmt = db.prepare('UPDATE products SET price = ? WHERE id = ?');
    stmt.run(price, productId, function(err) {
        if (err) {
            console.error('Ошибка обновления цены:', err);
            res.status(500).json({ error: err.message });
        } else {
            console.log(`Цена товара #${productId} обновлена на ${price}`);
            res.json({ changes: this.changes });
        }
        stmt.finalize();
    });
});

// API для загрузки изображения
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен или превышен лимит размера (5 МБ)' });
    }
    const filePath = `/фото/фото товаров/${req.file.filename}`;
    res.json({ filePath });
});

// API для создания заказа
app.post('/api/orders', (req, res) => {
    const { date, items, totalPrice, name, phone, address, comment, status, deliveryType } = req.body;
    console.log('Получен новый заказ:', req.body);
    const stmt = db.prepare(`
        INSERT INTO orders (date, items, totalPrice, name, phone, address, comment, status, deliveryType)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(date, JSON.stringify(items), totalPrice, name, phone, address, comment, status, deliveryType, function(err) {
        if (err) {
            console.error('Ошибка сохранения заказа:', err);
            res.status(500).json({ error: err.message });
        } else {
            console.log('Заказ сохранён с ID:', this.lastID);
            res.json({ id: this.lastID });
        }
        stmt.finalize();
    });
});

// API для получения заказов
app.get('/api/orders', (req, res) => {
    console.log('Запрос /api/orders');
    const stmt = db.prepare('SELECT * FROM orders');
    stmt.all((err, rows) => {
        if (err) {
            console.error('Ошибка выполнения запроса к orders:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        } else {
            console.log('Найдено заказов:', rows.length, 'Данные:', rows);
            res.json(rows);
        }
        stmt.finalize();
    });
});

// API для обновления статуса заказа
app.put('/api/orders/:id', (req, res) => {
    const { status } = req.body;
    const stmt = db.prepare('UPDATE orders SET status = ? WHERE id = ?');
    stmt.run(status, req.params.id, function(err) {
        if (err) {
            console.error('Ошибка обновления статуса:', err);
            res.status(500).json({ error: err.message });
        } else {
            console.log(`Статус заказа #${req.params.id} обновлён на ${status}`);
            res.json({ changes: this.changes });
        }
        stmt.finalize();
    });
});

// API для категорий
app.get('/api/categories', (req, res) => {
    res.json([
        { id: 'shashlyk', name: 'Шашлык', icon: '/фото/фото категорий/шашлык кат.png' },
        { id: 'shaurma', name: 'Шаурма', icon: '/фото/фото категорий/шаурма кат.png' },
        { id: 'garnir', name: 'Гарнир', icon: '/фото/фото категорий/гарнир кат.png' },
        { id: 'bread', name: 'Хлеб', icon: '/фото/фото категорий/хлеб кат.png' },
        { id: 'sauces', name: 'Соусы', icon: '/фото/фото категорий/соус кат.png' },
        { id: 'salads', name: 'Салаты', icon: '/фото/фото категорий/салат кат.png' },
        { id: 'hinkali', name: 'Хинкали', icon: '/фото/фото категорий/хинкали кат.png' },
        { id: 'burgers', name: 'Бургеры', icon: '/фото/фото категорий/бургеры кат.png' },
        { id: 'desserts', name: 'Десерты', icon: '/фото/фото категорий/десерты кат.png' }
    ]);
});

// HTTPS сервер
try {
    const options = {
        key: fs.readFileSync('/etc/letsencrypt/live/shashlyk-mashlyk-orel.ru/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/shashlyk-mashlyk-orel.ru/fullchain.pem')
    };
    https.createServer(options, app).listen(443, '0.0.0.0', () => {
        console.log('SSL-сервер запущен на порту 443');
    }).on('error', (err) => {
        console.error('Ошибка запуска HTTPS-сервера:', err);
        process.exit(1);
    });
} catch (err) {
    console.error('Ошибка чтения сертификатов:', err);
    console.log('Сервер не запущен из-за ошибки сертификатов');
    process.exit(1);
}

// Закрытие базы данных при завершении
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) console.error('Ошибка закрытия базы данных:', err);
        console.log('База данных закрыта');
        process.exit(0);
    });
});