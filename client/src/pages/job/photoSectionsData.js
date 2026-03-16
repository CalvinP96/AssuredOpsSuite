/* ══════════════════════════════════════════════════════════════
   PHOTO_SECTIONS — master photo checklist for HES jobs.
   Every tab (Assess, Install, HVAC, Photos) uses these IDs
   so photos appear in the correct slot everywhere.
   ══════════════════════════════════════════════════════════════ */

export const PHOTO_SECTIONS = {
  "Home Exterior (Pre)":[{id:"ext_front",l:"Front w/ address",p:"pre"},{id:"ext_damage",l:"Pre-existing damage",p:"pre"},{id:"ext_roof",l:"Roof condition",p:"pre"},{id:"ext_sA",l:"Side A",p:"pre"},{id:"ext_sB",l:"Side B",p:"pre"},{id:"ext_sC",l:"Side C",p:"pre"},{id:"ext_sD",l:"Side D",p:"pre"},{id:"ext_ac",l:"AC Condenser",p:"pre"},{id:"ext_ac_tag",l:"AC Condenser tag",p:"pre"},{id:"ext_vents",l:"Vent terminations",p:"pre"},{id:"ext_gutters",l:"Gutters",p:"pre"}],
  "Attic (Pre)":[{id:"att_pre",l:"Pre insulation (wide)",p:"pre"},{id:"att_bypass",l:"Major bypasses",p:"pre"},{id:"att_baffle",l:"Baffle needs",p:"pre"},{id:"att_exh",l:"Exhaust terminations",p:"pre"},{id:"att_hatch",l:"Hatch",p:"pre"},{id:"att_deck",l:"Roof decking",p:"pre"},{id:"att_dmg",l:"Pre-existing damage",p:"pre"},{id:"att_moist",l:"Moisture/mold",p:"pre"}],
  "Foundation (Pre)":[{id:"fnd_insul",l:"Insulation opps",p:"pre"},{id:"fnd_plumb",l:"Plumbing DI",p:"pre"},{id:"fnd_dmg",l:"Pre-existing damage",p:"pre"},{id:"fnd_frn",l:"FRN w/ venting",p:"pre"},{id:"fnd_hwt",l:"HWT w/ venting",p:"pre"},{id:"fnd_dryer",l:"Dryer vent/cap",p:"pre"},{id:"fnd_moist",l:"Moisture/mold",p:"pre"}],
  "CAZ (Pre)":[{id:"caz_smoke",l:"Smoke/CO detectors",p:"pre"},{id:"caz_dhw",l:"DHW flue + tag",p:"pre"},{id:"caz_furn",l:"Furnace flue + tag",p:"pre"}],
  "Blower Door (Pre)":[{id:"as_setup",l:"BD setup w/ manometer",p:"pre"},{id:"as_pre",l:"Pre CFM50 manometer",p:"pre"},{id:"as_pen",l:"Common penetrations",p:"pre"}],
  "Home Exterior (Post)":[{id:"ext_post_front",l:"Front (post)",p:"post"},{id:"ext_post_vents",l:"Vent terminations (post)",p:"post"},{id:"ext_post_ac",l:"AC Condenser (post)",p:"post"}],
  "Attic (Post)":[{id:"att_post",l:"Post insulation (wide)",p:"post"},{id:"att_post_detail",l:"Insulation detail/depth",p:"post"},{id:"att_post_bypass",l:"Bypasses sealed",p:"post"},{id:"att_post_baffle",l:"Baffles installed",p:"post"},{id:"att_post_hatch",l:"Hatch insulated",p:"post"},{id:"att_post_dam",l:"Fire dams/can lights",p:"post"}],
  "Foundation (Post)":[{id:"fnd_post_insul",l:"Foundation insulation",p:"post"},{id:"fnd_post_rim",l:"Rim joist insulation",p:"post"},{id:"fnd_post_seal",l:"Air sealing",p:"post"}],
  "Air Seal (Post)":[{id:"as_post",l:"Post CFM50 manometer",p:"post"},{id:"as_post_pen",l:"Penetrations sealed",p:"post"},{id:"as_post_detail",l:"Air seal detail",p:"post"}],
  "CAZ (Post)":[{id:"caz_post_smoke",l:"Smoke/CO detectors (post)",p:"post"},{id:"caz_post_flue",l:"Flue connections (post)",p:"post"},{id:"caz_post_vent",l:"Venting (post)",p:"post"}],
  "ASHRAE Fan (Post)":[{id:"fan_box",l:"Specs box w/ model #",p:"post"},{id:"fan_inst",l:"Fan installed",p:"post"},{id:"fan_sw",l:"Switch",p:"post"},{id:"fan_duct",l:"Fan ducting/termination",p:"post"}],
  "New Products (Post)":[{id:"np_hvac",l:"New HVAC w/ tag",p:"post"},{id:"np_furn",l:"New furnace w/ tag",p:"post"},{id:"np_wh",l:"New WH w/ tag",p:"post"},{id:"np_thermo",l:"Smart thermostat",p:"post"},{id:"np_other",l:"Other new product",p:"post"}],
  "Walls (Post)":[{id:"wall_inject",l:"Injection foam holes",p:"post"},{id:"wall_patch",l:"Patched/finished",p:"post"},{id:"wall_knee",l:"Knee wall insulation",p:"post"}],
  "Misc (Post)":[{id:"misc_post1",l:"Additional photo 1",p:"post"},{id:"misc_post2",l:"Additional photo 2",p:"post"},{id:"misc_post3",l:"Additional photo 3",p:"post"}],
  "HVAC \u2014 Furnace":[{id:"hvac_furn_tag",l:"Furnace nameplate/tag",p:"hvac"},{id:"hvac_furn_hx",l:"Heat exchanger",p:"hvac"},{id:"hvac_furn_burner",l:"Burners/flame",p:"hvac"},{id:"hvac_furn_board",l:"Control board",p:"hvac"},{id:"hvac_furn_filter",l:"Filter",p:"hvac"},{id:"hvac_furn_issue",l:"Any issues found",p:"hvac"}],
  "HVAC \u2014 Water Heater":[{id:"hvac_wh_tag",l:"WH nameplate/tag",p:"hvac"},{id:"hvac_wh_cond",l:"WH overall condition",p:"hvac"},{id:"hvac_wh_vent",l:"WH venting",p:"hvac"},{id:"hvac_wh_burner",l:"WH burners",p:"hvac"},{id:"hvac_wh_issue",l:"WH any issues",p:"hvac"}],
  "HVAC \u2014 A/C":[{id:"hvac_ac_tag",l:"Condenser nameplate/tag",p:"hvac"},{id:"hvac_ac_cond",l:"Condenser condition",p:"hvac"},{id:"hvac_ac_elec",l:"Electrical/disconnect",p:"hvac"},{id:"hvac_ac_line",l:"Line set",p:"hvac"},{id:"hvac_ac_evap",l:"Evaporator coil",p:"hvac"},{id:"hvac_ac_issue",l:"A/C any issues",p:"hvac"}],
  "HVAC \u2014 Thermostat":[{id:"hvac_thermo",l:"Thermostat",p:"hvac"}],
  "HVAC Replacement \u2014 Before":[{id:"repl_before_equip",l:"Old equipment (before removal)",p:"repl"},{id:"repl_before_tag",l:"Old equipment nameplate",p:"repl"},{id:"repl_before_area",l:"Install area (before)",p:"repl"}],
  "HVAC Replacement \u2014 Install":[{id:"repl_new_equip",l:"New equipment installed",p:"repl"},{id:"repl_new_tag",l:"New equipment nameplate/tag",p:"repl"},{id:"repl_new_model",l:"New model/serial label",p:"repl"},{id:"repl_new_vent",l:"Venting/flue connections",p:"repl"},{id:"repl_new_gas",l:"Gas line connections",p:"repl"},{id:"repl_new_elec",l:"Electrical connections",p:"repl"},{id:"repl_new_area",l:"Install area (after)",p:"repl"},{id:"repl_new_thermo",l:"Thermostat/controls",p:"repl"}],
  "HVAC Replacement \u2014 Verification":[{id:"repl_permit",l:"Permit/sticker (if applicable)",p:"repl"},{id:"repl_startup",l:"Startup/commissioning readings",p:"repl"},{id:"repl_co_test",l:"CO test after install",p:"repl"},{id:"repl_complete",l:"Completed install overview",p:"repl"}],
};

export const PHASE_LABEL = { pre: 'Pre', post: 'Post', hvac: 'HVAC', repl: 'Replacement' };

/** Filter sections by phase(s) */
export function filterSections(...phases) {
  const set = new Set(phases);
  const result = {};
  for (const [cat, items] of Object.entries(PHOTO_SECTIONS)) {
    const filtered = items.filter(i => set.has(i.p));
    if (filtered.length > 0) result[cat] = filtered;
  }
  return result;
}
