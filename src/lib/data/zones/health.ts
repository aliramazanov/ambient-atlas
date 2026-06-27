const ARSENIC =
  "Skin lesions and skin, bladder and lung cancer; cardiovascular and developmental effects.";

const RADON =
  "Lung cancer from elevated indoor radon (the low-dose regional gradient is debated).";

const UV =
  "Melanoma and other skin cancers, plus eye damage (pterygium, cataract).";

const DUST =
  "Respiratory and allergic disease; dust is linked to asthma and meningitis-belt epidemics.";

const FLUOROSIS =
  "Dental mottling and, at higher intake, crippling skeletal fluorosis.";

const KESHAN =
  "Keshan disease, an often-fatal cardiomyopathy from selenium deficiency.";

const KONZO =
  "Konzo: sudden, irreversible spastic paralysis of the legs from cassava cyanide.";

const AFLA =
  "Liver cancer (synergistic with hepatitis B) and links to child stunting.";

const CONFLICT =
  "Death, injury, displacement and collapse of health care and sanitation.";

export const HEALTH: Record<string, string> = {
  ramsar:
    "Possible cancer risk from chronic high natural radiation, though no clear excess is detected.",
  "kerala-monazite":
    "Chronic external gamma exposure; the large local cohort found no significant excess cancer.",
  guarapari:
    "Chronic natural radiation on the beaches; no clear population harm demonstrated.",
  yangjiang:
    "Elevated natural radiation; cohort studies found no increase in cancer mortality.",
  mamuju:
    "Among the highest residential natural radiation doses; long-term effects still under study.",
  altiplano:
    "Chronic hypoxia: high-altitude polycythemia and chronic mountain sickness.",
  tibet:
    "Chronic hypoxia, with an adaptation that keeps chronic mountain sickness low.",
  "ethiopian-highlands":
    "Chronic hypoxia handled by a distinct low-erythrocytosis adaptation.",
  "la-rinconada":
    "Severe chronic hypoxia: excessive erythrocytosis and chronic mountain sickness.",
  cappadocia:
    "Malignant mesothelioma and lung disease from inhaled erionite fibres.",
  biancavilla: "Pleural mesothelioma and plaques from fluoro-edenite fibres.",
  metsovo:
    "Pleural plaques, calcification and mesothelioma from tremolite asbestos.",
  "bengal-arsenic": ARSENIC,
  "chile-arsenic":
    "Lung and bladder cancer persisting decades after exposure; cardiovascular disease.",
  "eafrica-fluoride": FLUOROSIS,
  "keshan-ne": KESHAN,
  "keshan-sw": KESHAN,
  "enshi-selenosis":
    "Selenosis: hair and nail loss, skin and nervous-system lesions.",
  "himalaya-iodine-w":
    "Goiter and, with maternal deficiency, cretinism and impaired development.",
  "alpine-iodine":
    "Endemic goiter and historic cretinism from iodine deficiency.",
  "chaco-arsenic": "HACRE: arsenical skin lesions and skin cancer.",
  "guizhou-fluorosis":
    "Dental and skeletal fluorosis from coal-borne fluoride on food and air.",
  "saharan-source": DUST,
  "saharan-atlantic": DUST,
  "saharan-amazon": DUST,
  "campi-flegrei":
    "Low-level CO2 and H2S exposure, with asphyxiation risk near vents.",
  rotorua:
    "Chronic hydrogen-sulfide exposure; respiratory effects are debated.",
  "asian-dust":
    "Raised respiratory and cardiovascular mortality and asthma during dust events.",
  aralkum:
    "Respiratory disease, cancers and poor maternal and child outcomes from toxic salt-dust.",
  sistan: "Respiratory, cardiovascular and eye disease from extreme dust.",
  "lake-nyos": "Mass asphyxiation from a sudden CO2 release (limnic eruption).",
  "hawaii-vog":
    "Respiratory irritation and asthma aggravation from volcanic SO2 and sulfate.",
  "guam-bmaa":
    "An ALS-Parkinson-dementia complex; the causal link to BMAA is debated.",
  "konzo-drc": KONZO,
  "konzo-moz": KONZO,
  "aflatoxin-wafrica": AFLA,
  "aflatoxin-seasia": AFLA,
  ciguatera:
    "Gastrointestinal, cardiovascular and lasting neurological symptoms.",
  neurolathyrism:
    "Irreversible spastic paraparesis from the grass-pea neurotoxin beta-ODAP.",
  saa: "No demonstrated ground-level human health effect; an open mechanistic question.",
  "lithium-andes":
    "Possible lifelong neuropsychiatric effects of trace lithium; unproven.",
  "photoperiod-nordic":
    "Circadian and sleep disruption; the mood link is contested.",
  "radon-cornwall": RADON,
  "soft-water":
    "A weak, unconfirmed ecological link to cardiovascular mortality.",
  "manganese-bangladesh":
    "Suspected reduced child IQ and neurodevelopmental effects.",
  "geomagnetic-auroral":
    "Claimed cardiovascular and psychiatric effects; weak and contested.",
  "co2-mofette":
    "Asphyxiation in low-lying spots; chronic low-level effects unknown.",
  "high-altitude-uv":
    "Pterygium and cataract; skin-cancer and immune effects remain open.",
  blackfoot:
    "Peripheral vascular gangrene of the feet and arsenic-linked cancers.",
  "balkan-nephropathy":
    "Chronic kidney failure and upper-urinary-tract cancer.",
  "kashin-beck": "A deforming bone-and-joint disease (osteochondropathy).",
  podoconiosis: "Disabling non-infectious leg swelling (elephantiasis).",
  pellagra:
    "The four Ds: dermatitis, diarrhea, dementia and death, from niacin deficiency.",
  "colorado-brown-stain":
    "Dental fluorosis (mottled enamel); higher fluoride causes skeletal fluorosis.",
  "tropical-ataxic":
    "Sensory ataxia, optic atrophy and neuropathy from chronic cassava cyanide.",
  "haff-disease":
    "Acute rhabdomyolysis (muscle breakdown) from an unidentified fish toxin.",
  gabala:
    "Anecdotal birth defects and chronic illness, not rigorously established (non-ionizing RF).",
  skrunda:
    "Reported memory and attention deficits in children; contested (non-ionizing RF).",
  semipalatinsk:
    "Leukemia, solid cancers and congenital malformations from fallout.",
  "nevada-downwinders": "Thyroid cancer and leukemia from iodine-131 fallout.",
  "marshall-islands":
    "Thyroid disease, cancers and birth abnormalities from fallout.",
  maralinga: "Fallout and plutonium exposure; cancers and illness reported.",
  "lop-nur":
    "Claimed excess cancers and fetal damage; local data are state-controlled.",
  mururoa:
    "Thyroid cancer and other fallout effects; exposures were under-reported.",
  mayak: "Dose-related leukemia and solid cancers (the Techa River cohort).",
  hanford:
    "Thyroid disease claimed from iodine-131; the cohort found no clear dose-response.",
  "sellafield-seascale": "A childhood leukaemia cluster of unexplained cause.",
  "santa-susana": "Alleged elevated cancers near the site; disputed.",
  "navajo-churchrock":
    "Miner lung cancer (established); community kidney disease and birth concerns.",
  jadugoda:
    "Reported congenital deformities, stillbirths and cancers; the operator disputes the link.",
  goiania:
    "Acute radiation sickness and deaths, with long-term cancer follow-up.",
  fallujah:
    "Reported congenital birth defects and childhood cancer; causation is contested.",
  "balkan-syndrome":
    "Alleged leukemia and cancer from depleted uranium; field studies found no clear harm.",
  vieques:
    "Reported elevated cancer and respiratory and cardiac disease; the causal link is debated.",
  "australia-uv": UV,
  "punjab-uranium":
    "Alleged kidney damage and birth defects; ecological and confounded.",
  "sri-lanka-ckdu":
    "Chronic kidney disease of unknown cause, leading to fatal renal failure.",
  "mesoamerican-nephropathy":
    "Fatal chronic kidney disease in young farm laborers.",
  chernobyl:
    "Childhood thyroid cancer (established); broader effects contested.",
  fukushima:
    "Thyroid nodules in children, likely a screening effect; genuinely contested.",
  bhopal:
    "Acute and chronic respiratory, ocular and reproductive injury; thousands died.",
  minamata:
    "Methylmercury poisoning: severe neurological damage and birth defects.",
  seveso:
    "Chloracne and, in long-term follow-up, some raised cancer risk from dioxin.",
  enewetak: "Fallout contamination and cancer risk.",
  kiritimati:
    "Reported veteran and islander illness; rigorous local data are limited.",
  "three-mile-island":
    "A small release; official reviews found no clear health impact (disputed).",
  "kuwait-oil-fires":
    "Respiratory effects from months of toxic smoke and soot.",
  "love-canal": "Miscarriages and birth defects linked to chemical seepage.",
  centralia:
    "Carbon-monoxide venting and ground subsidence from an underground coal fire.",
  "nz-uv": UV,
  "punta-arenas-uv":
    "Melanoma and skin and eye damage during ozone-hole UV spikes.",
  wittenoom:
    "Catastrophic mesothelioma and asbestosis from crocidolite (blue asbestos).",
  leadville:
    "High-altitude pulmonary hypertension and pregnancy complications.",
  "lake-kivu":
    "Catastrophic asphyxiation risk from a potential limnic eruption.",
  "iceland-volcanic-gas":
    "Respiratory effects and, historically, mass mortality from volcanic SO2.",
  "owens-lake": "Asthma, COPD and arsenic exposure from playa dust.",
  "mekong-arsenic": ARSENIC,
  "hetao-arsenic": ARSENIC,
  "india-fluorosis": FLUOROSIS,
  "iberia-radon": RADON,
  "fennoscandia-radon": RADON,
  "alaska-photoperiod":
    "Circadian and mood load plus cosmic and radon exposure; poorly isolated.",
  mseleni: "A disabling hip-joint disease of unresolved cause.",
  norilsk:
    "Respiratory disease and reduced life expectancy from smelter SO2 and metals.",
  kabwe: "Severe childhood lead poisoning with neurodevelopmental harm.",
  "la-oroya": "Childhood lead poisoning with SO2 and arsenic exposure.",
  agbogbloshie: "Lead, dioxin and heavy-metal exposure from e-waste burning.",
  dzerzhinsk:
    "Toxic chemical exposure and sharply reduced local life expectancy.",
  "itai-itai":
    "Cadmium-induced osteomalacia (brittle, painful bones) and kidney damage.",
  flint:
    "Raised child blood-lead from corroded pipes, with neurodevelopmental harm.",
  ogoniland: "Benzene-contaminated water and air; respiratory and cancer risk.",
  palomares: "Plutonium contamination with a long-running exposure dispute.",
  tokaimura: "Acute radiation injury (two deaths) and local exposure.",
  "red-river-arsenic": ARSENIC,
  "indus-arsenic": ARSENIC,
  "lagunera-arsenic": ARSENIC,
  "lake-monoun": "Asphyxiation from a sudden CO2 release (limnic eruption).",
  "dieng-co2": "Asphyxiation from cold CO2 outbursts in low ground.",
  "salton-sea":
    "Asthma and respiratory disease from contaminant-laden lakebed dust.",
  "rocky-flats":
    "Plutonium contamination; community cancer claims are disputed.",
  sumgayit:
    "Mercury and organic contamination; elevated cancer and birth-defect reports.",
  picher: "Childhood lead poisoning from mine-waste (chat) dust.",
  hinkley:
    "An alleged cancer cluster from hexavalent chromium; scientifically contested.",
  anniston: "PCB exposure, which is carcinogenic and endocrine-disrupting.",
  karabash:
    "Severe respiratory disease and heavy-metal exposure from copper smelting.",
  linfen:
    "Respiratory disease from heavy coal particulate and sulfur pollution.",
  "radon-us-midwest": RADON,
  "radon-us-appalachia": RADON,
  "radon-us-rockies": RADON,
  "radon-us-newengland": RADON,
  "radon-us-piedmont": RADON,
  "radon-canada-prairies": RADON,
  "radon-erzgebirge": RADON,
  "radon-france": RADON,
  "uv-us-southeast": UV,
  "uv-us-southwest": UV,
  "uv-tropics-africa": UV,
  "saharan-canaries": DUST,
  "conflict-ukraine": CONFLICT,
  "conflict-gaza": CONFLICT,
  "conflict-sudan": CONFLICT,
  "conflict-myanmar": CONFLICT,
  "conflict-sahel": CONFLICT,
  "conflict-drc": CONFLICT,
  "conflict-yemen": CONFLICT,
  "conflict-somalia": CONFLICT,
  "conflict-syria": CONFLICT,
  "conflict-haiti": CONFLICT,
};
