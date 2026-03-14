const { getDb } = require('./database');

/**
 * Ensures the HES IE program exists and is fully seeded with rules.
 * Called automatically on server startup - no manual loading needed.
 */
function ensureHESIEProgram() {
  const db = getDb();

  // Check if HES-IE program already exists
  let program = db.prepare("SELECT * FROM programs WHERE code = ?").get('HES-IE');

  if (!program) {
    // Create the program
    db.prepare(
      "INSERT INTO programs (name, code, description, manager_name, manager_title, status) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(
      'HES IE',
      'HES-IE',
      'Home Energy Savings - Income Eligible. Single family retrofits program per the 2026 HES Retrofits Operations Manual.',
      null, null, 'active'
    );
    program = db.prepare("SELECT * FROM programs WHERE code = ?").get('HES-IE');
    console.log('Created HES IE program (id: ' + program.id + ')');
  }

  const pid = program.id;

  // Check if rules already seeded
  const existing = db.prepare('SELECT COUNT(*) as count FROM program_measures WHERE program_id = ?').get(pid);
  if (existing.count > 0) {
    console.log('HES IE program already seeded (' + existing.count + ' measures)');
    return program;
  }

  console.log('Seeding HES IE program rules...');

  // --- MEASURES ---
  const measuresData = [
    { cat: 'Assessment', name: 'Single Family Assessment', desc: 'Initial home energy assessment by BPI Building Analyst Professional (BA-P). Includes diagnostic testing, data collection, health & safety evaluation, and project scoping.', baseline: 'N/A', eff: 'N/A', install: 'Staff must be BPI Building Analyst Professional (BA-P) certified. Use Energy Audit Data Collection Form. Collect baseline conditions, photos of each eligible measure, general home characteristics (occupants, sq ft, stories, year built, home type).', emergency: 0, sort: 1 },
    { cat: 'Direct Install', name: 'Programmable Thermostat', desc: 'Replace manual thermostat with programmable thermostat capable of 7-day schedule.', baseline: 'Existing thermostat must be functional. Customer requests programmable over advanced.', eff: 'Must have capability to adjust temperature set points according to a 7-day schedule.', install: 'Power shut off at furnace switch. Remove old thermostat carefully (avoid paint/drywall damage). Mercury thermostats disposed per protocol. Install per manufacturer specs. Test furnace and AC functionality (AC not tested if outdoor temp ≤65°F). Program with customer input. Provide tutorial on ENERGY STAR settings. Install backplate if needed.', emergency: 0, sort: 10 },
    { cat: 'Direct Install', name: 'Advanced Thermostat', desc: 'Smart/advanced thermostat for homes with furnace and/or CAC.', baseline: 'Existing thermostat must be functional. Replaces manual or programmable. Boiler homes: only if existing thermostat in poor condition.', eff: 'Must be advanced/smart thermostat with occupancy sensing.', install: 'Screen customer: smartphone not required, Wi-Fi not required but encouraged. Verify HVAC compatibility. Power shut off at furnace switch. Remove old thermostat carefully. Install per manufacturer specs. Test functionality. Program with customer. Provide tutorial on ENERGY STAR settings.', emergency: 0, sort: 11 },
    { cat: 'Insulation', name: 'Attic Insulation', desc: 'Insulate attic to R-49 when existing insulation ≤R-19.', baseline: 'Existing attic insulation rated R-19 or lower.', eff: 'Bring up to R-49.', install: 'Attic must be accessible and free of clutter. H&S issues resolved first. Install per BPI specs. Air sealing must accompany attic insulation. Chimney dams required when insulation contacts chimney. Inspect ceiling integrity: check for cracks, sagging/bowing, fastener type (screws required if nails found), joist spacing ≤16" OC. Consider cellulose weight on poor ceilings (fiberglass alternative). Inspect ceiling fans for secure structural attachment.', emergency: 0, sort: 20 },
    { cat: 'Insulation', name: 'Basement/Crawlspace Wall Insulation', desc: 'Insulate basement or crawlspace walls with minimum R-10.', baseline: 'No existing insulation on basement/crawlspace walls.', eff: 'Minimum R-10.', install: 'Install per BPI specifications.', emergency: 0, sort: 21 },
    { cat: 'Insulation', name: 'Floor Insulation Above Crawlspace', desc: 'Insulate floor above unconditioned crawlspace to minimum R-20.', baseline: 'No existing floor insulation above unconditioned crawlspace.', eff: 'Minimum R-20. If ductwork in crawlspace, thermal boundary = crawlspace walls instead.', install: 'Install per BPI specifications.', emergency: 0, sort: 22 },
    { cat: 'Insulation', name: 'Wall Insulation', desc: 'Insulate walls when no existing insulation or existing is in poor condition.', baseline: 'No existing wall insulation or existing in poor condition.', eff: 'Per BPI standards.', install: 'Install per BPI specifications.', emergency: 0, sort: 23 },
    { cat: 'Insulation', name: 'Wall Insulation (Knee Wall)', desc: 'Insulate attic knee walls and sloped ceiling spaces to R-11+.', baseline: 'No existing effective thermal resistance in cavity.', eff: 'R-11 or greater.', install: 'For attic knee walls and attic spaces with sloped ceilings.', emergency: 0, sort: 24 },
    { cat: 'Insulation', name: 'Rim Joist Insulation', desc: 'Insulate rim/band joist with minimum R-10.', baseline: 'No existing rim joist insulation.', eff: 'Minimum R-10.', install: 'Seal all penetrations in rim joist before insulating.', emergency: 0, sort: 25 },
    { cat: 'Insulation', name: 'Low-e Storm Windows', desc: 'Add storm windows to inoperable single pane windows.', baseline: 'Single pane, inoperable windows.', eff: 'Low-e storm window.', install: 'Measure IGU in sash (W x H x Thickness).', emergency: 0, sort: 26 },
    { cat: 'Insulation', name: 'AC Covers', desc: 'Rigid or flexible insulated cover for indoor side of room AC unit.', baseline: 'Room AC unit (window, sleeve, through-wall, PTAC, PTHP) poorly installed with gaps.', eff: 'Must remain installed throughout winter heating season.', install: 'Rigid cover with foam gaskets to seal edges, or flexible well-insulated cover. For wall-thru/sleeve units removed for heating season: rigid cover fits inside sleeve with foam gaskets.', emergency: 0, sort: 27 },
    { cat: 'Air Sealing & Duct Sealing', name: 'Air Sealing', desc: 'Reduce air infiltration with goal of 25%+ CFM50 reduction.', baseline: 'CFM50 reading ≥110% of conditioned square footage.', eff: 'Goal: 25% or greater overall reduction in CFM50.', install: 'Per BPI specifications. Not completed where unsafe (CAZ issue, indoor air quality concern, improper ventilation, medical conditions). Must be accompanied by proper ventilation (ASHRAE 62.2).', emergency: 0, sort: 30 },
    { cat: 'Air Sealing & Duct Sealing', name: 'Duct Sealing', desc: 'Seal ducts in unconditioned and semi-conditioned spaces using mastic.', baseline: 'Leaky ductwork in unconditioned or semi-conditioned spaces.', eff: 'Must have CFM25 pre/post readings. Seal plenums, main ducts, takeoffs, and boots minimum.', install: 'Use mastic sealant, DuctEZ, or HVAC tape. Measure total leakage at CFM25 before and after with duct blaster. Duct system needing repairs requires sufficient H&S budget.', emergency: 0, sort: 31 },
    { cat: 'Mechanicals', name: 'Gas Furnace Replacement', desc: 'Emergency replacement of gas furnace. Must have ≥95% efficiency. DECISION TREE: Is equipment failed? → If YES → Eligible for Replacement. If NO → Does it pose H&S risk? → If YES → Is it repairable under $950? → If YES → Not Eligible (repair instead). If NO → Eligible for Replacement. If electric resistance heat → Eligible for heat pump replacement regardless.', baseline: 'Equipment failed OR poses H&S risk AND repair cost ≥$950. Electric resistance heat systems always eligible for heat pump replacement.', eff: 'New furnace must be ≥95% efficiency.', install: 'Emergency replacement only. Install by qualified contractor per manufacturer specs and local/regional/state codes. Should not be performed unless accompanying air sealing and insulation measures. Recommended to install after other measures complete. Submit tech report to RI for approval. Complete Manual J for sizing.', emergency: 1, sort: 40 },
    { cat: 'Mechanicals', name: 'Boiler Replacement', desc: 'Emergency replacement of boiler. New boiler efficiency ≥95%. DECISION TREE: Is equipment failed? → If YES → Eligible for Replacement. If NO → Does it pose H&S risk? → If YES → Is it repairable under $700? → If YES → Not Eligible (repair instead). If NO → Eligible for Replacement.', baseline: 'Equipment failed OR poses H&S risk AND repair cost ≥$700.', eff: 'New boiler efficiency ≥95%.', install: 'Emergency replacement only. Install by qualified contractor per manufacturer specs and codes. Submit tech report to RI for approval.', emergency: 1, sort: 41 },
    { cat: 'Mechanicals', name: 'Natural Gas Water Heater Replacement', desc: 'Emergency replacement. Energy factor ≥0.67. DECISION TREE: Is equipment failed? → If YES → Eligible for Replacement. If NO → Does it pose H&S risk? → If YES → Is it repairable under $650? → If YES → Not Eligible (repair instead). If NO → Eligible for Replacement. If electric resistance → Eligible for heat pump WH regardless.', baseline: 'Equipment failed OR poses H&S risk AND repair cost ≥$650. Electric resistance water heaters always eligible for heat pump WH replacement.', eff: 'Energy factor of new water heater must be ≥0.67.', install: 'Emergency replacement only. Install by qualified contractor per manufacturer specs and codes. Submit tech report to RI for approval.', emergency: 1, sort: 42 },
    { cat: 'Mechanicals', name: 'Electric Water Heater Replacement (Heat Pump)', desc: 'Replace electric resistance water heaters with Heat Pump Water Heaters regardless of age/condition. ComEd can replace ANY existing electric HVAC/DHW with heat pumps - does NOT need to be TOS/emergency.', baseline: 'Any existing electric resistance water heater - no age or condition requirement. ComEd funded.', eff: 'Must be Energy Star rated Heat Pump Water Heater.', install: 'Consult homeowner, especially if recently replaced. Provide customer education on heat pump WH routine maintenance. Do not proceed if customer cannot keep up with regular maintenance.', emergency: 0, sort: 43 },
    { cat: 'Mechanicals', name: 'Central Air Conditioner Replacement', desc: 'Emergency replacement. DECISION TREE: Is equipment failed? → If YES → Eligible for Replacement. If NO → Does it pose H&S risk? → If YES → Is it repairable under $190/ton? → If YES → Not Eligible (repair instead). If NO → Eligible for Replacement. Must be ≤SEER 10 and manufactured before 2000.', baseline: 'CAC must be ≤SEER 10 and manufactured before 2000. Equipment failed OR poses H&S risk AND repair cost ≥$190/ton.', eff: 'New CAC must have SEER 2 ≥15.2 (16 SEER equivalent).', install: 'Emergency replacement only. Submit tech report to RI for approval. Complete Manual J for sizing.', emergency: 1, sort: 44 },
    { cat: 'Mechanicals', name: 'Gas Furnace Tune-Up', desc: 'Tune and clean for gas furnaces not serviced in 3+ years. This is the HVAC entry point - HVAC only gets involved if a tune and clean is recommended. Tech produces a tech report complying with IL TRM 2026. If issues are found, the tech report includes recommendations per the Mechanical Decision Tree. If no issues, the tune and clean is complete and billable as-is.', baseline: 'Must not have received tune-up within last 3 years. Not allowed on propane furnaces.', eff: 'Per IL TRM 2026 requirements.', install: 'Measure combustion efficiency. Check/clean blower assembly. Lubricate motor, inspect fan belt. Inspect for gas leaks. Clean burner, adjust. Check ignition/safety systems. Check/clean heat exchanger. Inspect exhaust/flue. Inspect control box/wiring. Check air filter. Inspect ductwork. Measure temperature rise. Check volts/amps. Check thermostat operation. Perform CO test and adjust. Produce tech report per IL TRM 2026. If issues found, apply Mechanical Decision Tree (Appendix H) and include replacement recommendations in tech report.', emergency: 0, sort: 45 },
    { cat: 'Mechanicals', name: 'Boiler Tune-Up', desc: 'Tune and clean for boilers not serviced in 3+ years. This is the HVAC entry point - HVAC only gets involved if a tune and clean is recommended. Tech produces a tech report complying with IL TRM 2026. If issues are found, the tech report includes recommendations per the Mechanical Decision Tree. If no issues, the tune and clean is complete and billable as-is.', baseline: 'Must not have received tune-up within last 3 years.', eff: 'Per IL TRM 2026 requirements.', install: 'Measure combustion efficiency. Adjust airflow/stack temps. Adjust burner and gas input. Check venting, piping insulation, safety controls, combustion air. Clean fireside surfaces. Inspect refractory, gaskets, doors. Clean water cut-off controls. Flush boiler. Clean burner and pilot. Check electrode. Clean damper/blower. Check motor starter contacts. Perform flame safeguard checks. Troubleshoot problems. Produce tech report per IL TRM 2026. If issues found, apply Mechanical Decision Tree (Appendix H) and include replacement recommendations in tech report.', emergency: 0, sort: 46 },
    { cat: 'Mechanicals', name: 'Room Air Conditioner Replacement', desc: 'Emergency replacement of nonfunctional room AC. DECISION TREE: Is equipment failed? → If YES → Eligible for Replacement. If NO → Not Eligible.', baseline: 'Room AC must be nonfunctional (failed). Simple pass/fail - no repair threshold.', eff: 'Replace with Energy Star efficiency.', install: 'Emergency replacement only.', emergency: 1, sort: 47 },
    { cat: 'Mechanicals', name: 'EC Motors', desc: 'Electronically commutated motor for older but running HVAC systems.', baseline: 'System is older but running well.', eff: 'Static pressure taken to ensure system functioning as specified.', install: 'Take static pressure reading before and after.', emergency: 0, sort: 48 },
    { cat: 'Health & Safety', name: 'Kitchen Exhaust Fan', desc: 'Install per ASHRAE 62.2 mechanical ventilation requirements.', baseline: 'As required to meet ASHRAE 62.2 ventilation rates.', eff: 'Meet required ventilation rates plus spot ventilation for moisture.', install: 'Install minimum fans needed. Use existing exterior exhaust runs where possible. ASHRAE 62.2 allows whole-house ventilation to cover spot deficiencies. Upload RedCalc screenshot to RISE. Include basement area in ASHRAE calc. Include fan flow rates on assessment report.', emergency: 0, sort: 50, hsExempt: 1 },
    { cat: 'Health & Safety', name: 'Bathroom Exhaust Fan', desc: 'Install per ASHRAE 62.2 requirements.', baseline: 'As required per ASHRAE 62.2.', eff: 'Meet ASHRAE 62.2 ventilation rates.', install: 'Same requirements as kitchen exhaust fan. Upload RedCalc screenshot to RISE.', emergency: 0, sort: 51, hsExempt: 1 },
    { cat: 'Health & Safety', name: 'Bathroom Exhaust Fan w/ Light', desc: 'Combination exhaust fan with light per ASHRAE 62.2.', baseline: 'As required per ASHRAE 62.2.', eff: 'Meet ASHRAE 62.2 ventilation rates.', install: 'Same requirements as exhaust fans.', emergency: 0, sort: 52, hsExempt: 1 },
    { cat: 'Health & Safety', name: 'Smoke Detector - Change Out', desc: '10-year sealed battery. Replace any battery-operated detector older than 10 years.', baseline: 'Install per local code requirements.', eff: 'UL 217 listed.', install: 'Use 10-year sealed battery. Replace any battery-operated smoke detector older than 10 years per 2023 law.', emergency: 0, sort: 53 },
    { cat: 'Health & Safety', name: 'Smoke Detector - Hardwired', desc: 'Hardwired smoke detector per local code.', baseline: 'Install per local code requirements.', eff: 'UL 217 listed.', install: 'Install per code and manufacturer instructions.', emergency: 0, sort: 54 },
    { cat: 'Health & Safety', name: 'CO Detector', desc: 'Carbon monoxide detector per UL 2034.', baseline: 'Install per local code requirements.', eff: 'Must meet Standard UL 2034.', install: 'Install per code and manufacturer instructions.', emergency: 0, sort: 55 },
    { cat: 'Health & Safety', name: 'CO Detector Hardwired', desc: 'Hardwired CO detector.', baseline: 'Per local code.', eff: 'UL 2034.', install: 'Install per code and manufacturer instructions.', emergency: 0, sort: 56 },
    { cat: 'Health & Safety', name: 'CO/Smoke Combo - Hardwired', desc: 'Combination CO and smoke detector, hardwired.', baseline: 'Per local code.', eff: 'UL 217 and UL 2034.', install: 'Install per code and manufacturer instructions.', emergency: 0, sort: 57 },
    { cat: 'Health & Safety', name: 'Dryer Vent Pipe', desc: 'Replace improperly installed or missing dryer/combustion exhaust vent.', baseline: 'Exhaust vent improperly installed or missing.', eff: 'Must terminate outside building shell, never in attic.', install: 'Minimum semi-rigid dryer duct for new dryer vent.', emergency: 0, sort: 58 },
    { cat: 'Health & Safety', name: 'Dryer Vent Termination', desc: 'Proper termination of dryer vent.', baseline: 'Vent not properly terminated outside.', eff: 'Terminate outside building shell.', install: 'Must terminate outside building shell.', emergency: 0, sort: 59 },
    { cat: 'Health & Safety', name: 'Gas Mechanical Repairs', desc: 'Repair existing gas furnace, boiler, or water heater that does not meet replacement guidelines.', baseline: 'Equipment does not meet replacement guidelines and needs operational or H&S repair.', eff: 'N/A.', install: 'Resolve operational issue or health & safety issue. Included in $1,000 H&S cap.', emergency: 0, sort: 60 },
    { cat: 'Health & Safety', name: 'Battery Replacements (9V, AA, AAA)', desc: 'Replace non-functioning batteries in CO detectors.', baseline: 'Existing battery on CO detector not functioning.', eff: 'N/A.', install: 'Replace with appropriate battery.', emergency: 0, sort: 61 },
    { cat: 'Health & Safety', name: 'Exhaust Vent Termination', desc: 'If not associated with fan installation.', baseline: 'Vent not properly terminated.', eff: 'Terminate outside building shell.', install: 'If not associated with installation of a fan.', emergency: 0, sort: 62 },
    { cat: 'Health & Safety', name: 'Miscellaneous H&S', desc: 'Any H&S items outside listed items, case-by-case basis.', baseline: 'Case-by-case. Home should not be deferred without proposing all H&S measures.', eff: 'N/A.', install: 'List measures with associated costs in RISE.', emergency: 0, sort: 63 },
    { cat: 'Health & Safety', name: 'Building Permit Fee', desc: 'Building permit fee associated with the job.', baseline: 'As required by local jurisdiction.', eff: 'N/A.', install: 'Include in list of measures in RISE. Input as Health & Safety measure.', emergency: 0, sort: 64 }
  ];

  measuresData.forEach(m => {
    db.prepare(
      'INSERT INTO program_measures (program_id, category, name, description, baseline_requirements, efficiency_requirements, installation_standards, is_emergency_only, h_and_s_cap_exempt, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(pid, m.cat, m.name, m.desc, m.baseline, m.eff, m.install, m.emergency, m.hsExempt || 0, m.sort);
  });

  const measureIds = {};
  db.prepare('SELECT id, name FROM program_measures WHERE program_id = ?').all(pid).forEach(row => {
    measureIds[row.name] = row.id;
  });

  // --- PHOTO REQUIREMENTS ---
  const photoReqs = [
    { measure: 'Single Family Assessment', photos: [
      'Front of home with address', 'Pre-existing damage (exterior)', 'Roof overall condition', '3 other sides of home',
      'AC Condenser', 'AC Condenser data tag', 'Vent terminations (exterior)', 'Gutters (downspouts, elbows, extensions)',
      'Foundation insulation opportunities (exterior wall/rim joist/crawl wall/ceiling)', 'Plumbing DI retrofits',
      'Pre-existing damage (foundation)', 'Furnace with venting', 'Water heater with venting',
      'Dryer vent/termination/cap', 'Bulk moisture/mold (foundation)',
      'Existing attic insulation (wide angle, full attic)', 'Major bypasses', 'Baffle needs (soffit or fire dam)',
      'Exhaust terminations (attic)', 'Attic hatch', 'Roof decking condition', 'Pre-existing damage (attic)', 'Bulk moisture/mold (attic)',
      'Smoke/CO detectors', 'DHW flue pipes configuration/exhaust terminations', 'Water heater data tag',
      'Furnace flue configuration/exhaust terminations', 'Furnace data tag',
      'Top floor insulation opportunities (exterior wall/knee wall)', 'Top floor plumbing DI retrofits', 'Pre-existing damage (top floor)',
      'Main floor insulation opportunities (exterior wall/knee wall)', 'Main floor plumbing DI retrofits', 'Pre-existing damage (main floor)', 'Existing thermostat'
    ]},
    { measure: 'Programmable Thermostat', photos: ['Existing thermostat (before)', 'New thermostat installed (after)', 'Thermostat programming display'] },
    { measure: 'Advanced Thermostat', photos: ['Existing thermostat (before)', 'New smart thermostat installed (after)', 'Thermostat display/programming'] },
    { measure: 'Attic Insulation', photos: ['Pre insulation (full attic, wide angle)', 'Post insulation (full attic, wide angle)', 'Insulation depth rulers at multiple points (after)', 'Chimney dam installed'] },
    { measure: 'Basement/Crawlspace Wall Insulation', photos: ['Bare walls (before)', 'Completed wall insulation (after)'] },
    { measure: 'Floor Insulation Above Crawlspace', photos: ['Exposed floor (before)', 'Completed floor insulation (after)'] },
    { measure: 'Wall Insulation', photos: ['Wall cavity (before)', 'Drill holes filled/patched (after)'] },
    { measure: 'Wall Insulation (Knee Wall)', photos: ['Knee wall before insulation', 'Knee wall after insulation'] },
    { measure: 'Rim Joist Insulation', photos: ['Exposed rim joist (before)', 'Sealed penetrations', 'Completed rim joist insulation (after)'] },
    { measure: 'Low-e Storm Windows', photos: ['Broken/missing window pane (before)', 'Low-e storm window installed (after)'] },
    { measure: 'AC Covers', photos: ['Pre picture of window unit', 'Post picture of covered unit with foam gaskets or sealed edges'] },
    { measure: 'Air Sealing', photos: ['Blower door setup with manometer', 'Pre CFM50 manometer reading', 'Common penetrations in thermal boundary (top plates, plumbing, drop soffits, duct & flue penetrations)', 'Post CFM50 manometer reading'] },
    { measure: 'Duct Sealing', photos: ['Pre-CFM25 manometer reading (include on assessment report)', 'Mastic/tape on ducts/joints', 'Post-CFM25 manometer reading (include on assessment report)'] },
    { measure: 'Gas Furnace Replacement', photos: ['Existing furnace with data tag (before)', 'New furnace installed with data tag (after)', 'Venting/exhaust connection'] },
    { measure: 'Boiler Replacement', photos: ['Existing boiler with data tag (before)', 'New boiler installed with data tag (after)', 'Venting connections'] },
    { measure: 'Natural Gas Water Heater Replacement', photos: ['Existing water heater with data tag (before)', 'New water heater installed with data tag (after)', 'Venting connection'] },
    { measure: 'Electric Water Heater Replacement (Heat Pump)', photos: ['Existing electric water heater (before)', 'New heat pump water heater installed with data tag (after)', 'Energy Star label'] },
    { measure: 'Central Air Conditioner Replacement', photos: ['Existing CAC with data tag showing SEER and manufacture date (before)', 'New CAC unit installed with data tag (after)'] },
    { measure: 'Gas Furnace Tune-Up', photos: ['Furnace data tag', 'Combustion analyzer readings (before)', 'Combustion analyzer readings (after)'] },
    { measure: 'Boiler Tune-Up', photos: ['Boiler data tag', 'Combustion analyzer readings (before)', 'Combustion analyzer readings (after)'] },
    { measure: 'EC Motors', photos: ['Existing motor with data tag', 'Installed EC motor', 'Replacement part details (data tag or specs)'] },
    { measure: 'Kitchen Exhaust Fan', photos: ['Fan specs on box with model #', 'Fan installed', 'Switch', 'Exterior termination', 'RedCalc screenshot'] },
    { measure: 'Bathroom Exhaust Fan', photos: ['Fan specs on box with model #', 'Fan installed', 'Switch', 'Exterior termination', 'RedCalc screenshot'] },
    { measure: 'Bathroom Exhaust Fan w/ Light', photos: ['Fan specs on box with model #', 'Fan with light installed', 'Switch', 'Exterior termination', 'RedCalc screenshot'] },
    { measure: 'Smoke Detector - Change Out', photos: ['Old detector (before)', 'New detector installed (after)'] },
    { measure: 'Smoke Detector - Hardwired', photos: ['New hardwired detector installed'] },
    { measure: 'CO Detector', photos: ['New CO detector installed'] },
    { measure: 'CO Detector Hardwired', photos: ['New hardwired CO detector installed'] },
    { measure: 'CO/Smoke Combo - Hardwired', photos: ['New combo detector installed'] },
    { measure: 'Dryer Vent Pipe', photos: ['Existing dryer vent condition (before)', 'New dryer vent installed (after)', 'Exterior termination'] },
    { measure: 'Dryer Vent Termination', photos: ['Existing termination (before)', 'New termination installed (after)'] }
  ];

  photoReqs.forEach(pr => {
    const mid = measureIds[pr.measure];
    if (!mid) return;
    pr.photos.forEach((photo, i) => {
      db.prepare('INSERT INTO measure_photo_requirements (measure_id, photo_description, timing, sort_order) VALUES (?, ?, ?, ?)').run(mid, photo, 'both', i);
    });
  });

  // --- PAPERWORK REQUIREMENTS ---
  const paperReqs = [
    { measure: 'Single Family Assessment', docs: [
      'Energy Audit Data Collection Form (Appendix D)',
      'Customer Authorization Form - Signed (Appendix E)',
      'Hazardous Conditions Form if deferral (Appendix I)',
      'Scope of Work - Signed by Customer',
      'All baseline data entered in RISE',
      'LiDAR scan stored in SharePoint',
      'MS Forms assessment checklist completed'
    ]},
    { measure: 'Attic Insulation', docs: ['Pre/post insulation depth measurements in RISE', 'Ceiling inspection notes documented'] },
    { measure: 'Air Sealing', docs: ['Pre/post blower door test results (CFM50) in RISE', 'ASHRAE 62.2 ventilation calculation'] },
    { measure: 'Duct Sealing', docs: ['Pre/post duct blaster results (CFM25) in RISE'] },
    { measure: 'Gas Furnace Replacement', docs: [
      'Mechanical Replacement Decision Tree completed (Appendix H)',
      'Tech report emailed to RI program contacts',
      'RI replacement approval received',
      'Manual J load calculation completed',
      'Equipment sizing documentation',
      'Manufacturer warranty info provided to customer',
      'Sub-contractor estimate/invoice'
    ]},
    { measure: 'Boiler Replacement', docs: [
      'Mechanical Replacement Decision Tree completed (Appendix H)',
      'Tech report emailed to RI program contacts',
      'RI replacement approval received',
      'Manufacturer warranty info provided to customer',
      'Sub-contractor estimate/invoice'
    ]},
    { measure: 'Natural Gas Water Heater Replacement', docs: [
      'Mechanical Replacement Decision Tree completed (Appendix H)',
      'Tech report emailed to RI program contacts',
      'RI replacement approval received',
      'Manufacturer warranty info provided to customer',
      'Sub-contractor estimate/invoice'
    ]},
    { measure: 'Electric Water Heater Replacement (Heat Pump)', docs: [
      'Customer approval to replace documented',
      'Energy Star certification',
      'Maintenance instructions provided to customer',
      'Sub-contractor estimate/invoice'
    ]},
    { measure: 'Central Air Conditioner Replacement', docs: [
      'Mechanical Replacement Decision Tree completed (Appendix H)',
      'Tech report emailed to RI program contacts',
      'RI replacement approval received',
      'Manual J load calculation completed',
      'Existing unit SEER and manufacture date documented',
      'Manufacturer warranty info provided to customer',
      'Sub-contractor estimate/invoice'
    ]},
    { measure: 'Room Air Conditioner Replacement', docs: [
      'Documentation that unit is nonfunctional',
      'Energy Star certification of replacement'
    ]},
    { measure: 'Gas Furnace Tune-Up', docs: ['Tech report compliant with IL TRM 2026', 'Combustion efficiency readings (before/after) in RISE', 'All IL TRM required tune and clean activities documented', 'Mechanical Decision Tree (Appendix H) completed if issues found', 'Replacement recommendation in tech report if decision tree indicates'] },
    { measure: 'Boiler Tune-Up', docs: ['Tech report compliant with IL TRM 2026', 'Combustion efficiency readings (before/after) in RISE', 'All IL TRM required tune and clean activities documented', 'Mechanical Decision Tree (Appendix H) completed if issues found', 'Replacement recommendation in tech report if decision tree indicates'] },
    { measure: 'Kitchen Exhaust Fan', docs: ['RedCalc screenshot uploaded to RISE', 'ASHRAE 62.2 calculation (include basement area)', 'Fan flow rates on assessment report'] },
    { measure: 'Bathroom Exhaust Fan', docs: ['RedCalc screenshot uploaded to RISE', 'ASHRAE 62.2 calculation', 'Fan flow rates on assessment report'] },
    { measure: 'Bathroom Exhaust Fan w/ Light', docs: ['RedCalc screenshot uploaded to RISE', 'ASHRAE 62.2 calculation', 'Fan flow rates on assessment report'] },
    { measure: 'Gas Mechanical Repairs', docs: ['Documentation of repair needed', 'Repair cost within $1,000 H&S cap'] }
  ];

  paperReqs.forEach(pr => {
    const mid = measureIds[pr.measure];
    if (!mid) return;
    pr.docs.forEach((doc, i) => {
      db.prepare('INSERT INTO measure_paperwork_requirements (measure_id, document_name, required, sort_order) VALUES (?, ?, ?, ?)').run(mid, doc, 1, i);
    });
  });

  // --- PROCESS STEPS ---
  const steps = [
    { phase: 'Intake', step: 1, title: 'Leads from RISE', desc: 'Project Coordinator receives leads from RISE every morning and enters them into the system.', cert: null, forms: null, timeline: 'Daily - every morning' },
    { phase: 'Intake', step: 2, title: 'Call & Schedule Assessment', desc: 'Project Coordinator contacts customer to schedule assessment appointment.', cert: null, forms: null, timeline: 'Within 2 business days of lead' },
    { phase: 'Assessment', step: 3, title: 'SLAM LiDAR Scan', desc: 'Assessor performs full SLAM LiDAR scan of home using BLK2GO. Scans stored in SharePoint. LiDAR used to measure the house.', cert: 'BPI Building Analyst Professional (BA-P)', forms: null, timeline: null },
    { phase: 'Assessment', step: 4, title: 'MS Forms Data Collection', desc: 'Fill out MS Forms checklist for items that cannot be captured by LiDAR scan (e.g., nameplate data, equipment conditions, existing insulation depth).', cert: null, forms: 'MS Forms Assessment Checklist', timeline: null },
    { phase: 'Assessment', step: 5, title: 'Required Photos', desc: 'Take all required pre-installation photos per the Documentation and Photo Checklist. Photos of each existing condition and eligible measure area.', cert: null, forms: 'Documentation and Photo Checklist (Appendix J)', timeline: null },
    { phase: 'Assessment', step: 6, title: 'Store LiDAR Scans', desc: 'Upload completed LiDAR scans to SharePoint in proper folder structure.', cert: null, forms: null, timeline: 'Same day as assessment' },
    { phase: 'Assessment', step: 7, title: 'Collect Signatures', desc: 'Customer signs Customer Authorization Form (Appendix E) at time of assessment. If any health and safety conditions are present, customer also signs the Health & Safety Form (Appendix I). Customer receives a copy of all signed forms.', cert: null, forms: 'Customer Authorization Form (Appendix E), Health & Safety Form (Appendix I) if applicable', timeline: 'During assessment' },
    { phase: 'Assessment', step: 8, title: 'Handle Deferrals', desc: 'If deferral needed: cite under Customer Status in RISE, complete Hazardous Conditions Form, present to customer for signature, upload to RISE.', cert: null, forms: 'Hazardous Conditions Form (Appendix I)', timeline: null },
    { phase: 'Scope & Pre-Approval', step: 9, title: 'Create Scope of Work', desc: 'Build scope of work based on program rules and assessment findings. Include all eligible measures identified during assessment.', cert: null, forms: 'Scope of Work', timeline: null },
    { phase: 'Scope & Pre-Approval', step: 10, title: 'Get Scope of Work Signed', desc: 'Customer signs Scope of Work. Customer Authorization and Health & Safety forms should already be signed at assessment.', cert: null, forms: 'Scope of Work - Signed', timeline: null },
    { phase: 'Scope & Pre-Approval', step: 11, title: 'Upload Pre-Pictures', desc: 'Upload all pre-installation photos to RISE as zip folder or Company Cam link. Ensure documents named with address and are legible.', cert: null, forms: null, timeline: null },
    { phase: 'Scope & Pre-Approval', step: 12, title: 'Create Estimate with Program Pricing', desc: 'Create estimate using program pricing for all scoped measures. Upload estimate to RISE.', cert: null, forms: 'Program Estimate', timeline: null },
    { phase: 'Scope & Pre-Approval', step: 13, title: 'Submit for Pre-Approval', desc: 'Submit complete package to RI for pre-approval: signed forms, photos, estimate, all RISE data.', cert: null, forms: 'All pre-approval documents', timeline: 'RI target turnaround: 2 business days' },
    { phase: 'HVAC', step: 14, title: 'Perform Tune & Clean', desc: 'HVAC only gets involved if a tune and clean is recommended during assessment/scoping. Tech performs tune and clean per IL TRM 2026 requirements and produces a tech report. The tech report documents all findings and complies with IL TRM 2026 for tune and cleans in Illinois.', cert: null, forms: 'Tech Report (IL TRM 2026 compliant)', timeline: 'After pre-approval' },
    { phase: 'HVAC', step: 15, title: 'Evaluate Findings & Decision Tree', desc: 'Review tech report findings. If issues are present, apply the Mechanical Replacement Decision Tree (Appendix H) to determine if equipment qualifies for replacement. If no issues are found, the tune and clean is complete and billable - no further HVAC steps needed.', cert: null, forms: 'Mechanical Decision Trees (Appendix H) - only if issues found', timeline: null },
    { phase: 'HVAC', step: 16, title: 'Submit Tech Report for Replacement (If Needed)', desc: 'Only if the decision tree indicates replacement: email tech report with decision tree results and replacement recommendation to RI program contacts for approval.', cert: null, forms: 'Tech Report with replacement recommendation (emailed to RI contacts)', timeline: null },
    { phase: 'HVAC', step: 17, title: 'Receive Replacement Approval', desc: 'RI reviews tech report and approves or denies replacement request. Track approval status.', cert: null, forms: 'Replacement Approval from RI', timeline: null },
    { phase: 'HVAC', step: 18, title: 'Manual J & Equipment Selection', desc: 'Only if replacement approved. Complete Manual J load calculation to determine proper equipment sizing. Document what equipment will be installed (make, model, efficiency, size). Required for proper billing.', cert: null, forms: 'Manual J Calculation, Equipment Spec Sheet', timeline: 'Before installation' },
    { phase: 'Installation', step: 19, title: 'Schedule & Perform Work', desc: 'Call customer and schedule installation. Install all approved measures per program specs and BPI standards.', cert: 'Varies by measure type', forms: null, timeline: 'After approval received' },
    { phase: 'Installation', step: 20, title: 'Final Inspection', desc: 'Inspect all work to ensure safe conditions and proper installation. Staff must be BPI BA-P certified.', cert: 'BPI Building Analyst Professional (BA-P)', forms: 'Final Inspection Form (Appendix F)', timeline: null },
    { phase: 'Installation', step: 21, title: 'Customer Sign-Off', desc: 'Customer acknowledges work complete by signing Final Inspection Form.', cert: null, forms: 'Final Inspection Form (Appendix F)', timeline: null },
    { phase: 'Closeout', step: 22, title: 'Post Photos & Documentation', desc: 'Upload all post-installation photos. Ensure all documentation complete per Photo Checklist.', cert: null, forms: 'Documentation and Photo Checklist (Appendix J)', timeline: null },
    { phase: 'Closeout', step: 23, title: 'Customer Education & Survey', desc: 'Educate customer on installed measures. Provide satisfaction survey for customer to mail in.', cert: null, forms: 'Customer Satisfaction Survey (Appendix K)', timeline: null },
    { phase: 'Closeout', step: 24, title: 'Submit for Invoicing', desc: 'Enter all final data into RISE. Ensure HVAC billing matches Manual J and approved equipment. Submit for final approval.', cert: null, forms: 'All closeout documents, RISE submission', timeline: 'Per program calendar' },
    { phase: 'QA/QC', step: 25, title: 'QA/QC Inspection', desc: 'CMC conducts QA/QC inspections on 5% of projects. New contractors: first 5 inspected (80% pass required). Probation: next 10 inspected (80% pass required).', cert: null, forms: 'QAQC Observation Form (Appendix G)', timeline: 'Ongoing' }
  ];

  steps.forEach((s, i) => {
    db.prepare(
      'INSERT INTO program_process_steps (program_id, phase, step_number, title, description, required_certification, required_forms, timeline, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(pid, s.phase, s.step, s.title, s.desc, s.cert, s.forms, s.timeline, i);
  });

  // --- ELIGIBILITY RULES ---
  const eligibility = [
    { type: 'property', title: 'Single Family Property', desc: 'Properties with fewer than 3 dwelling units. Manufactured homes NOT eligible for retrofits (refer to IHWAP).' },
    { type: 'property', title: 'Not For Sale or Foreclosure', desc: 'Property must not be for sale, in process of being sold, or in process of legal foreclosure. Receipt of foreclosure notice alone does not disqualify.' },
    { type: 'property', title: 'Not Vacant or Under Construction', desc: 'Property must be currently occupied. Cannot be under construction/renovation with open walls, major system work, or missing mechanical systems.' },
    { type: 'property', title: 'Size Check', desc: 'If home >4,500 sq ft, Resource Innovations will confirm income eligibility with customer.' },
    { type: 'customer', title: 'Active Utility Account', desc: 'Must have active residential account with ComEd, Nicor Gas, Peoples Gas, or North Shore Gas.' },
    { type: 'customer', title: 'Income Eligible', desc: 'Qualifying household income. Customer attests during intake process.' },
    { type: 'customer', title: '15-Year Rule', desc: 'Customer eligible to participate in Retrofits program every 15 years.' },
    { type: 'customer', title: 'ComEd for Electric Measures', desc: 'Must have ComEd account to receive electric savings measures (jointly funded program).' },
    { type: 'prioritization', title: 'A. SF-Type Configuration', desc: 'In-unit mechanical equipment. Customer has decision-making power over building envelope. Attic and/or basement can be served without impacting other units.' },
    { type: 'prioritization', title: 'B. No Obvious Deferrable Conditions', desc: 'No blatantly obvious issues exceeding per-home H&S funding: roof leaks, vermiculite, hoarding, active water damage, cracked ceilings, knob and tube wiring, severe disrepair of access points.' },
    { type: 'prioritization', title: 'C. Attic Opportunity', desc: 'Attic insulation less than 6 inches average. If no hatch: yes if customer willing to have one cut. If no attic: waived. If customer refuses access: no.' },
    { type: 'prioritization', title: 'D. Basement/Crawlspace Opportunity', desc: 'At least 20% of rim joist accessible and not air sealed. If no basement/crawlspace: waived. If finished basement with crawlspace: yes.' },
    { type: 'compliance', title: 'Customer Authorization Form (Appendix E)', desc: 'Utility-protected document. Must be signed by customer at time of assessment. Customer MUST receive a copy.' },
    { type: 'compliance', title: 'Consent and Release / Health & Safety Form (Appendix I)', desc: 'Utility-protected document. Must be signed by customer at time of assessment if any health and safety conditions are present. Customer MUST receive a copy. Used internally as the "Health and Safety Form."' },
    { type: 'compliance', title: 'Customer Satisfaction Survey (Appendix K)', desc: 'Utility-protected document. Left with customer to mail in.' },
    { type: 'compliance', title: 'All Utility-Branded Forms', desc: 'Any document bearing ComEd, Nicor Gas, Peoples Gas, or North Shore Gas logos is a utility-owned document. Must be signed by customer where required. Customer must always receive a copy of any signed form.' }
  ];

  eligibility.forEach((e, i) => {
    db.prepare('INSERT INTO program_eligibility_rules (program_id, rule_type, title, description, sort_order) VALUES (?, ?, ?, ?, ?)').run(pid, e.type, e.title, e.desc, i);
  });

  // --- DEFERRAL RULES ---
  const deferrals = [
    'Customer has health conditions prohibiting insulation/weatherization installation',
    'Building structure or mechanical/electrical/plumbing in severe disrepair prohibiting weatherization',
    'Sewage or sanitary problems endangering client and installers',
    'House condemned or systems red-tagged by officials/utilities',
    'Moisture/drainage problems too severe for allowable H&S measures',
    'Client is uncooperative, abusive, or threatening to crew',
    'Lead-based paint creating additional H&S hazards that cannot be corrected',
    'Illegal activities conducted in dwelling',
    'Mold/moisture too severe to resolve within H&S limit',
    'Areas too cluttered/obstructed for worker access',
    'Pest infestation that cannot be removed and poses H&S risk',
    'Hazardous products (air pollutants, flammable liquids, VOCs) present',
    'Pet prohibiting access or disturbing site visit',
    'Property for sale, being sold, or in legal foreclosure',
    'Any H&S condition present, created by, or exacerbated by services that cannot be corrected',
    'Property is vacant/not currently lived in',
    'Property under construction/renovation',
    'Customer recording assessment/project work and refuses to stop',
    'H&S costs exceed $1,000 (not including exhaust fans or mechanical replacements)'
  ];

  deferrals.forEach((d, i) => {
    db.prepare('INSERT INTO program_deferral_rules (program_id, condition_text, sort_order) VALUES (?, ?, ?)').run(pid, d, i);
  });

  const totalMeasures = db.prepare('SELECT COUNT(*) as count FROM program_measures WHERE program_id = ?').get(pid).count;
  console.log('HES IE program seeded: ' + totalMeasures + ' measures loaded');

  return program;
}

module.exports = { ensureHESIEProgram };
