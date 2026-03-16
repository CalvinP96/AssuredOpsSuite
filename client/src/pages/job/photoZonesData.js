export const PHOTO_ZONES = [
  { zone: 'home_exterior', title: 'HOME EXTERIOR', items: [
    { key: 'front_of_home', label: 'Front of home', timing: 'PRE', note: 'Address must be visible' },
    { key: 'pre_existing_damage_ext', label: 'Pre-existing damage', timing: 'PRE', note: 'Any existing damage' },
    { key: 'roof_condition', label: 'Roof overall condition', timing: 'PRE', note: 'Overall roof' },
    { key: 'other_sides', label: '3 other sides of home', timing: 'PRE', note: 'Remaining three sides' },
    { key: 'ac_condenser', label: 'AC Condenser', timing: 'PRE', note: 'Unit itself' },
    { key: 'ac_condenser_tag', label: 'AC Condenser tag', timing: 'PRE', note: 'Data tag must be legible' },
    { key: 'vent_terminations', label: 'Vent terminations', timing: 'PRE', note: 'Termination points' },
    { key: 'gutters', label: 'Gutters', timing: 'PRE', note: 'Downspouts, elbows, extensions' },
  ]},
  { zone: 'attic', title: 'ATTIC', items: [
    { key: 'insulation', label: 'Insulation', timing: 'BOTH', note: 'Full attic view, wide angle required' },
    { key: 'major_bypasses', label: 'Major bypasses', timing: 'PRE', note: 'Air leakage bypass locations' },
    { key: 'baffle_needs', label: 'Baffle needs', timing: 'PRE', note: 'Soffit baffles or fire dams' },
    { key: 'exhaust_terminations', label: 'Exhaust terminations', timing: 'PRE', note: 'Where exhausts terminate' },
    { key: 'hatch', label: 'Hatch', timing: 'PRE', note: 'Attic hatch condition' },
    { key: 'roof_decking', label: 'Roof decking condition', timing: 'PRE', note: 'Underside of roof deck' },
    { key: 'pre_existing_damage_attic', label: 'Pre-existing damage', timing: 'PRE', note: 'Damage documented' },
    { key: 'bulk_moisture_attic', label: 'Bulk moisture/mold', timing: 'PRE', note: 'Any moisture or mold' },
  ]},
  { zone: 'top_floor', title: 'TOP FLOOR', items: [
    { key: 'insulation_opportunities_top', label: 'Insulation opportunities', timing: 'PRE', note: 'Exterior/knee wall areas' },
    { key: 'plumbing_di_top', label: 'Plumbing DI retrofits', timing: 'MEASURE', note: 'Direct Install retrofits' },
    { key: 'pre_existing_damage_top', label: 'Pre-existing damage', timing: 'PRE', note: 'Damage documented' },
  ]},
  { zone: 'main_floor', title: 'MAIN FLOOR', items: [
    { key: 'insulation_opportunities_main', label: 'Insulation opportunities', timing: 'PRE', note: 'Exterior/knee wall areas' },
    { key: 'plumbing_di_main', label: 'Plumbing DI retrofits', timing: 'MEASURE', note: 'Direct Install retrofits' },
    { key: 'pre_existing_damage_main', label: 'Pre-existing damage', timing: 'PRE', note: 'Damage documented' },
    { key: 'thermostat_main', label: 'Thermostat', timing: 'PRE', note: 'Existing thermostat' },
  ]},
  { zone: 'low_e_storm_windows', title: 'LOW-E STORM WINDOWS', items: [
    { key: 'broken_window_pane', label: 'Broken/missing window pane', timing: 'PRE', note: 'Damaged/missing pane' },
    { key: 'low_e_installed', label: 'Low-e storm window installed', timing: 'POST', note: 'Completed installation' },
  ]},
  { zone: 'ec_motors', title: 'EC MOTORS', items: [
    { key: 'existing_motor', label: 'Existing motor', timing: 'PRE', note: 'Data tag must be visible' },
    { key: 'installed_ec_motor', label: 'Installed EC motor', timing: 'POST', note: 'New EC motor in place' },
    { key: 'replacement_part_details', label: 'Replacement part details', timing: 'POST', note: 'Data tag must be legible' },
  ]},
  { zone: 'inside_ac_covers', title: 'INSIDE AC COVERS', items: [
    { key: 'window_ac_unit', label: 'Window AC unit', timing: 'PRE', note: 'Uncovered unit' },
    { key: 'covered_unit', label: 'Covered unit', timing: 'POST', note: 'Cover with foam gaskets visible' },
  ]},
  { zone: 'foundation', title: 'FOUNDATION', items: [
    { key: 'insulation_opportunities_fnd', label: 'Insulation opportunities', timing: 'PRE', note: 'Rim joist/crawl wall/ceiling' },
    { key: 'plumbing_di_fnd', label: 'Plumbing DI retrofits', timing: 'MEASURE', note: 'Direct Install retrofits' },
    { key: 'pre_existing_damage_fnd', label: 'Pre-existing damage', timing: 'PRE', note: 'Damage documented' },
    { key: 'furnace_frn', label: 'Furnace/FRN', timing: 'PRE', note: 'Venting must be visible' },
    { key: 'water_heater_hwt', label: 'Water Heater/HWT', timing: 'PRE', note: 'Venting must be visible' },
    { key: 'dryer_vent', label: 'Dryer vent', timing: 'PRE', note: 'Vent, termination, and cap' },
    { key: 'bulk_moisture_fnd', label: 'Bulk moisture/mold', timing: 'PRE', note: 'Any moisture or mold' },
  ]},
  { zone: 'caz', title: 'CAZ (Combustion Appliance Zone)', items: [
    { key: 'smoke_co_detectors', label: 'Smoke/CO detectors', timing: 'PRE', note: 'Detectors present/installed' },
    { key: 'dhw_flue_pipes', label: 'DHW flue pipes config', timing: 'PRE', note: 'Pipe config and exhaust terminations' },
    { key: 'dhw_data_tag', label: 'DHW data tag', timing: 'PRE', note: 'Data tag must be legible' },
    { key: 'furnace_flue_config', label: 'Furnace flue configuration', timing: 'PRE', note: 'Flue config and exhaust terminations' },
    { key: 'furnace_data_tag', label: 'Furnace data tag', timing: 'PRE', note: 'Data tag must be legible' },
  ]},
  { zone: 'air_seal', title: 'AIR SEAL', items: [
    { key: 'blower_door_setup', label: 'Blower door setup', timing: 'DURING', note: 'Blower door with manometer' },
    { key: 'manometer_pre_cfm50', label: 'Manometer pre-CFM50', timing: 'PRE', note: 'CFM50 reading legible' },
    { key: 'manometer_post_cfm50', label: 'Manometer post-CFM50', timing: 'POST', note: 'CFM50 reading legible' },
    { key: 'common_penetrations', label: 'Common penetrations', timing: 'PRE', note: 'Top plates, plumbing, drop soffits, duct/flue penetrations' },
  ]},
  { zone: 'duct_seal', title: 'DUCT SEAL', items: [
    { key: 'mastic_tape', label: 'Mastic/tape on ducts', timing: 'POST', note: 'Sealed ducts and joints' },
    { key: 'manometer_duct_pre', label: 'Manometer duct leakage pre', timing: 'PRE', note: 'Reading legible; include on assessment report' },
    { key: 'manometer_duct_post', label: 'Manometer duct leakage post', timing: 'POST', note: 'Reading legible; include on assessment report' },
  ]},
  { zone: 'ashrae_fan', title: 'ASHRAE FAN', items: [
    { key: 'specs_on_box', label: 'Specs on box', timing: 'PRE', note: 'Model number visible' },
    { key: 'fan_installed', label: 'Fan installed', timing: 'POST', note: 'Installed fan' },
    { key: 'fan_switch', label: 'Switch', timing: 'POST', note: 'Fan switch installed' },
  ]},
  { zone: 'new_products', title: 'NEW PRODUCTS', items: [
    { key: 'new_hvac', label: 'New HVAC', timing: 'POST', note: 'Data tag must be visible' },
    { key: 'new_furnace', label: 'New furnace', timing: 'POST', note: 'Data tag must be visible' },
    { key: 'new_water_heater', label: 'New water heater', timing: 'POST', note: 'Data tag must be visible' },
    { key: 'smart_thermostat', label: 'Smart thermostat', timing: 'POST', note: 'Installed thermostat' },
  ]},
];

export const TIMING_COLORS = { PRE: '#2563eb', POST: '#16a34a', BOTH: '#7c3aed', DURING: '#ea580c', MEASURE: '#d97706' };
