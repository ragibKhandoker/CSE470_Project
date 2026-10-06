-- Create Serving Logs Table (NGO meal distribution tracking)
CREATE TABLE IF NOT EXISTS serving_logs (
    id SERIAL PRIMARY KEY,
    ngo_id INTEGER NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
    meals_served INTEGER NOT NULL,
    location TEXT NOT NULL,
    notes TEXT,
    served_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
