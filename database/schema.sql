-- RoadSense AI: MySQL Database Schema
-- Real-Time Road Accident Data Analysis and Visualization Platform
-- Compatible with MySQL 8.0+

CREATE DATABASE IF NOT EXISTS saferoads_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE saferoads_ai;

-- 1. Table: locations
-- Stores geographical entities (regions, roads, and coordinates when verified)
CREATE TABLE IF NOT EXISTS locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    region VARCHAR(150) NOT NULL,
    road_name VARCHAR(200) NULL,
    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_region (region),
    INDEX idx_road (road_name),
    INDEX idx_coordinates (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Table: data_sources
-- Documents provenance, limitations, and type of ingested datasets
CREATE TABLE IF NOT EXISTS data_sources (
    source_id INT AUTO_INCREMENT PRIMARY KEY,
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(100) NOT NULL DEFAULT 'CSV_BATCH',
    source_url VARCHAR(500) NULL,
    description TEXT NULL,
    is_synthetic BOOLEAN DEFAULT FALSE,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Table: accidents
-- Core accident records table linked to locations and data provenance
CREATE TABLE IF NOT EXISTS accidents (
    accident_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_record_id VARCHAR(150) NULL,
    accident_datetime DATETIME NULL,
    location_id INT NULL,
    vehicle_type VARCHAR(100) NULL,
    severity VARCHAR(100) NULL,
    weather VARCHAR(100) NULL,
    source_name VARCHAR(255) NULL,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_accident_location
        FOREIGN KEY (location_id) REFERENCES locations(location_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    INDEX idx_accident_datetime (accident_datetime),
    INDEX idx_severity (severity),
    INDEX idx_vehicle_type (vehicle_type),
    INDEX idx_weather (weather),
    INDEX idx_source (source_name),
    INDEX idx_location (location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Table: import_history
-- Audit log of CSV uploads, batch validation results, and ingestion counts
CREATE TABLE IF NOT EXISTS import_history (
    import_id INT AUTO_INCREMENT PRIMARY KEY,
    source_id INT NULL,
    filename VARCHAR(255) NOT NULL,
    total_rows INT NOT NULL DEFAULT 0,
    successful_rows INT NOT NULL DEFAULT 0,
    rejected_rows INT NOT NULL DEFAULT 0,
    duplicate_rows INT NOT NULL DEFAULT 0,
    missing_value_rows INT NOT NULL DEFAULT 0,
    validation_status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_import_source
        FOREIGN KEY (source_id) REFERENCES data_sources(source_id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
