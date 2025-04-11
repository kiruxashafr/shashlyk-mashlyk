CREATE TABLE products (
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
        );
