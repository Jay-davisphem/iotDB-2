-- Insert sample device types
INSERT INTO device_types (name, description, schema_definition) VALUES
('Temperature Sensor', 'Basic temperature monitoring device', '{
  "type": "object",
  "properties": {
    "temperature": {"type": "number", "unit": "celsius"},
    "humidity": {"type": "number", "unit": "percentage"},
    "battery": {"type": "number", "unit": "percentage"}
  },
  "required": ["temperature"]
}'),
('Smart Thermostat', 'Intelligent temperature control system', '{
  "type": "object",
  "properties": {
    "current_temp": {"type": "number", "unit": "celsius"},
    "target_temp": {"type": "number", "unit": "celsius"},
    "mode": {"type": "string", "enum": ["heat", "cool", "auto", "off"]},
    "fan_speed": {"type": "string", "enum": ["low", "medium", "high", "auto"]},
    "power_consumption": {"type": "number", "unit": "watts"}
  },
  "required": ["current_temp", "target_temp", "mode"]
}'),
('Motion Detector', 'PIR motion detection sensor', '{
  "type": "object",
  "properties": {
    "motion_detected": {"type": "boolean"},
    "confidence": {"type": "number", "minimum": 0, "maximum": 1},
    "battery": {"type": "number", "unit": "percentage"},
    "sensitivity": {"type": "number", "minimum": 1, "maximum": 10}
  },
  "required": ["motion_detected"]
}'),
('Air Quality Monitor', 'Multi-parameter air quality sensor', '{
  "type": "object",
  "properties": {
    "pm25": {"type": "number", "unit": "μg/m³"},
    "pm10": {"type": "number", "unit": "μg/m³"},
    "co2": {"type": "number", "unit": "ppm"},
    "voc": {"type": "number", "unit": "ppb"},
    "temperature": {"type": "number", "unit": "celsius"},
    "humidity": {"type": "number", "unit": "percentage"}
  },
  "required": ["pm25", "co2"]
}')
ON CONFLICT (name) DO NOTHING;

-- Insert sample devices
INSERT INTO devices (device_id, name, device_type_id, location, status, metadata) 
SELECT 
  'TEMP_001', 
  'Living Room Temperature Sensor', 
  dt.id, 
  'Living Room', 
  'active',
  '{"installation_date": "2024-01-15", "firmware_version": "1.2.3"}'
FROM device_types dt WHERE dt.name = 'Temperature Sensor'
ON CONFLICT (device_id) DO NOTHING;

INSERT INTO devices (device_id, name, device_type_id, location, status, metadata) 
SELECT 
  'THERM_001', 
  'Main Floor Thermostat', 
  dt.id, 
  'Hallway', 
  'active',
  '{"installation_date": "2024-01-10", "firmware_version": "2.1.0", "wifi_ssid": "HomeNetwork"}'
FROM device_types dt WHERE dt.name = 'Smart Thermostat'
ON CONFLICT (device_id) DO NOTHING;

INSERT INTO devices (device_id, name, device_type_id, location, status, metadata) 
SELECT 
  'MOTION_001', 
  'Front Door Motion Sensor', 
  dt.id, 
  'Front Entrance', 
  'active',
  '{"installation_date": "2024-01-20", "detection_range": "5m"}'
FROM device_types dt WHERE dt.name = 'Motion Detector'
ON CONFLICT (device_id) DO NOTHING;

INSERT INTO devices (device_id, name, device_type_id, location, status, metadata) 
SELECT 
  'AIR_001', 
  'Bedroom Air Quality Monitor', 
  dt.id, 
  'Master Bedroom', 
  'active',
  '{"installation_date": "2024-02-01", "calibration_date": "2024-02-01"}'
FROM device_types dt WHERE dt.name = 'Air Quality Monitor'
ON CONFLICT (device_id) DO NOTHING;

-- Insert sample IoT data (last 24 hours)
INSERT INTO iot_data (time, device_id, data)
SELECT 
  NOW() - (random() * INTERVAL '24 hours'),
  d.id,
  CASE d.device_id
    WHEN 'TEMP_001' THEN jsonb_build_object(
      'temperature', 20 + (random() * 10)::numeric(4,2),
      'humidity', 40 + (random() * 30)::numeric(4,2),
      'battery', 85 + (random() * 15)::numeric(4,2)
    )
    WHEN 'THERM_001' THEN jsonb_build_object(
      'current_temp', 21 + (random() * 4)::numeric(4,2),
      'target_temp', 22,
      'mode', (ARRAY['heat', 'cool', 'auto'])[floor(random() * 3 + 1)],
      'fan_speed', (ARRAY['low', 'medium', 'high'])[floor(random() * 3 + 1)],
      'power_consumption', 150 + (random() * 100)::numeric(6,2)
    )
    WHEN 'MOTION_001' THEN jsonb_build_object(
      'motion_detected', random() > 0.8,
      'confidence', (random())::numeric(3,2),
      'battery', 90 + (random() * 10)::numeric(4,2),
      'sensitivity', floor(random() * 10 + 1)
    )
    WHEN 'AIR_001' THEN jsonb_build_object(
      'pm25', (random() * 50)::numeric(4,1),
      'pm10', (random() * 100)::numeric(4,1),
      'co2', 400 + (random() * 600)::numeric(6,1),
      'voc', (random() * 500)::numeric(5,1),
      'temperature', 20 + (random() * 8)::numeric(4,2),
      'humidity', 45 + (random() * 25)::numeric(4,2)
    )
  END
FROM devices d, generate_series(1, 100) -- Generate 100 data points per device
WHERE d.device_id IN ('TEMP_001', 'THERM_001', 'MOTION_001', 'AIR_001');

-- Insert sample alerts
INSERT INTO alerts (device_id, title, description, severity, conditions)
SELECT 
  d.id,
  'High Temperature Alert',
  'Temperature exceeded normal operating range',
  'medium',
  '{"field": "temperature", "operator": ">", "value": 28}'
FROM devices d WHERE d.device_id = 'TEMP_001';

INSERT INTO alerts (device_id, title, description, severity, conditions)
SELECT 
  d.id,
  'Low Battery Warning',
  'Device battery level is below 20%',
  'low',
  '{"field": "battery", "operator": "<", "value": 20}'
FROM devices d WHERE d.device_id = 'MOTION_001';
