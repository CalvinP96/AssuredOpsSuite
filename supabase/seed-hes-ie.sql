-- Seed HES-IE Program
-- Run in Supabase SQL Editor to populate the HES IE program with all measures, requirements, and rules.

-- 1. Insert the program
INSERT INTO programs (name, code, description, manager_name, manager_title, status)
VALUES (
  'HES IE',
  'HES-IE',
  'Home Energy Savings - Income Eligible. Single family retrofits program per the 2026 HES Retrofits Operations Manual.',
  NULL,
  NULL,
  'active'
) ON CONFLICT (code) DO NOTHING;

-- 2. Main DO block for all dependent inserts
DO $$
DECLARE
  pid bigint;
  mid bigint;
  measure_count INT;
BEGIN
  -- Get the program ID
  SELECT id INTO pid FROM programs WHERE code = 'HES-IE';

  -- Check if already seeded
  SELECT COUNT(*) INTO measure_count FROM program_measures WHERE program_id = pid;
  IF measure_count > 0 THEN
    RAISE NOTICE 'HES IE program already seeded (% measures)', measure_count;
    RETURN;
  END IF;

  RAISE NOTICE 'Seeding HES IE program rules...';

  -- =====================
  -- MEASURES
  -- =====================

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Assessment', 'Single Family Assessment', 'Initial home energy assessment by BPI Building Analyst Professional (BA-P). Includes diagnostic testing, data collection, health & safety evaluation, and project scoping.', 'N/A', 'N/A', 'Staff must be BPI Building Analyst Professional (BA-P) certified. Use Energy Audit Data Collection Form. Collect baseline conditions, photos of each eligible measure, general home characteristics (occupants, sq ft, stories, year built, home type).', 0, 0, 1);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Direct Install', 'Programmable Thermostat', 'Replace manual thermostat with programmable thermostat capable of 7-day schedule.', 'Existing thermostat must be functional. Customer requests programmable over advanced.', 'Must have capability to adjust temperature set points according to a 7-day schedule.', 'Power shut off at furnace switch. Remove old thermostat carefully (avoid paint/drywall damage). Mercury thermostats disposed per protocol. Install per manufacturer specs. Test furnace and AC functionality (AC not tested if outdoor temp ≤65°F). Program with customer input. Provide tutorial on ENERGY STAR settings. Install backplate if needed.', 0, 0, 10);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Direct Install', 'Advanced Thermostat', 'Smart/advanced thermostat for homes with furnace and/or CAC.', 'Existing thermostat must be functional. Replaces manual or programmable. Boiler homes: only if existing thermostat in poor condition.', 'Must be advanced/smart thermostat with occupancy sensing.', 'Screen customer: smartphone not required, Wi-Fi not required but encouraged. Verify HVAC compatibility. Power shut off at furnace switch. Remove old thermostat carefully. Install per manufacturer specs. Test functionality. Program with customer. Provide tutorial on ENERGY STAR settings.', 0, 0, 11);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Insulation', 'Attic Insulation', 'Insulate attic to R-49 when existing insulation ≤R-19.', 'Existing attic insulation rated R-19 or lower.', 'Bring up to R-49.', 'Attic must be accessible and free of clutter. H&S issues resolved first. Install per BPI specs. Air sealing must accompany attic insulation. Chimney dams required when insulation contacts chimney. Inspect ceiling integrity: check for cracks, sagging/bowing, fastener type (screws required if nails found), joist spacing ≤16" OC. Consider cellulose weight on poor ceilings (fiberglass alternative). Inspect ceiling fans for secure structural attachment.', 0, 0, 20);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Insulation', 'Basement/Crawlspace Wall Insulation', 'Insulate basement or crawlspace walls with minimum R-10.', 'No existing insulation on basement/crawlspace walls.', 'Minimum R-10.', 'Install per BPI specifications.', 0, 0, 21);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Insulation', 'Floor Insulation Above Crawlspace', 'Insulate floor above unconditioned crawlspace to minimum R-20.', 'No existing floor insulation above unconditioned crawlspace.', 'Minimum R-20. If ductwork in crawlspace, thermal boundary = crawlspace walls instead.', 'Install per BPI specifications.', 0, 0, 22);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Insulation', 'Wall Insulation', 'Insulate walls when no existing insulation or existing is in poor condition.', 'No existing wall insulation or existing in poor condition.', 'Per BPI standards.', 'Install per BPI specifications.', 0, 0, 23);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Insulation', 'Wall Insulation (Knee Wall)', 'Insulate attic knee walls and sloped ceiling spaces to R-11+.', 'No existing effective thermal resistance in cavity.', 'R-11 or greater.', 'For attic knee walls and attic spaces with sloped ceilings.', 0, 0, 24);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Insulation', 'Rim Joist Insulation', 'Insulate rim/band joist with minimum R-10.', 'No existing rim joist insulation.', 'Minimum R-10.', 'Seal all penetrations in rim joist before insulating.', 0, 0, 25);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Insulation', 'Low-e Storm Windows', 'Add storm windows to inoperable single pane windows.', 'Single pane, inoperable windows.', 'Low-e storm window.', 'Measure IGU in sash (W x H x Thickness).', 0, 0, 26);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Insulation', 'AC Covers', 'Rigid or flexible insulated cover for indoor side of room AC unit.', 'Room AC unit (window, sleeve, through-wall, PTAC, PTHP) poorly installed with gaps.', 'Must remain installed throughout winter heating season.', 'Rigid cover with foam gaskets to seal edges, or flexible well-insulated cover. For wall-thru/sleeve units removed for heating season: rigid cover fits inside sleeve with foam gaskets.', 0, 0, 27);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Air Sealing & Duct Sealing', 'Air Sealing', 'Reduce air infiltration with goal of 25%+ CFM50 reduction.', 'CFM50 reading ≥110% of conditioned square footage.', 'Goal: 25% or greater overall reduction in CFM50.', 'Per BPI specifications. Not completed where unsafe (CAZ issue, indoor air quality concern, improper ventilation, medical conditions). Must be accompanied by proper ventilation (ASHRAE 62.2).', 0, 0, 30);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Air Sealing & Duct Sealing', 'Duct Sealing', 'Seal ducts in unconditioned and semi-conditioned spaces using mastic.', 'Leaky ductwork in unconditioned or semi-conditioned spaces.', 'Must have CFM25 pre/post readings. Seal plenums, main ducts, takeoffs, and boots minimum.', 'Use mastic sealant, DuctEZ, or HVAC tape. Measure total leakage at CFM25 before and after with duct blaster. Duct system needing repairs requires sufficient H&S budget.', 0, 0, 31);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Mechanicals', 'Gas Furnace Replacement', 'Emergency replacement of gas furnace. Must have ≥95% efficiency. DECISION TREE: Is equipment failed? → If YES → Eligible for Replacement. If NO → Does it pose H&S risk? → If YES → Is it repairable under $950? → If YES → Not Eligible (repair instead). If NO → Eligible for Replacement. If electric resistance heat → Eligible for heat pump replacement regardless.', 'Equipment failed OR poses H&S risk AND repair cost ≥$950. Electric resistance heat systems always eligible for heat pump replacement.', 'New furnace must be ≥95% efficiency.', 'Emergency replacement only. Install by qualified contractor per manufacturer specs and local/regional/state codes. Should not be performed unless accompanying air sealing and insulation measures. Recommended to install after other measures complete. Submit tech report to RI for approval. Complete Manual J for sizing.', 1, 0, 40);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Mechanicals', 'Boiler Replacement', 'Emergency replacement of boiler. New boiler efficiency ≥95%. DECISION TREE: Is equipment failed? → If YES → Eligible for Replacement. If NO → Does it pose H&S risk? → If YES → Is it repairable under $700? → If YES → Not Eligible (repair instead). If NO → Eligible for Replacement.', 'Equipment failed OR poses H&S risk AND repair cost ≥$700.', 'New boiler efficiency ≥95%.', 'Emergency replacement only. Install by qualified contractor per manufacturer specs and codes. Submit tech report to RI for approval.', 1, 0, 41);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Mechanicals', 'Natural Gas Water Heater Replacement', 'Emergency replacement. Energy factor ≥0.67. DECISION TREE: Is equipment failed? → If YES → Eligible for Replacement. If NO → Does it pose H&S risk? → If YES → Is it repairable under $650? → If YES → Not Eligible (repair instead). If NO → Eligible for Replacement. If electric resistance → Eligible for heat pump WH regardless.', 'Equipment failed OR poses H&S risk AND repair cost ≥$650. Electric resistance water heaters always eligible for heat pump WH replacement.', 'Energy factor of new water heater must be ≥0.67.', 'Emergency replacement only. Install by qualified contractor per manufacturer specs and codes. Submit tech report to RI for approval.', 1, 0, 42);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Mechanicals', 'Electric Water Heater Replacement (Heat Pump)', 'Replace electric resistance water heaters with Heat Pump Water Heaters regardless of age/condition. ComEd can replace ANY existing electric HVAC/DHW with heat pumps - does NOT need to be TOS/emergency.', 'Any existing electric resistance water heater - no age or condition requirement. ComEd funded.', 'Must be Energy Star rated Heat Pump Water Heater.', 'Consult homeowner, especially if recently replaced. Provide customer education on heat pump WH routine maintenance. Do not proceed if customer cannot keep up with regular maintenance.', 0, 0, 43);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Mechanicals', 'Central Air Conditioner Replacement', 'Emergency replacement. DECISION TREE: Is equipment failed? → If YES → Eligible for Replacement. If NO → Does it pose H&S risk? → If YES → Is it repairable under $190/ton? → If YES → Not Eligible (repair instead). If NO → Eligible for Replacement. Must be ≤SEER 10 and manufactured before 2000.', 'CAC must be ≤SEER 10 and manufactured before 2000. Equipment failed OR poses H&S risk AND repair cost ≥$190/ton.', 'New CAC must have SEER 2 ≥15.2 (16 SEER equivalent).', 'Emergency replacement only. Submit tech report to RI for approval. Complete Manual J for sizing.', 1, 0, 44);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Mechanicals', 'Gas Furnace Tune-Up', 'Tune and clean for gas furnaces not serviced in 3+ years. This is the HVAC entry point - HVAC only gets involved if a tune and clean is recommended. Tech produces a tech report complying with IL TRM 2026. If issues are found, the tech report includes recommendations per the Mechanical Decision Tree. If no issues, the tune and clean is complete and billable as-is.', 'Must not have received tune-up within last 3 years. Not allowed on propane furnaces.', 'Per IL TRM 2026 requirements.', 'Measure combustion efficiency. Check/clean blower assembly. Lubricate motor, inspect fan belt. Inspect for gas leaks. Clean burner, adjust. Check ignition/safety systems. Check/clean heat exchanger. Inspect exhaust/flue. Inspect control box/wiring. Check air filter. Inspect ductwork. Measure temperature rise. Check volts/amps. Check thermostat operation. Perform CO test and adjust. Produce tech report per IL TRM 2026. If issues found, apply Mechanical Decision Tree (Appendix H) and include replacement recommendations in tech report.', 0, 0, 45);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Mechanicals', 'Boiler Tune-Up', 'Tune and clean for boilers not serviced in 3+ years. This is the HVAC entry point - HVAC only gets involved if a tune and clean is recommended. Tech produces a tech report complying with IL TRM 2026. If issues are found, the tech report includes recommendations per the Mechanical Decision Tree. If no issues, the tune and clean is complete and billable as-is.', 'Must not have received tune-up within last 3 years.', 'Per IL TRM 2026 requirements.', 'Measure combustion efficiency. Adjust airflow/stack temps. Adjust burner and gas input. Check venting, piping insulation, safety controls, combustion air. Clean fireside surfaces. Inspect refractory, gaskets, doors. Clean water cut-off controls. Flush boiler. Clean burner and pilot. Check electrode. Clean damper/blower. Check motor starter contacts. Perform flame safeguard checks. Troubleshoot problems. Produce tech report per IL TRM 2026. If issues found, apply Mechanical Decision Tree (Appendix H) and include replacement recommendations in tech report.', 0, 0, 46);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Mechanicals', 'Room Air Conditioner Replacement', 'Emergency replacement of nonfunctional room AC. DECISION TREE: Is equipment failed? → If YES → Eligible for Replacement. If NO → Not Eligible.', 'Room AC must be nonfunctional (failed). Simple pass/fail - no repair threshold.', 'Replace with Energy Star efficiency.', 'Emergency replacement only.', 1, 0, 47);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Mechanicals', 'EC Motors', 'Electronically commutated motor for older but running HVAC systems.', 'System is older but running well.', 'Static pressure taken to ensure system functioning as specified.', 'Take static pressure reading before and after.', 0, 0, 48);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Health & Safety', 'Kitchen Exhaust Fan', 'Install per ASHRAE 62.2 mechanical ventilation requirements.', 'As required to meet ASHRAE 62.2 ventilation rates.', 'Meet required ventilation rates plus spot ventilation for moisture.', 'Install minimum fans needed. Use existing exterior exhaust runs where possible. ASHRAE 62.2 allows whole-house ventilation to cover spot deficiencies. Upload RedCalc screenshot to RISE. Include basement area in ASHRAE calc. Include fan flow rates on assessment report.', 0, 1, 50);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Health & Safety', 'Bathroom Exhaust Fan', 'Install per ASHRAE 62.2 requirements.', 'As required per ASHRAE 62.2.', 'Meet ASHRAE 62.2 ventilation rates.', 'Same requirements as kitchen exhaust fan. Upload RedCalc screenshot to RISE.', 0, 1, 51);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Health & Safety', 'Bathroom Exhaust Fan w/ Light', 'Combination exhaust fan with light per ASHRAE 62.2.', 'As required per ASHRAE 62.2.', 'Meet ASHRAE 62.2 ventilation rates.', 'Same requirements as exhaust fans.', 0, 1, 52);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Health & Safety', 'Smoke Detector - Change Out', '10-year sealed battery. Replace any battery-operated detector older than 10 years.', 'Install per local code requirements.', 'UL 217 listed.', 'Use 10-year sealed battery. Replace any battery-operated smoke detector older than 10 years per 2023 law.', 0, 0, 53);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Health & Safety', 'Smoke Detector - Hardwired', 'Hardwired smoke detector per local code.', 'Install per local code requirements.', 'UL 217 listed.', 'Install per code and manufacturer instructions.', 0, 0, 54);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Health & Safety', 'CO Detector', 'Carbon monoxide detector per UL 2034.', 'Install per local code requirements.', 'Must meet Standard UL 2034.', 'Install per code and manufacturer instructions.', 0, 0, 55);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Health & Safety', 'CO Detector Hardwired', 'Hardwired CO detector.', 'Per local code.', 'UL 2034.', 'Install per code and manufacturer instructions.', 0, 0, 56);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Health & Safety', 'CO/Smoke Combo - Hardwired', 'Combination CO and smoke detector, hardwired.', 'Per local code.', 'UL 217 and UL 2034.', 'Install per code and manufacturer instructions.', 0, 0, 57);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Health & Safety', 'Dryer Vent Pipe', 'Replace improperly installed or missing dryer/combustion exhaust vent.', 'Exhaust vent improperly installed or missing.', 'Must terminate outside building shell, never in attic.', 'Minimum semi-rigid dryer duct for new dryer vent.', 0, 0, 58);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Health & Safety', 'Dryer Vent Termination', 'Proper termination of dryer vent.', 'Vent not properly terminated outside.', 'Terminate outside building shell.', 'Must terminate outside building shell.', 0, 0, 59);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Health & Safety', 'Gas Mechanical Repairs', 'Repair existing gas furnace, boiler, or water heater that does not meet replacement guidelines.', 'Equipment does not meet replacement guidelines and needs operational or H&S repair.', 'N/A.', 'Resolve operational issue or health & safety issue. Included in $1,000 H&S cap.', 0, 0, 60);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Health & Safety', 'Battery Replacements (9V, AA, AAA)', 'Replace non-functioning batteries in CO detectors.', 'Existing battery on CO detector not functioning.', 'N/A.', 'Replace with appropriate battery.', 0, 0, 61);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Health & Safety', 'Exhaust Vent Termination', 'If not associated with fan installation.', 'Vent not properly terminated.', 'Terminate outside building shell.', 'If not associated with installation of a fan.', 0, 0, 62);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Health & Safety', 'Miscellaneous H&S', 'Any H&S items outside listed items, case-by-case basis.', 'Case-by-case. Home should not be deferred without proposing all H&S measures.', 'N/A.', 'List measures with associated costs in RISE.', 0, 0, 63);

  INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES
  (pid, 'Health & Safety', 'Building Permit Fee', 'Building permit fee associated with the job.', 'As required by local jurisdiction.', 'N/A.', 'Include in list of measures in RISE. Input as Health & Safety measure.', 0, 0, 64);

  -- =====================
  -- PHOTO REQUIREMENTS
  -- =====================

  -- Single Family Assessment photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Single Family Assessment';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Front of home with address', 'both', 0),
  (mid, 'Pre-existing damage (exterior)', 'both', 1),
  (mid, 'Roof overall condition', 'both', 2),
  (mid, '3 other sides of home', 'both', 3),
  (mid, 'AC Condenser', 'both', 4),
  (mid, 'AC Condenser data tag', 'both', 5),
  (mid, 'Vent terminations (exterior)', 'both', 6),
  (mid, 'Gutters (downspouts, elbows, extensions)', 'both', 7),
  (mid, 'Foundation insulation opportunities (exterior wall/rim joist/crawl wall/ceiling)', 'both', 8),
  (mid, 'Plumbing DI retrofits', 'both', 9),
  (mid, 'Pre-existing damage (foundation)', 'both', 10),
  (mid, 'Furnace with venting', 'both', 11),
  (mid, 'Water heater with venting', 'both', 12),
  (mid, 'Dryer vent/termination/cap', 'both', 13),
  (mid, 'Bulk moisture/mold (foundation)', 'both', 14),
  (mid, 'Existing attic insulation (wide angle, full attic)', 'both', 15),
  (mid, 'Major bypasses', 'both', 16),
  (mid, 'Baffle needs (soffit or fire dam)', 'both', 17),
  (mid, 'Exhaust terminations (attic)', 'both', 18),
  (mid, 'Attic hatch', 'both', 19),
  (mid, 'Roof decking condition', 'both', 20),
  (mid, 'Pre-existing damage (attic)', 'both', 21),
  (mid, 'Bulk moisture/mold (attic)', 'both', 22),
  (mid, 'Smoke/CO detectors', 'both', 23),
  (mid, 'DHW flue pipes configuration/exhaust terminations', 'both', 24),
  (mid, 'Water heater data tag', 'both', 25),
  (mid, 'Furnace flue configuration/exhaust terminations', 'both', 26),
  (mid, 'Furnace data tag', 'both', 27),
  (mid, 'Top floor insulation opportunities (exterior wall/knee wall)', 'both', 28),
  (mid, 'Top floor plumbing DI retrofits', 'both', 29),
  (mid, 'Pre-existing damage (top floor)', 'both', 30),
  (mid, 'Main floor insulation opportunities (exterior wall/knee wall)', 'both', 31),
  (mid, 'Main floor plumbing DI retrofits', 'both', 32),
  (mid, 'Pre-existing damage (main floor)', 'both', 33),
  (mid, 'Existing thermostat', 'both', 34);

  -- Programmable Thermostat photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Programmable Thermostat';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Existing thermostat (before)', 'both', 0),
  (mid, 'New thermostat installed (after)', 'both', 1),
  (mid, 'Thermostat programming display', 'both', 2);

  -- Advanced Thermostat photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Advanced Thermostat';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Existing thermostat (before)', 'both', 0),
  (mid, 'New smart thermostat installed (after)', 'both', 1),
  (mid, 'Thermostat display/programming', 'both', 2);

  -- Attic Insulation photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Attic Insulation';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Pre insulation (full attic, wide angle)', 'both', 0),
  (mid, 'Post insulation (full attic, wide angle)', 'both', 1),
  (mid, 'Insulation depth rulers at multiple points (after)', 'both', 2),
  (mid, 'Chimney dam installed', 'both', 3);

  -- Basement/Crawlspace Wall Insulation photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Basement/Crawlspace Wall Insulation';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Bare walls (before)', 'both', 0),
  (mid, 'Completed wall insulation (after)', 'both', 1);

  -- Floor Insulation Above Crawlspace photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Floor Insulation Above Crawlspace';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Exposed floor (before)', 'both', 0),
  (mid, 'Completed floor insulation (after)', 'both', 1);

  -- Wall Insulation photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Wall Insulation';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Wall cavity (before)', 'both', 0),
  (mid, 'Drill holes filled/patched (after)', 'both', 1);

  -- Wall Insulation (Knee Wall) photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Wall Insulation (Knee Wall)';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Knee wall before insulation', 'both', 0),
  (mid, 'Knee wall after insulation', 'both', 1);

  -- Rim Joist Insulation photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Rim Joist Insulation';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Exposed rim joist (before)', 'both', 0),
  (mid, 'Sealed penetrations', 'both', 1),
  (mid, 'Completed rim joist insulation (after)', 'both', 2);

  -- Low-e Storm Windows photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Low-e Storm Windows';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Broken/missing window pane (before)', 'both', 0),
  (mid, 'Low-e storm window installed (after)', 'both', 1);

  -- AC Covers photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'AC Covers';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Pre picture of window unit', 'both', 0),
  (mid, 'Post picture of covered unit with foam gaskets or sealed edges', 'both', 1);

  -- Air Sealing photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Air Sealing';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Blower door setup with manometer', 'both', 0),
  (mid, 'Pre CFM50 manometer reading', 'both', 1),
  (mid, 'Common penetrations in thermal boundary (top plates, plumbing, drop soffits, duct & flue penetrations)', 'both', 2),
  (mid, 'Post CFM50 manometer reading', 'both', 3);

  -- Duct Sealing photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Duct Sealing';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Pre-CFM25 manometer reading (include on assessment report)', 'both', 0),
  (mid, 'Mastic/tape on ducts/joints', 'both', 1),
  (mid, 'Post-CFM25 manometer reading (include on assessment report)', 'both', 2);

  -- Gas Furnace Replacement photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Gas Furnace Replacement';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Existing furnace with data tag (before)', 'both', 0),
  (mid, 'New furnace installed with data tag (after)', 'both', 1),
  (mid, 'Venting/exhaust connection', 'both', 2);

  -- Boiler Replacement photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Boiler Replacement';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Existing boiler with data tag (before)', 'both', 0),
  (mid, 'New boiler installed with data tag (after)', 'both', 1),
  (mid, 'Venting connections', 'both', 2);

  -- Natural Gas Water Heater Replacement photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Natural Gas Water Heater Replacement';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Existing water heater with data tag (before)', 'both', 0),
  (mid, 'New water heater installed with data tag (after)', 'both', 1),
  (mid, 'Venting connection', 'both', 2);

  -- Electric Water Heater Replacement (Heat Pump) photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Electric Water Heater Replacement (Heat Pump)';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Existing electric water heater (before)', 'both', 0),
  (mid, 'New heat pump water heater installed with data tag (after)', 'both', 1),
  (mid, 'Energy Star label', 'both', 2);

  -- Central Air Conditioner Replacement photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Central Air Conditioner Replacement';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Existing CAC with data tag showing SEER and manufacture date (before)', 'both', 0),
  (mid, 'New CAC unit installed with data tag (after)', 'both', 1);

  -- Gas Furnace Tune-Up photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Gas Furnace Tune-Up';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Furnace data tag', 'both', 0),
  (mid, 'Combustion analyzer readings (before)', 'both', 1),
  (mid, 'Combustion analyzer readings (after)', 'both', 2);

  -- Boiler Tune-Up photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Boiler Tune-Up';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Boiler data tag', 'both', 0),
  (mid, 'Combustion analyzer readings (before)', 'both', 1),
  (mid, 'Combustion analyzer readings (after)', 'both', 2);

  -- EC Motors photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'EC Motors';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Existing motor with data tag', 'both', 0),
  (mid, 'Installed EC motor', 'both', 1),
  (mid, 'Replacement part details (data tag or specs)', 'both', 2);

  -- Kitchen Exhaust Fan photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Kitchen Exhaust Fan';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Fan specs on box with model #', 'both', 0),
  (mid, 'Fan installed', 'both', 1),
  (mid, 'Switch', 'both', 2),
  (mid, 'Exterior termination', 'both', 3),
  (mid, 'RedCalc screenshot', 'both', 4);

  -- Bathroom Exhaust Fan photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Bathroom Exhaust Fan';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Fan specs on box with model #', 'both', 0),
  (mid, 'Fan installed', 'both', 1),
  (mid, 'Switch', 'both', 2),
  (mid, 'Exterior termination', 'both', 3),
  (mid, 'RedCalc screenshot', 'both', 4);

  -- Bathroom Exhaust Fan w/ Light photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Bathroom Exhaust Fan w/ Light';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Fan specs on box with model #', 'both', 0),
  (mid, 'Fan with light installed', 'both', 1),
  (mid, 'Switch', 'both', 2),
  (mid, 'Exterior termination', 'both', 3),
  (mid, 'RedCalc screenshot', 'both', 4);

  -- Smoke Detector - Change Out photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Smoke Detector - Change Out';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Old detector (before)', 'both', 0),
  (mid, 'New detector installed (after)', 'both', 1);

  -- Smoke Detector - Hardwired photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Smoke Detector - Hardwired';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'New hardwired detector installed', 'both', 0);

  -- CO Detector photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'CO Detector';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'New CO detector installed', 'both', 0);

  -- CO Detector Hardwired photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'CO Detector Hardwired';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'New hardwired CO detector installed', 'both', 0);

  -- CO/Smoke Combo - Hardwired photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'CO/Smoke Combo - Hardwired';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'New combo detector installed', 'both', 0);

  -- Dryer Vent Pipe photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Dryer Vent Pipe';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Existing dryer vent condition (before)', 'both', 0),
  (mid, 'New dryer vent installed (after)', 'both', 1),
  (mid, 'Exterior termination', 'both', 2);

  -- Dryer Vent Termination photos
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Dryer Vent Termination';
  INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES
  (mid, 'Existing termination (before)', 'both', 0),
  (mid, 'New termination installed (after)', 'both', 1);

  -- =====================
  -- PAPERWORK REQUIREMENTS
  -- =====================

  -- Single Family Assessment paperwork
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Single Family Assessment';
  INSERT INTO measure_paperwork_requirements (measure_id, document_name, required, sort_order) VALUES
  (mid, 'Energy Audit Data Collection Form (Appendix D)', 1, 0),
  (mid, 'Customer Authorization Form - Signed (Appendix E)', 1, 1),
  (mid, 'Hazardous Conditions Form if deferral (Appendix I)', 1, 2),
  (mid, 'Scope of Work - Signed by Customer', 1, 3),
  (mid, 'All baseline data entered in RISE', 1, 4),
  (mid, 'LiDAR scan stored in SharePoint', 1, 5),
  (mid, 'MS Forms assessment checklist completed', 1, 6);

  -- Attic Insulation paperwork
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Attic Insulation';
  INSERT INTO measure_paperwork_requirements (measure_id, document_name, required, sort_order) VALUES
  (mid, 'Pre/post insulation depth measurements in RISE', 1, 0),
  (mid, 'Ceiling inspection notes documented', 1, 1);

  -- Air Sealing paperwork
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Air Sealing';
  INSERT INTO measure_paperwork_requirements (measure_id, document_name, required, sort_order) VALUES
  (mid, 'Pre/post blower door test results (CFM50) in RISE', 1, 0),
  (mid, 'ASHRAE 62.2 ventilation calculation', 1, 1);

  -- Duct Sealing paperwork
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Duct Sealing';
  INSERT INTO measure_paperwork_requirements (measure_id, document_name, required, sort_order) VALUES
  (mid, 'Pre/post duct blaster results (CFM25) in RISE', 1, 0);

  -- Gas Furnace Replacement paperwork
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Gas Furnace Replacement';
  INSERT INTO measure_paperwork_requirements (measure_id, document_name, required, sort_order) VALUES
  (mid, 'Mechanical Replacement Decision Tree completed (Appendix H)', 1, 0),
  (mid, 'Tech report emailed to RI program contacts', 1, 1),
  (mid, 'RI replacement approval received', 1, 2),
  (mid, 'Manual J load calculation completed', 1, 3),
  (mid, 'Equipment sizing documentation', 1, 4),
  (mid, 'Manufacturer warranty info provided to customer', 1, 5),
  (mid, 'Sub-contractor estimate/invoice', 1, 6);

  -- Boiler Replacement paperwork
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Boiler Replacement';
  INSERT INTO measure_paperwork_requirements (measure_id, document_name, required, sort_order) VALUES
  (mid, 'Mechanical Replacement Decision Tree completed (Appendix H)', 1, 0),
  (mid, 'Tech report emailed to RI program contacts', 1, 1),
  (mid, 'RI replacement approval received', 1, 2),
  (mid, 'Manufacturer warranty info provided to customer', 1, 3),
  (mid, 'Sub-contractor estimate/invoice', 1, 4);

  -- Natural Gas Water Heater Replacement paperwork
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Natural Gas Water Heater Replacement';
  INSERT INTO measure_paperwork_requirements (measure_id, document_name, required, sort_order) VALUES
  (mid, 'Mechanical Replacement Decision Tree completed (Appendix H)', 1, 0),
  (mid, 'Tech report emailed to RI program contacts', 1, 1),
  (mid, 'RI replacement approval received', 1, 2),
  (mid, 'Manufacturer warranty info provided to customer', 1, 3),
  (mid, 'Sub-contractor estimate/invoice', 1, 4);

  -- Electric Water Heater Replacement (Heat Pump) paperwork
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Electric Water Heater Replacement (Heat Pump)';
  INSERT INTO measure_paperwork_requirements (measure_id, document_name, required, sort_order) VALUES
  (mid, 'Customer approval to replace documented', 1, 0),
  (mid, 'Energy Star certification', 1, 1),
  (mid, 'Maintenance instructions provided to customer', 1, 2),
  (mid, 'Sub-contractor estimate/invoice', 1, 3);

  -- Central Air Conditioner Replacement paperwork
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Central Air Conditioner Replacement';
  INSERT INTO measure_paperwork_requirements (measure_id, document_name, required, sort_order) VALUES
  (mid, 'Mechanical Replacement Decision Tree completed (Appendix H)', 1, 0),
  (mid, 'Tech report emailed to RI program contacts', 1, 1),
  (mid, 'RI replacement approval received', 1, 2),
  (mid, 'Manual J load calculation completed', 1, 3),
  (mid, 'Existing unit SEER and manufacture date documented', 1, 4),
  (mid, 'Manufacturer warranty info provided to customer', 1, 5),
  (mid, 'Sub-contractor estimate/invoice', 1, 6);

  -- Room Air Conditioner Replacement paperwork
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Room Air Conditioner Replacement';
  INSERT INTO measure_paperwork_requirements (measure_id, document_name, required, sort_order) VALUES
  (mid, 'Documentation that unit is nonfunctional', 1, 0),
  (mid, 'Energy Star certification of replacement', 1, 1);

  -- Gas Furnace Tune-Up paperwork
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Gas Furnace Tune-Up';
  INSERT INTO measure_paperwork_requirements (measure_id, document_name, required, sort_order) VALUES
  (mid, 'Tech report compliant with IL TRM 2026', 1, 0),
  (mid, 'Combustion efficiency readings (before/after) in RISE', 1, 1),
  (mid, 'All IL TRM required tune and clean activities documented', 1, 2),
  (mid, 'Mechanical Decision Tree (Appendix H) completed if issues found', 1, 3),
  (mid, 'Replacement recommendation in tech report if decision tree indicates', 1, 4);

  -- Boiler Tune-Up paperwork
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Boiler Tune-Up';
  INSERT INTO measure_paperwork_requirements (measure_id, document_name, required, sort_order) VALUES
  (mid, 'Tech report compliant with IL TRM 2026', 1, 0),
  (mid, 'Combustion efficiency readings (before/after) in RISE', 1, 1),
  (mid, 'All IL TRM required tune and clean activities documented', 1, 2),
  (mid, 'Mechanical Decision Tree (Appendix H) completed if issues found', 1, 3),
  (mid, 'Replacement recommendation in tech report if decision tree indicates', 1, 4);

  -- Kitchen Exhaust Fan paperwork
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Kitchen Exhaust Fan';
  INSERT INTO measure_paperwork_requirements (measure_id, document_name, required, sort_order) VALUES
  (mid, 'RedCalc screenshot uploaded to RISE', 1, 0),
  (mid, 'ASHRAE 62.2 calculation (include basement area)', 1, 1),
  (mid, 'Fan flow rates on assessment report', 1, 2);

  -- Bathroom Exhaust Fan paperwork
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Bathroom Exhaust Fan';
  INSERT INTO measure_paperwork_requirements (measure_id, document_name, required, sort_order) VALUES
  (mid, 'RedCalc screenshot uploaded to RISE', 1, 0),
  (mid, 'ASHRAE 62.2 calculation', 1, 1),
  (mid, 'Fan flow rates on assessment report', 1, 2);

  -- Bathroom Exhaust Fan w/ Light paperwork
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Bathroom Exhaust Fan w/ Light';
  INSERT INTO measure_paperwork_requirements (measure_id, document_name, required, sort_order) VALUES
  (mid, 'RedCalc screenshot uploaded to RISE', 1, 0),
  (mid, 'ASHRAE 62.2 calculation', 1, 1),
  (mid, 'Fan flow rates on assessment report', 1, 2);

  -- Gas Mechanical Repairs paperwork
  SELECT id INTO mid FROM program_measures WHERE program_id = pid AND name = 'Gas Mechanical Repairs';
  INSERT INTO measure_paperwork_requirements (measure_id, document_name, required, sort_order) VALUES
  (mid, 'Documentation of repair needed', 1, 0),
  (mid, 'Repair cost within $1,000 H&S cap', 1, 1);

  -- =====================
  -- PROCESS STEPS
  -- =====================

  INSERT INTO program_process_steps (program_id, phase, step_number, title, description, required_certification, required_forms, timeline, sort_order) VALUES
  (pid, 'Intake', 1, 'Leads from RISE', 'Project Coordinator receives leads from RISE every morning and enters them into the system.', NULL, NULL, 'Daily - every morning', 0),
  (pid, 'Intake', 2, 'Call & Schedule Assessment', 'Project Coordinator contacts customer to schedule assessment appointment.', NULL, NULL, 'Within 2 business days of lead', 1),
  (pid, 'Assessment', 3, 'SLAM LiDAR Scan', 'Assessor performs full SLAM LiDAR scan of home using BLK2GO. Scans stored in SharePoint. LiDAR used to measure the house.', 'BPI Building Analyst Professional (BA-P)', NULL, NULL, 2),
  (pid, 'Assessment', 4, 'MS Forms Data Collection', 'Fill out MS Forms checklist for items that cannot be captured by LiDAR scan (e.g., nameplate data, equipment conditions, existing insulation depth).', NULL, 'MS Forms Assessment Checklist', NULL, 3),
  (pid, 'Assessment', 5, 'Required Photos', 'Take all required pre-installation photos per the Documentation and Photo Checklist. Photos of each existing condition and eligible measure area.', NULL, 'Documentation and Photo Checklist (Appendix J)', NULL, 4),
  (pid, 'Assessment', 6, 'Store LiDAR Scans', 'Upload completed LiDAR scans to SharePoint in proper folder structure.', NULL, NULL, 'Same day as assessment', 5),
  (pid, 'Assessment', 7, 'Collect Signatures', 'Customer signs Customer Authorization Form (Appendix E) at time of assessment. If any health and safety conditions are present, customer also signs the Health & Safety Form (Appendix I). Customer receives a copy of all signed forms.', NULL, 'Customer Authorization Form (Appendix E), Health & Safety Form (Appendix I) if applicable', 'During assessment', 6),
  (pid, 'Assessment', 8, 'Handle Deferrals', 'If deferral needed: cite under Customer Status in RISE, complete Hazardous Conditions Form, present to customer for signature, upload to RISE.', NULL, 'Hazardous Conditions Form (Appendix I)', NULL, 7),
  (pid, 'Scope & Pre-Approval', 9, 'Create Scope of Work', 'Build scope of work based on program rules and assessment findings. Include all eligible measures identified during assessment.', NULL, 'Scope of Work', NULL, 8),
  (pid, 'Scope & Pre-Approval', 10, 'Get Scope of Work Signed', 'Customer signs Scope of Work. Customer Authorization and Health & Safety forms should already be signed at assessment.', NULL, 'Scope of Work - Signed', NULL, 9),
  (pid, 'Scope & Pre-Approval', 11, 'Upload Pre-Pictures', 'Upload all pre-installation photos to RISE as zip folder or Company Cam link. Ensure documents named with address and are legible.', NULL, NULL, NULL, 10),
  (pid, 'Scope & Pre-Approval', 12, 'Create Estimate with Program Pricing', 'Create estimate using program pricing for all scoped measures. Upload estimate to RISE.', NULL, 'Program Estimate', NULL, 11),
  (pid, 'Scope & Pre-Approval', 13, 'Identify Permit Requirements', 'During scope creation, identify if the job requires any building permits based on work type and local jurisdiction. Flag the job and begin permit tracking.', NULL, NULL, 'During scope creation', 12),
  (pid, 'Scope & Pre-Approval', 14, 'Submit for Pre-Approval', 'Submit complete package to RI for pre-approval: signed forms, photos, estimate, all RISE data.', NULL, 'All pre-approval documents', 'RI target turnaround: 2 business days', 13),
  (pid, 'HVAC', 15, 'Perform Tune & Clean', 'HVAC only gets involved if a tune and clean is recommended during assessment/scoping. Tech performs tune and clean per IL TRM 2026 requirements and produces a tech report. The tech report documents all findings and complies with IL TRM 2026 for tune and cleans in Illinois.', NULL, 'Tech Report (IL TRM 2026 compliant)', 'After pre-approval', 14),
  (pid, 'HVAC', 16, 'Evaluate Findings & Decision Tree', 'Review tech report findings. If issues are present, apply the Mechanical Replacement Decision Tree (Appendix H) to determine if equipment qualifies for replacement. If no issues are found, the tune and clean is complete and billable - no further HVAC steps needed.', NULL, 'Mechanical Decision Trees (Appendix H) - only if issues found', NULL, 15),
  (pid, 'HVAC', 17, 'Submit Tech Report for Replacement (If Needed)', 'Only if the decision tree indicates replacement: email tech report with decision tree results and replacement recommendation to RI program contacts for approval.', NULL, 'Tech Report with replacement recommendation (emailed to RI contacts)', NULL, 16),
  (pid, 'HVAC', 18, 'Receive Replacement Approval', 'RI reviews tech report and approves or denies replacement request. Track approval status.', NULL, 'Replacement Approval from RI', NULL, 17),
  (pid, 'HVAC', 19, 'Manual J & Equipment Selection', 'Only if replacement approved. Complete Manual J load calculation to determine proper equipment sizing. Document what equipment will be installed (make, model, efficiency, size). Required for proper billing.', NULL, 'Manual J Calculation, Equipment Spec Sheet', 'Before installation', 18),
  (pid, 'Installation', 20, 'Schedule & Perform Work', 'Call customer and schedule installation. Install all approved measures per program specs and BPI standards.', 'Varies by measure type', NULL, 'After approval received', 19),
  (pid, 'Installation', 21, 'Final Inspection', 'Inspect all work to ensure safe conditions and proper installation. Staff must be BPI BA-P certified.', 'BPI Building Analyst Professional (BA-P)', 'Final Inspection Form (Appendix F)', NULL, 20),
  (pid, 'Installation', 22, 'Customer Sign-Off', 'Customer acknowledges work complete by signing Final Inspection Form.', NULL, 'Final Inspection Form (Appendix F)', NULL, 21),
  (pid, 'Closeout', 23, 'Post Photos & Documentation', 'Upload all post-installation photos. Ensure all documentation complete per Photo Checklist.', NULL, 'Documentation and Photo Checklist (Appendix J)', NULL, 22),
  (pid, 'Closeout', 24, 'Customer Education & Survey', 'Educate customer on installed measures. Provide satisfaction survey for customer to mail in.', NULL, 'Customer Satisfaction Survey (Appendix K)', NULL, 23),
  (pid, 'Closeout', 25, 'Submit for Invoicing', 'Enter all final data into RISE. Ensure HVAC billing matches Manual J and approved equipment. Submit for final approval.', NULL, 'All closeout documents, RISE submission', 'Per program calendar', 24),
  (pid, 'QA/QC', 26, 'QA/QC Inspection', 'CMC conducts QA/QC inspections on 5% of projects. New contractors: first 5 inspected (80% pass required). Probation: next 10 inspected (80% pass required).', NULL, 'QAQC Observation Form (Appendix G)', 'Ongoing', 25);

  -- =====================
  -- ELIGIBILITY RULES
  -- =====================

  INSERT INTO program_eligibility_rules (program_id, rule_type, title, description, sort_order) VALUES
  (pid, 'property', 'Single Family Property', 'Properties with fewer than 3 dwelling units. Manufactured homes NOT eligible for retrofits (refer to IHWAP).', 0),
  (pid, 'property', 'Not For Sale or Foreclosure', 'Property must not be for sale, in process of being sold, or in process of legal foreclosure. Receipt of foreclosure notice alone does not disqualify.', 1),
  (pid, 'property', 'Not Vacant or Under Construction', 'Property must be currently occupied. Cannot be under construction/renovation with open walls, major system work, or missing mechanical systems.', 2),
  (pid, 'property', 'Size Check', 'If home >4,500 sq ft, Resource Innovations will confirm income eligibility with customer.', 3),
  (pid, 'customer', 'Active Utility Account', 'Must have active residential account with ComEd, Nicor Gas, Peoples Gas, or North Shore Gas.', 4),
  (pid, 'customer', 'Income Eligible', 'Qualifying household income. Customer attests during intake process.', 5),
  (pid, 'customer', '15-Year Rule', 'Customer eligible to participate in Retrofits program every 15 years.', 6),
  (pid, 'customer', 'ComEd for Electric Measures', 'Must have ComEd account to receive electric savings measures (jointly funded program).', 7),
  (pid, 'prioritization', 'A. SF-Type Configuration', 'In-unit mechanical equipment. Customer has decision-making power over building envelope. Attic and/or basement can be served without impacting other units.', 8),
  (pid, 'prioritization', 'B. No Obvious Deferrable Conditions', 'No blatantly obvious issues exceeding per-home H&S funding: roof leaks, vermiculite, hoarding, active water damage, cracked ceilings, knob and tube wiring, severe disrepair of access points.', 9),
  (pid, 'prioritization', 'C. Attic Opportunity', 'Attic insulation less than 6 inches average. If no hatch: yes if customer willing to have one cut. If no attic: waived. If customer refuses access: no.', 10),
  (pid, 'prioritization', 'D. Basement/Crawlspace Opportunity', 'At least 20% of rim joist accessible and not air sealed. If no basement/crawlspace: waived. If finished basement with crawlspace: yes.', 11),
  (pid, 'compliance', 'Customer Authorization Form (Appendix E)', 'Utility-protected document. Must be signed by customer at time of assessment. Customer MUST receive a copy.', 12),
  (pid, 'compliance', 'Consent and Release / Health & Safety Form (Appendix I)', 'Utility-protected document. Must be signed by customer at time of assessment if any health and safety conditions are present. Customer MUST receive a copy. Used internally as the "Health and Safety Form."', 13),
  (pid, 'compliance', 'Customer Satisfaction Survey (Appendix K)', 'Utility-protected document. Left with customer to mail in.', 14),
  (pid, 'compliance', 'All Utility-Branded Forms', 'Any document bearing ComEd, Nicor Gas, Peoples Gas, or North Shore Gas logos is a utility-owned document. Must be signed by customer where required. Customer must always receive a copy of any signed form.', 15);

  -- =====================
  -- DEFERRAL RULES
  -- =====================

  INSERT INTO program_deferral_rules (program_id, condition_text, sort_order) VALUES
  (pid, 'Customer has health conditions prohibiting insulation/weatherization installation', 0),
  (pid, 'Building structure or mechanical/electrical/plumbing in severe disrepair prohibiting weatherization', 1),
  (pid, 'Sewage or sanitary problems endangering client and installers', 2),
  (pid, 'House condemned or systems red-tagged by officials/utilities', 3),
  (pid, 'Moisture/drainage problems too severe for allowable H&S measures', 4),
  (pid, 'Client is uncooperative, abusive, or threatening to crew', 5),
  (pid, 'Lead-based paint creating additional H&S hazards that cannot be corrected', 6),
  (pid, 'Illegal activities conducted in dwelling', 7),
  (pid, 'Mold/moisture too severe to resolve within H&S limit', 8),
  (pid, 'Areas too cluttered/obstructed for worker access', 9),
  (pid, 'Pest infestation that cannot be removed and poses H&S risk', 10),
  (pid, 'Hazardous products (air pollutants, flammable liquids, VOCs) present', 11),
  (pid, 'Pet prohibiting access or disturbing site visit', 12),
  (pid, 'Property for sale, being sold, or in legal foreclosure', 13),
  (pid, 'Any H&S condition present, created by, or exacerbated by services that cannot be corrected', 14),
  (pid, 'Property is vacant/not currently lived in', 15),
  (pid, 'Property under construction/renovation', 16),
  (pid, 'Customer recording assessment/project work and refuses to stop', 17),
  (pid, 'H&S costs exceed $1,000 (not including exhaust fans or mechanical replacements)', 18);

  -- Done
  SELECT COUNT(*) INTO measure_count FROM program_measures WHERE program_id = pid;
  RAISE NOTICE 'HES IE program seeded: % measures loaded', measure_count;

END $$;
