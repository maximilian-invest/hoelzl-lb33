-- PostgreSQL Schema für LB33 Immobilien-Analyse App

-- Projekte-Tabelle
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    cfg_cases JSONB,
    fin_cases JSONB,
    texts JSONB,
    upside_scenarios JSONB,
    show_uploads BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bilder-Tabelle
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    src TEXT NOT NULL,
    caption TEXT,
    width INTEGER,
    height INTEGER,
    file_size BIGINT,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_name) REFERENCES projects(name) ON DELETE CASCADE
);

-- PDFs-Tabelle
CREATE TABLE IF NOT EXISTS pdfs (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    src TEXT NOT NULL,
    name VARCHAR(255),
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_name) REFERENCES projects(name) ON DELETE CASCADE
);

-- Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
CREATE INDEX IF NOT EXISTS idx_images_project_name ON images(project_name);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);
CREATE INDEX IF NOT EXISTS idx_pdfs_project_name ON pdfs(project_name);
CREATE INDEX IF NOT EXISTS idx_pdfs_created_at ON pdfs(created_at);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
