import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "plantguard.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Scans table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        plant TEXT NOT NULL,
        disease TEXT NOT NULL,
        disease_code TEXT NOT NULL,
        confidence REAL NOT NULL,
        severity TEXT NOT NULL,
        regions_json TEXT,
        image_data TEXT,
        notes TEXT,
        device_id TEXT
    )
    """)
    
    # IoT Devices table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS devices (
        device_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT,
        last_ping TEXT NOT NULL,
        battery_pct INTEGER DEFAULT 100,
        ip_address TEXT,
        status TEXT DEFAULT 'online',
        latest_scan_id INTEGER,
        FOREIGN KEY (latest_scan_id) REFERENCES scans (id)
    )
    """)
    
    # Seed default sample device if empty
    cursor.execute("SELECT COUNT(*) FROM devices")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO devices (device_id, name, location, last_ping, battery_pct, ip_address, status)
        VALUES 
        ('esp32-greenhouse-01', 'Greenhouse Node 1 (Polyhouse A)', 'Section 4 - Tomato Rows', datetime('now'), 94, '192.168.1.142', 'active'),
        ('rpi-orchard-02', 'Raspberry Pi HQ Cam Unit', 'Field Sector B', datetime('now', '-12 minutes'), 88, '192.168.1.189', 'active')
        """)
        
    conn.commit()
    conn.close()

def save_scan(plant: str, disease: str, disease_code: str, confidence: float, 
              severity: str, regions: List[Dict[str, Any]], image_data: Optional[str] = None, 
              notes: Optional[str] = None, device_id: Optional[str] = None) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
    INSERT INTO scans (timestamp, plant, disease, disease_code, confidence, severity, regions_json, image_data, notes, device_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (now, plant, disease, disease_code, confidence, severity, json.dumps(regions), image_data, notes, device_id))
    scan_id = cursor.lastrowid
    
    # Update device latest scan if applicable
    if device_id:
        cursor.execute("""
        UPDATE devices 
        SET last_ping = ?, latest_scan_id = ? 
        WHERE device_id = ?
        """, (now, scan_id, device_id))
        
    conn.commit()
    conn.close()
    return scan_id

def get_scans(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scans ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "timestamp": r["timestamp"],
            "plant": r["plant"],
            "disease": r["disease"],
            "disease_code": r["disease_code"],
            "confidence": r["confidence"],
            "severity": r["severity"],
            "regions": json.loads(r["regions_json"]) if r["regions_json"] else [],
            "image_data": r["image_data"],
            "notes": r["notes"],
            "device_id": r["device_id"]
        })
    conn.close()
    return results

def delete_scan(scan_id: int) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM scans WHERE id = ?", (scan_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def get_devices() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT d.*, s.disease as latest_disease, s.confidence as latest_confidence, s.severity as latest_severity, s.timestamp as scan_time
    FROM devices d
    LEFT JOIN scans s ON d.latest_scan_id = s.id
    ORDER BY d.last_ping DESC
    """)
    rows = cursor.fetchall()
    devices = []
    for r in rows:
        devices.append({
            "device_id": r["device_id"],
            "name": r["name"],
            "location": r["location"],
            "last_ping": r["last_ping"],
            "battery_pct": r["battery_pct"],
            "ip_address": r["ip_address"],
            "status": r["status"],
            "latest_scan": {
                "scan_id": r["latest_scan_id"],
                "disease": r["latest_disease"],
                "confidence": r["latest_confidence"],
                "severity": r["latest_severity"],
                "timestamp": r["scan_time"]
            } if r["latest_scan_id"] else None
        })
    conn.close()
    return devices

def update_device_heartbeat(device_id: str, battery_pct: Optional[int] = None, ip_address: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
    INSERT INTO devices (device_id, name, location, last_ping, battery_pct, ip_address, status)
    VALUES (?, ?, 'Field Node', ?, ?, ?, 'active')
    ON CONFLICT(device_id) DO UPDATE SET
        last_ping = excluded.last_ping,
        battery_pct = COALESCE(excluded.battery_pct, devices.battery_pct),
        ip_address = COALESCE(excluded.ip_address, devices.ip_address),
        status = 'active'
    """, (device_id, f"IoT Unit {device_id}", now, battery_pct, ip_address))
    conn.commit()
    conn.close()
