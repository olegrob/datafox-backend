CREATE TABLE IF NOT EXISTS sync_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_category TEXT NOT NULL,
    mapped_category TEXT,
    warehouse TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(original_category, warehouse)
);
