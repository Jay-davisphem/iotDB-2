-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Device types policies (public read)
CREATE POLICY "Anyone can view device types" ON device_types
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage device types" ON device_types
  FOR ALL USING (auth.role() = 'authenticated');

-- Devices policies
CREATE POLICY "Authenticated users can view all devices" ON devices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage devices" ON devices
  FOR ALL USING (auth.role() = 'authenticated');

-- IoT data policies
CREATE POLICY "Authenticated users can view all iot data" ON iot_data
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert iot data" ON iot_data
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Device configurations policies
CREATE POLICY "Authenticated users can view device configurations" ON device_configurations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage device configurations" ON device_configurations
  FOR ALL USING (auth.role() = 'authenticated');

-- Alerts policies
CREATE POLICY "Authenticated users can view alerts" ON alerts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage alerts" ON alerts
  FOR ALL USING (auth.role() = 'authenticated');

-- Data archives policies
CREATE POLICY "Authenticated users can view data archives" ON data_archives
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage data archives" ON data_archives
  FOR ALL USING (auth.role() = 'authenticated');

-- API keys policies
CREATE POLICY "Users can view their own API keys" ON api_keys
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can manage their own API keys" ON api_keys
  FOR ALL USING (auth.uid() = created_by);
