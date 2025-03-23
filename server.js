const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const port = 3000;

// Настройка multer для загрузки файлов
const uploadDir = path.join(__dirname, 'public/фото/фото товаров/');
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
const upload = multer({ storage: storage });

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

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
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err);
    } else {
        console.log('Подключение к базе данных успешно');

        // Инициализация таблиц
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS products (
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

            db.run(`CREATE TABLE IF NOT EXISTS orders (
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
    }
});

// API для получения товаров
app.get('/api/products', (req, res) => {
    db.all('SELECT * FROM products ORDER BY category, name', (err, rows) => {
        if (err) {
            console.error('Ошибка получения товаров:', err);
            res.status(500).json({ error: 'Ошибка получения товаров' });
            return;
        }
        res.json(rows);
    });
});

// API для добавления нового товара
app.post('/api/products', (req, res) => {
    const { name, description, price, image, weight, composition, calories, protein, fat, carbs, category, inStock } = req.body;
    const query = `INSERT INTO products (name, description, price, image, weight, composition, calories, protein, fat, carbs, category, inStock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [name, description, price, image, weight, composition, calories, protein, fat, carbs, category, inStock], function(err) {
        if (err) {
            console.error('Ошибка добавления товара:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log('Товар добавлен с ID:', this.lastID);
        res.json({ id: this.lastID });
    });
});

// API для удаления товара
app.delete('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    const query = `DELETE FROM products WHERE id = ?`;
    db.run(query, [productId], function(err) {
        if (err) {
            console.error('Ошибка удаления товара:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log(`Товар #${productId} удалён`);
        res.json({ changes: this.changes });
    });
});

// API для обновления статуса наличия товара
app.put('/api/products/:id/inStock', (req, res) => {
    const productId = req.params.id;
    const { inStock } = req.body;
    const query = `UPDATE products SET inStock = ? WHERE id = ?`;
    db.run(query, [inStock, productId], function(err) {
        if (err) {
            console.error('Ошибка обновления статуса наличия:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log(`Статус наличия товара #${productId} обновлён на ${inStock}`);
        res.json({ changes: this.changes });
    });
});

// API для обновления цены товара
app.put('/api/products/:id/price', (req, res) => {
    const productId = req.params.id;
    const { price } = req.body;
    const query = `UPDATE products SET price = ? WHERE id = ?`;
    db.run(query, [price, productId], function(err) {
        if (err) {
            console.error('Ошибка обновления цены:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log(`Цена товара #${productId} обновлена на ${price}`);
        res.json({ changes: this.changes });
    });
});

// API для загрузки изображения
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
    }
    const filePath = `/фото/фото товаров/${req.file.filename}`;
    res.json({ filePath });
});

// API для создания заказа
app.post('/api/orders', (req, res) => {
    const { date, items, totalPrice, name, phone, address, comment, status, deliveryType } = req.body;
    console.log('Получен новый заказ:', req.body);
    const query = `INSERT INTO orders (date, items, totalPrice, name, phone, address, comment, status, deliveryType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [date, JSON.stringify(items), totalPrice, name, phone, address, comment, status, deliveryType], function(err) {
        if (err) {
            console.error('Ошибка сохранения заказа:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log('Заказ сохранён с ID:', this.lastID);
        res.json({ id: this.lastID });
    });
});

// API для получения заказов
app.get('/api/orders', (req, res) => {
    db.all('SELECT * FROM orders', (err, rows) => {
        if (err) {
            console.error('Ошибка получения заказов:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// API для обновления статуса заказа
app.put('/api/orders/:id', (req, res) => {
    const { status } = req.body;
    const query = `UPDATE orders SET status = ? WHERE id = ?`;
    db.run(query, [status, req.params.id], function(err) {
        if (err) {
            console.error('Ошибка обновления статуса:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log(`Статус заказа #${req.params.id} обновлён на ${status}`);
        res.json({ changes: this.changes });
    });
});

// API для получения списка категорий
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

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});