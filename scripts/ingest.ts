/**
 * Denmark Crop Nutrients MCP — Data Ingestion Script
 *
 * Populates the SQLite database with Danish agricultural data from:
 * - Landbrugsstyrelsen kvaelstofnormer 2025/26
 * - SEGES Dyrkningsvejledninger
 * - Aarhus Universitet DCA jordbundsklassifikation (JB 1-12)
 * - SEGES / Copenhagen Grain Exchange market prices
 *
 * Usage: npm run ingest
 */

import { createDatabase, type Database } from '../src/db.js';
import { mkdirSync, writeFileSync } from 'fs';

mkdirSync('data', { recursive: true });
const db = createDatabase('data/database.db');

const now = new Date().toISOString().split('T')[0];

// ── Crops ────────────────────────────────────────────────────────────────

interface CropRow {
  id: string;
  name: string;
  crop_group: string;
  typical_yield_t_ha: number;
  nutrient_offtake_n: number;
  nutrient_offtake_p2o5: number;
  nutrient_offtake_k2o: number;
  growth_stages: string;
}

const crops: CropRow[] = [
  { id: 'vinterhvede', name: 'Vinterhvede', crop_group: 'Korn', typical_yield_t_ha: 8.0, nutrient_offtake_n: 22, nutrient_offtake_p2o5: 8, nutrient_offtake_k2o: 5, growth_stages: 'Saaening (sep-okt) | Bestockning (mar) | Strakskydning (apr-maj) | Blomstring (jun) | Modning (jul-aug)' },
  { id: 'vaarbyg', name: 'Vaarbyg', crop_group: 'Korn', typical_yield_t_ha: 6.0, nutrient_offtake_n: 18, nutrient_offtake_p2o5: 8, nutrient_offtake_k2o: 5, growth_stages: 'Saaening (mar-apr) | Bestockning (maj) | Strakskydning (jun) | Modning (jul-aug)' },
  { id: 'vinterbyg', name: 'Vinterbyg', crop_group: 'Korn', typical_yield_t_ha: 7.0, nutrient_offtake_n: 19, nutrient_offtake_p2o5: 8, nutrient_offtake_k2o: 5, growth_stages: 'Saaening (sep) | Bestockning (okt-mar) | Strakskydning (apr-maj) | Modning (jun-jul)' },
  { id: 'vinterrug', name: 'Vinterrug', crop_group: 'Korn', typical_yield_t_ha: 6.5, nutrient_offtake_n: 16, nutrient_offtake_p2o5: 8, nutrient_offtake_k2o: 5, growth_stages: 'Saaening (sep) | Bestockning (okt-mar) | Strakskydning (apr-maj) | Modning (jul-aug)' },
  { id: 'havre', name: 'Havre', crop_group: 'Korn', typical_yield_t_ha: 5.5, nutrient_offtake_n: 17, nutrient_offtake_p2o5: 7.5, nutrient_offtake_k2o: 5, growth_stages: 'Saaening (mar-apr) | Bestockning (maj) | Strakskydning (jun) | Modning (aug)' },
  { id: 'triticale', name: 'Triticale', crop_group: 'Korn', typical_yield_t_ha: 6.5, nutrient_offtake_n: 18, nutrient_offtake_p2o5: 8, nutrient_offtake_k2o: 5, growth_stages: 'Saaening (sep-okt) | Bestockning (mar) | Strakskydning (apr-maj) | Modning (jul-aug)' },
  { id: 'vinterraps', name: 'Vinterraps', crop_group: 'Oliefroe', typical_yield_t_ha: 4.0, nutrient_offtake_n: 35, nutrient_offtake_p2o5: 14, nutrient_offtake_k2o: 10, growth_stages: 'Saaening (aug) | Rosettestadium (okt-mar) | Strakskydning (apr) | Blomstring (maj) | Modning (jul)' },
  { id: 'sukkerroer', name: 'Sukkerroer', crop_group: 'Roer', typical_yield_t_ha: 65.0, nutrient_offtake_n: 1.8, nutrient_offtake_p2o5: 0.8, nutrient_offtake_k2o: 2.5, growth_stages: 'Saaening (apr) | Fremspiring (maj) | Bladvaekst (jun-aug) | Rodvaekst (aug-okt) | Hoest (okt-nov)' },
  { id: 'kartofler-spise', name: 'Kartofler, spisekartofler', crop_group: 'Kartofler', typical_yield_t_ha: 40.0, nutrient_offtake_n: 3.5, nutrient_offtake_p2o5: 1.2, nutrient_offtake_k2o: 5, growth_stages: 'Laegning (apr) | Fremspiring (maj) | Knoldsaetning (jun) | Knoldvaekst (jul-aug) | Hoest (sep)' },
  { id: 'kartofler-stivelse', name: 'Kartofler, stivelseskartofler', crop_group: 'Kartofler', typical_yield_t_ha: 45.0, nutrient_offtake_n: 3, nutrient_offtake_p2o5: 1, nutrient_offtake_k2o: 4.5, growth_stages: 'Laegning (apr) | Fremspiring (maj) | Knoldsaetning (jun) | Knoldvaekst (jul-sep) | Hoest (okt)' },
  { id: 'silomajs', name: 'Silomajs', crop_group: 'Grovfoder', typical_yield_t_ha: 12.0, nutrient_offtake_n: 12, nutrient_offtake_p2o5: 4.5, nutrient_offtake_k2o: 12, growth_stages: 'Saaening (maj) | Fremspiring (maj-jun) | Vaekst (jun-aug) | Blomstring (jul-aug) | Hoest (sep-okt)' },
  { id: 'kloevergraes', name: 'Kloevergraes', crop_group: 'Grovfoder', typical_yield_t_ha: 10.0, nutrient_offtake_n: 25, nutrient_offtake_p2o5: 7, nutrient_offtake_k2o: 25, growth_stages: 'Etablering (foraar/efteraar) | 1. slet (maj-jun) | 2. slet (jul) | 3. slet (aug-sep) | 4. slet (okt)' },
  { id: 'froegraes-rajgraes', name: 'Froegraes, alm. rajgraes', crop_group: 'Froe', typical_yield_t_ha: 1.5, nutrient_offtake_n: 20, nutrient_offtake_p2o5: 8, nutrient_offtake_k2o: 12, growth_stages: 'Etablering (aug) | Overvintring | Strakskydning (maj) | Blomstring (jun) | Hoest (jul)' },
  { id: 'aerter', name: 'Aerter', crop_group: 'Baelgsaed', typical_yield_t_ha: 4.0, nutrient_offtake_n: 38, nutrient_offtake_p2o5: 10, nutrient_offtake_k2o: 12, growth_stages: 'Saaening (mar-apr) | Fremspiring (apr) | Blomstring (jun) | Baelgfyldning (jun-jul) | Modning (jul-aug)' },
  { id: 'hesteboenner', name: 'Hesteboenner', crop_group: 'Baelgsaed', typical_yield_t_ha: 4.0, nutrient_offtake_n: 42, nutrient_offtake_p2o5: 11, nutrient_offtake_k2o: 13, growth_stages: 'Saaening (mar) | Fremspiring (apr) | Blomstring (jun-jul) | Baelgfyldning (jul-aug) | Modning (aug-sep)' },
  { id: 'lucerne', name: 'Lucerne', crop_group: 'Grovfoder', typical_yield_t_ha: 9.0, nutrient_offtake_n: 30, nutrient_offtake_p2o5: 6, nutrient_offtake_k2o: 25, growth_stages: 'Etablering (foraar) | 1. slet (jun) | 2. slet (jul) | 3. slet (aug-sep) | 4. slet (okt)' },
  { id: 'vinterhvede-helsaed', name: 'Vinterhvede til helsaed', crop_group: 'Grovfoder', typical_yield_t_ha: 9.0, nutrient_offtake_n: 15, nutrient_offtake_p2o5: 6, nutrient_offtake_k2o: 15, growth_stages: 'Saaening (sep-okt) | Bestockning (mar) | Strakskydning (apr-maj) | Hoest (jun, maelkemodning)' },
  { id: 'loeg', name: 'Loeg', crop_group: 'Groentsager', typical_yield_t_ha: 50.0, nutrient_offtake_n: 2.5, nutrient_offtake_p2o5: 0.8, nutrient_offtake_k2o: 2, growth_stages: 'Saaening/plantning (mar-apr) | Bladvaekst (maj-jul) | Loegdannelse (jul-aug) | Hoest (aug-sep)' },
  { id: 'guleroedder', name: 'Guleroedder', crop_group: 'Groentsager', typical_yield_t_ha: 60.0, nutrient_offtake_n: 1.5, nutrient_offtake_p2o5: 0.6, nutrient_offtake_k2o: 3, growth_stages: 'Saaening (apr) | Fremspiring (maj) | Rodvaekst (jun-sep) | Hoest (sep-nov)' },
];

const insertCrop = db.instance.prepare(
  `INSERT OR REPLACE INTO crops (id, name, crop_group, typical_yield_t_ha, nutrient_offtake_n, nutrient_offtake_p2o5, nutrient_offtake_k2o, growth_stages, jurisdiction)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DK')`
);

for (const c of crops) {
  insertCrop.run(c.id, c.name, c.crop_group, c.typical_yield_t_ha, c.nutrient_offtake_n, c.nutrient_offtake_p2o5, c.nutrient_offtake_k2o, c.growth_stages);
}
console.log(`Inserted ${crops.length} crops`);

// ── Soil Types (JB 1-12) ────────────────────────────────────────────────

interface SoilRow {
  id: string;
  name: string;
  soil_group: number;
  texture: string;
  drainage_class: string;
  description: string;
}

const soils: SoilRow[] = [
  { id: 'jb1', name: 'JB 1 - Grovsandet jord', soil_group: 1, texture: 'Sand', drainage_class: 'Fri draening', description: 'Grov sandjord med lav vandkapacitet. Typisk for Vest- og Midtjylland. Kvaelstofudvaskning hoej.' },
  { id: 'jb2', name: 'JB 2 - Finsandet jord', soil_group: 1, texture: 'Finsand', drainage_class: 'Fri draening', description: 'Finsandet jord med lidt bedre vandholdningsevne end JB 1. Findes i Midtjylland og Nordjylland.' },
  { id: 'jb3', name: 'JB 3 - Groft lerblandet sandjord', soil_group: 2, texture: 'Lerblandet sand', drainage_class: 'Moderat', description: 'Lerblandet sandjord med moderat naeringstofbinding. Udbredt i Oestjylland.' },
  { id: 'jb4', name: 'JB 4 - Fint lerblandet sandjord', soil_group: 2, texture: 'Lerblandet finsand', drainage_class: 'Moderat', description: 'Finere lerblandet sandjord. God dyrkningsjord med balance mellem draenering og vandholdning.' },
  { id: 'jb5', name: 'JB 5 - Groft sandblandet lerjord', soil_group: 3, texture: 'Sandblandet ler', drainage_class: 'Begraenset', description: 'Sandblandet lerjord med god naeringstofkapacitet. Typisk for Oerne og Oestjylland.' },
  { id: 'jb6', name: 'JB 6 - Fint sandblandet lerjord', soil_group: 3, texture: 'Fint sandblandet ler', drainage_class: 'Begraenset', description: 'Fint sandblandet lerjord med hoej frugtbarhed. Gode kornarealer paa Sjaelland og Lolland-Falster.' },
  { id: 'jb7', name: 'JB 7 - Lerjord', soil_group: 4, texture: 'Ler', drainage_class: 'Daarlig', description: 'Lerjord med hoej naeringstofkapacitet men svaar at bearbejde. Draenering normalt noedvendig.' },
  { id: 'jb8', name: 'JB 8 - Svaer lerjord', soil_group: 4, texture: 'Svaer ler', drainage_class: 'Meget daarlig', description: 'Svaer lerjord. Kraever omhyggelig jordbearbejdning og god draenering. Hoej ydelsespotentiale.' },
  { id: 'jb9', name: 'JB 9 - Meget svaer lerjord', soil_group: 4, texture: 'Meget svaer ler', drainage_class: 'Meget daarlig', description: 'Meget svaer lerjord med over 45% ler. Sjaelden i Danmark, findes lokalt paa Sjaelland.' },
  { id: 'jb10', name: 'JB 10 - Siltjord', soil_group: 3, texture: 'Silt', drainage_class: 'Moderat', description: 'Siltjord med hoej vandholdningsevne. Kan vaere tilboejelig til skorpedannelse.' },
  { id: 'jb11', name: 'JB 11 - Humusjord', soil_group: 5, texture: 'Humus', drainage_class: 'Variabel', description: 'Humusjord (organisk jord) med over 10% organisk stof. Findes i lavbundsarealer og drainerede moser.' },
  { id: 'jb12', name: 'JB 12 - Specielle jordtyper', soil_group: 5, texture: 'Speciel', drainage_class: 'Variabel', description: 'Specielle jordtyper der ikke passer i JB 1-11. Inkluderer bl.a. kalkholdige jorde og vulkansk jord.' },
];

const insertSoil = db.instance.prepare(
  `INSERT OR REPLACE INTO soil_types (id, name, soil_group, texture, drainage_class, description)
   VALUES (?, ?, ?, ?, ?, ?)`
);

for (const s of soils) {
  insertSoil.run(s.id, s.name, s.soil_group, s.texture, s.drainage_class, s.description);
}
console.log(`Inserted ${soils.length} soil types`);

// ── Nutrient Recommendations ────────────────────────────────────────────

interface RecRow {
  crop_id: string;
  soil_group: number;
  sns_index: number | null;
  previous_crop_group: string | null;
  n_rec: number;
  p_rec: number;
  k_rec: number;
  s_rec: number;
  notes: string;
  ref_section: string;
}

const recommendations: RecRow[] = [
  // Vinterhvede
  { crop_id: 'vinterhvede', soil_group: 1, sns_index: null, previous_crop_group: null, n_rec: 140, p_rec: 20, k_rec: 50, s_rec: 20, notes: 'Lette sandjorde. Opdel N-tilfoersel i 2-3 gange for at reducere udvaskning.', ref_section: 'Kvaelstofnormer tabel 1' },
  { crop_id: 'vinterhvede', soil_group: 2, sns_index: null, previous_crop_group: null, n_rec: 160, p_rec: 22, k_rec: 55, s_rec: 18, notes: 'Lerblandet sandjord. Standardnorm for vinterhvede.', ref_section: 'Kvaelstofnormer tabel 1' },
  { crop_id: 'vinterhvede', soil_group: 3, sns_index: null, previous_crop_group: null, n_rec: 175, p_rec: 25, k_rec: 40, s_rec: 15, notes: 'Sandblandet lerjord. Hoejere N-behov, lavere K pga. naturlig K-forsyning fra ler.', ref_section: 'Kvaelstofnormer tabel 1' },
  { crop_id: 'vinterhvede', soil_group: 4, sns_index: null, previous_crop_group: null, n_rec: 180, p_rec: 25, k_rec: 35, s_rec: 12, notes: 'Lerjord. Hoejeste N-norm. K-behovet lavt pga. lermineralers K-frigoerelse.', ref_section: 'Kvaelstofnormer tabel 1' },
  { crop_id: 'vinterhvede', soil_group: 5, sns_index: null, previous_crop_group: null, n_rec: 150, p_rec: 20, k_rec: 45, s_rec: 15, notes: 'Humusjord. N-mineralisering fra organisk stof reducerer N-behov.', ref_section: 'Kvaelstofnormer tabel 1' },

  // Vaarbyg
  { crop_id: 'vaarbyg', soil_group: 1, sns_index: null, previous_crop_group: null, n_rec: 100, p_rec: 18, k_rec: 45, s_rec: 15, notes: 'Let sandjord. Maltbygkvalitet kraever praecis N-styring (maks 11,5% protein).', ref_section: 'Kvaelstofnormer tabel 2' },
  { crop_id: 'vaarbyg', soil_group: 2, sns_index: null, previous_crop_group: null, n_rec: 115, p_rec: 20, k_rec: 50, s_rec: 12, notes: 'Lerblandet sandjord. Standardnorm for maltbyg.', ref_section: 'Kvaelstofnormer tabel 2' },
  { crop_id: 'vaarbyg', soil_group: 3, sns_index: null, previous_crop_group: null, n_rec: 130, p_rec: 22, k_rec: 40, s_rec: 10, notes: 'Sandblandet lerjord. Foderbyg kan goedes hoejere end maltbyg.', ref_section: 'Kvaelstofnormer tabel 2' },
  { crop_id: 'vaarbyg', soil_group: 4, sns_index: null, previous_crop_group: null, n_rec: 140, p_rec: 24, k_rec: 35, s_rec: 8, notes: 'Lerjord. God N-mineralisering. Saerlig opmae paa proteinindhold ved maltbyg.', ref_section: 'Kvaelstofnormer tabel 2' },

  // Vinterbyg
  { crop_id: 'vinterbyg', soil_group: 1, sns_index: null, previous_crop_group: null, n_rec: 120, p_rec: 18, k_rec: 45, s_rec: 18, notes: 'Let sandjord. Tidlig foraarstilfoersel af N vigtigt for bestockning.', ref_section: 'Kvaelstofnormer tabel 3' },
  { crop_id: 'vinterbyg', soil_group: 2, sns_index: null, previous_crop_group: null, n_rec: 140, p_rec: 20, k_rec: 50, s_rec: 15, notes: 'Lerblandet sandjord.', ref_section: 'Kvaelstofnormer tabel 3' },
  { crop_id: 'vinterbyg', soil_group: 3, sns_index: null, previous_crop_group: null, n_rec: 155, p_rec: 22, k_rec: 40, s_rec: 12, notes: 'Sandblandet lerjord.', ref_section: 'Kvaelstofnormer tabel 3' },
  { crop_id: 'vinterbyg', soil_group: 4, sns_index: null, previous_crop_group: null, n_rec: 165, p_rec: 24, k_rec: 35, s_rec: 10, notes: 'Lerjord.', ref_section: 'Kvaelstofnormer tabel 3' },

  // Vinterrug
  { crop_id: 'vinterrug', soil_group: 1, sns_index: null, previous_crop_group: null, n_rec: 110, p_rec: 18, k_rec: 45, s_rec: 15, notes: 'Let sandjord. Rug trives bedre paa lette jorde end hvede.', ref_section: 'Kvaelstofnormer tabel 4' },
  { crop_id: 'vinterrug', soil_group: 2, sns_index: null, previous_crop_group: null, n_rec: 125, p_rec: 20, k_rec: 50, s_rec: 12, notes: 'Lerblandet sandjord.', ref_section: 'Kvaelstofnormer tabel 4' },
  { crop_id: 'vinterrug', soil_group: 3, sns_index: null, previous_crop_group: null, n_rec: 140, p_rec: 22, k_rec: 40, s_rec: 10, notes: 'Sandblandet lerjord.', ref_section: 'Kvaelstofnormer tabel 4' },

  // Havre
  { crop_id: 'havre', soil_group: 1, sns_index: null, previous_crop_group: null, n_rec: 95, p_rec: 16, k_rec: 40, s_rec: 12, notes: 'Let sandjord. Havre er mindre N-kraevenende end hvede.', ref_section: 'Kvaelstofnormer tabel 5' },
  { crop_id: 'havre', soil_group: 2, sns_index: null, previous_crop_group: null, n_rec: 110, p_rec: 18, k_rec: 45, s_rec: 10, notes: 'Lerblandet sandjord.', ref_section: 'Kvaelstofnormer tabel 5' },
  { crop_id: 'havre', soil_group: 3, sns_index: null, previous_crop_group: null, n_rec: 120, p_rec: 20, k_rec: 38, s_rec: 8, notes: 'Sandblandet lerjord.', ref_section: 'Kvaelstofnormer tabel 5' },

  // Triticale
  { crop_id: 'triticale', soil_group: 1, sns_index: null, previous_crop_group: null, n_rec: 115, p_rec: 18, k_rec: 45, s_rec: 16, notes: 'Let sandjord. Triticale taaler lette jorde bedre end hvede.', ref_section: 'Kvaelstofnormer tabel 6' },
  { crop_id: 'triticale', soil_group: 2, sns_index: null, previous_crop_group: null, n_rec: 135, p_rec: 20, k_rec: 50, s_rec: 14, notes: 'Lerblandet sandjord.', ref_section: 'Kvaelstofnormer tabel 6' },
  { crop_id: 'triticale', soil_group: 3, sns_index: null, previous_crop_group: null, n_rec: 150, p_rec: 22, k_rec: 40, s_rec: 11, notes: 'Sandblandet lerjord.', ref_section: 'Kvaelstofnormer tabel 6' },

  // Vinterraps
  { crop_id: 'vinterraps', soil_group: 1, sns_index: null, previous_crop_group: null, n_rec: 140, p_rec: 25, k_rec: 60, s_rec: 30, notes: 'Let sandjord. Raps har hoejt S-behov (30 kg S/ha). Tilfoer S tidligt foraar.', ref_section: 'Kvaelstofnormer tabel 7' },
  { crop_id: 'vinterraps', soil_group: 2, sns_index: null, previous_crop_group: null, n_rec: 160, p_rec: 28, k_rec: 65, s_rec: 30, notes: 'Lerblandet sandjord. Standardnorm.', ref_section: 'Kvaelstofnormer tabel 7' },
  { crop_id: 'vinterraps', soil_group: 3, sns_index: null, previous_crop_group: null, n_rec: 175, p_rec: 30, k_rec: 55, s_rec: 25, notes: 'Sandblandet lerjord. K-behov lavere pga. lerindhold.', ref_section: 'Kvaelstofnormer tabel 7' },
  { crop_id: 'vinterraps', soil_group: 4, sns_index: null, previous_crop_group: null, n_rec: 185, p_rec: 30, k_rec: 50, s_rec: 25, notes: 'Lerjord. Hoejeste N-norm for raps.', ref_section: 'Kvaelstofnormer tabel 7' },

  // Sukkerroer
  { crop_id: 'sukkerroer', soil_group: 2, sns_index: null, previous_crop_group: null, n_rec: 110, p_rec: 28, k_rec: 155, s_rec: 20, notes: 'Lerblandet sandjord. Sukkerroer har hoejt K-behov.', ref_section: 'Kvaelstofnormer tabel 8' },
  { crop_id: 'sukkerroer', soil_group: 3, sns_index: null, previous_crop_group: null, n_rec: 120, p_rec: 30, k_rec: 150, s_rec: 18, notes: 'Sandblandet lerjord. Typisk sukkerroejord paa Lolland-Falster.', ref_section: 'Kvaelstofnormer tabel 8' },
  { crop_id: 'sukkerroer', soil_group: 4, sns_index: null, previous_crop_group: null, n_rec: 130, p_rec: 35, k_rec: 140, s_rec: 15, notes: 'Lerjord. God jord til sukkerroer.', ref_section: 'Kvaelstofnormer tabel 8' },

  // Kartofler (spisekartofler)
  { crop_id: 'kartofler-spise', soil_group: 1, sns_index: null, previous_crop_group: null, n_rec: 120, p_rec: 30, k_rec: 180, s_rec: 15, notes: 'Let sandjord. Kartofler foretraekker let jord. Hoejt K-behov.', ref_section: 'Kvaelstofnormer tabel 9' },
  { crop_id: 'kartofler-spise', soil_group: 2, sns_index: null, previous_crop_group: null, n_rec: 140, p_rec: 35, k_rec: 170, s_rec: 12, notes: 'Lerblandet sandjord. Standardnorm for spisekartofler.', ref_section: 'Kvaelstofnormer tabel 9' },
  { crop_id: 'kartofler-spise', soil_group: 3, sns_index: null, previous_crop_group: null, n_rec: 150, p_rec: 35, k_rec: 160, s_rec: 10, notes: 'Sandblandet lerjord.', ref_section: 'Kvaelstofnormer tabel 9' },

  // Kartofler (stivelseskartofler)
  { crop_id: 'kartofler-stivelse', soil_group: 1, sns_index: null, previous_crop_group: null, n_rec: 110, p_rec: 28, k_rec: 200, s_rec: 15, notes: 'Let sandjord. Stivelseskartofler taaler lavere N for hoejere stivelsesindhold.', ref_section: 'Kvaelstofnormer tabel 10' },
  { crop_id: 'kartofler-stivelse', soil_group: 2, sns_index: null, previous_crop_group: null, n_rec: 130, p_rec: 32, k_rec: 190, s_rec: 12, notes: 'Lerblandet sandjord.', ref_section: 'Kvaelstofnormer tabel 10' },

  // Silomajs
  { crop_id: 'silomajs', soil_group: 1, sns_index: null, previous_crop_group: null, n_rec: 120, p_rec: 25, k_rec: 100, s_rec: 15, notes: 'Let sandjord. Gylle daekker ofte N-behovet i majs.', ref_section: 'Kvaelstofnormer tabel 11' },
  { crop_id: 'silomajs', soil_group: 2, sns_index: null, previous_crop_group: null, n_rec: 140, p_rec: 28, k_rec: 110, s_rec: 12, notes: 'Lerblandet sandjord. Standardnorm for silomajs.', ref_section: 'Kvaelstofnormer tabel 11' },
  { crop_id: 'silomajs', soil_group: 3, sns_index: null, previous_crop_group: null, n_rec: 150, p_rec: 30, k_rec: 100, s_rec: 10, notes: 'Sandblandet lerjord.', ref_section: 'Kvaelstofnormer tabel 11' },

  // Kloevergraes
  { crop_id: 'kloevergraes', soil_group: 1, sns_index: null, previous_crop_group: null, n_rec: 0, p_rec: 25, k_rec: 150, s_rec: 20, notes: 'Alle jordtyper. N-fiksering fra kloever daekker N-behovet. Hoejt K-behov.', ref_section: 'Kvaelstofnormer tabel 12' },
  { crop_id: 'kloevergraes', soil_group: 2, sns_index: null, previous_crop_group: null, n_rec: 0, p_rec: 25, k_rec: 150, s_rec: 18, notes: 'N-fiksering daekker normalt 150-250 kg N/ha/aar ved 30-50% kloeverandel.', ref_section: 'Kvaelstofnormer tabel 12' },
  { crop_id: 'kloevergraes', soil_group: 3, sns_index: null, previous_crop_group: null, n_rec: 0, p_rec: 25, k_rec: 130, s_rec: 15, notes: 'Sandblandet lerjord. K-behov lidt lavere pga. lerindhold.', ref_section: 'Kvaelstofnormer tabel 12' },
  { crop_id: 'kloevergraes', soil_group: 4, sns_index: null, previous_crop_group: null, n_rec: 0, p_rec: 25, k_rec: 120, s_rec: 12, notes: 'Lerjord. Laveste K-behov for kloevergraes.', ref_section: 'Kvaelstofnormer tabel 12' },

  // Lucerne
  { crop_id: 'lucerne', soil_group: 2, sns_index: null, previous_crop_group: null, n_rec: 0, p_rec: 30, k_rec: 160, s_rec: 25, notes: 'Lucerne fikserer 200-350 kg N/ha/aar. Kraever dyb, veldraenet jord.', ref_section: 'Kvaelstofnormer tabel 13' },
  { crop_id: 'lucerne', soil_group: 3, sns_index: null, previous_crop_group: null, n_rec: 0, p_rec: 30, k_rec: 140, s_rec: 20, notes: 'Sandblandet lerjord. God jord for lucerne.', ref_section: 'Kvaelstofnormer tabel 13' },

  // Aerter
  { crop_id: 'aerter', soil_group: 2, sns_index: null, previous_crop_group: null, n_rec: 0, p_rec: 22, k_rec: 50, s_rec: 10, notes: 'Baelgplanter fikserer eget N-behov. Lav K i kerne, mere i halm.', ref_section: 'Kvaelstofnormer tabel 14' },
  { crop_id: 'aerter', soil_group: 3, sns_index: null, previous_crop_group: null, n_rec: 0, p_rec: 22, k_rec: 45, s_rec: 8, notes: 'Sandblandet lerjord.', ref_section: 'Kvaelstofnormer tabel 14' },

  // Hesteboenner
  { crop_id: 'hesteboenner', soil_group: 2, sns_index: null, previous_crop_group: null, n_rec: 0, p_rec: 24, k_rec: 55, s_rec: 12, notes: 'N-fiksering daekker N-behovet. Kraever dyb jord med god vandforsyning.', ref_section: 'Kvaelstofnormer tabel 15' },
  { crop_id: 'hesteboenner', soil_group: 3, sns_index: null, previous_crop_group: null, n_rec: 0, p_rec: 24, k_rec: 50, s_rec: 10, notes: 'Sandblandet lerjord. Velegnede jorde for hesteboenner.', ref_section: 'Kvaelstofnormer tabel 15' },
  { crop_id: 'hesteboenner', soil_group: 4, sns_index: null, previous_crop_group: null, n_rec: 0, p_rec: 24, k_rec: 45, s_rec: 8, notes: 'Lerjord.', ref_section: 'Kvaelstofnormer tabel 15' },

  // Froegraes
  { crop_id: 'froegraes-rajgraes', soil_group: 2, sns_index: null, previous_crop_group: null, n_rec: 130, p_rec: 20, k_rec: 60, s_rec: 15, notes: 'Froeproduktion kraever praecis N-styring for optimal froesaetning.', ref_section: 'Kvaelstofnormer tabel 16' },
  { crop_id: 'froegraes-rajgraes', soil_group: 3, sns_index: null, previous_crop_group: null, n_rec: 145, p_rec: 22, k_rec: 55, s_rec: 12, notes: 'Sandblandet lerjord. Gode jorde for froegraesproduktion.', ref_section: 'Kvaelstofnormer tabel 16' },

  // Vinterhvede til helsaed
  { crop_id: 'vinterhvede-helsaed', soil_group: 1, sns_index: null, previous_crop_group: null, n_rec: 100, p_rec: 18, k_rec: 60, s_rec: 12, notes: 'Hoestes ved maelkemodning. Lavere N-behov end kornhvede.', ref_section: 'Kvaelstofnormer tabel 17' },
  { crop_id: 'vinterhvede-helsaed', soil_group: 2, sns_index: null, previous_crop_group: null, n_rec: 120, p_rec: 20, k_rec: 65, s_rec: 10, notes: 'Lerblandet sandjord.', ref_section: 'Kvaelstofnormer tabel 17' },
  { crop_id: 'vinterhvede-helsaed', soil_group: 3, sns_index: null, previous_crop_group: null, n_rec: 135, p_rec: 22, k_rec: 55, s_rec: 8, notes: 'Sandblandet lerjord.', ref_section: 'Kvaelstofnormer tabel 17' },

  // Loeg
  { crop_id: 'loeg', soil_group: 2, sns_index: null, previous_crop_group: null, n_rec: 100, p_rec: 30, k_rec: 120, s_rec: 20, notes: 'Loeg dyrkes primaert paa let-middel jord. Foelsom overfor N-mangel og S-mangel.', ref_section: 'Kvaelstofnormer tabel 18' },
  { crop_id: 'loeg', soil_group: 3, sns_index: null, previous_crop_group: null, n_rec: 110, p_rec: 32, k_rec: 110, s_rec: 18, notes: 'Sandblandet lerjord.', ref_section: 'Kvaelstofnormer tabel 18' },

  // Guleroedder
  { crop_id: 'guleroedder', soil_group: 1, sns_index: null, previous_crop_group: null, n_rec: 80, p_rec: 25, k_rec: 150, s_rec: 12, notes: 'Let sandjord foretrukket for guleroedder. Lav N for at undgaa forgrening.', ref_section: 'Kvaelstofnormer tabel 19' },
  { crop_id: 'guleroedder', soil_group: 2, sns_index: null, previous_crop_group: null, n_rec: 90, p_rec: 28, k_rec: 140, s_rec: 10, notes: 'Lerblandet sandjord. Standardnorm.', ref_section: 'Kvaelstofnormer tabel 19' },
];

const insertRec = db.instance.prepare(
  `INSERT INTO nutrient_recommendations (crop_id, soil_group, sns_index, previous_crop_group, n_rec_kg_ha, p_rec_kg_ha, k_rec_kg_ha, s_rec_kg_ha, notes, rb209_section, jurisdiction)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DK')`
);

for (const r of recommendations) {
  insertRec.run(r.crop_id, r.soil_group, r.sns_index, r.previous_crop_group, r.n_rec, r.p_rec, r.k_rec, r.s_rec, r.notes, r.ref_section);
}
console.log(`Inserted ${recommendations.length} nutrient recommendations`);

// ── Commodity Prices ────────────────────────────────────────────────────

interface PriceRow {
  crop_id: string;
  market: string;
  price_per_tonne: number;
  price_source: string;
  source: string;
}

const prices: PriceRow[] = [
  { crop_id: 'vinterhvede', market: 'ab gaard', price_per_tonne: 1600, price_source: 'SEGES markedspriser', source: 'SEGES/Copenhagen Grain Exchange' },
  { crop_id: 'vaarbyg', market: 'ab gaard', price_per_tonne: 1500, price_source: 'SEGES markedspriser', source: 'SEGES/Copenhagen Grain Exchange' },
  { crop_id: 'vinterbyg', market: 'ab gaard', price_per_tonne: 1450, price_source: 'SEGES markedspriser', source: 'SEGES/Copenhagen Grain Exchange' },
  { crop_id: 'vinterrug', market: 'ab gaard', price_per_tonne: 1350, price_source: 'SEGES markedspriser', source: 'SEGES/Copenhagen Grain Exchange' },
  { crop_id: 'havre', market: 'ab gaard', price_per_tonne: 1400, price_source: 'SEGES markedspriser', source: 'SEGES/Copenhagen Grain Exchange' },
  { crop_id: 'triticale', market: 'ab gaard', price_per_tonne: 1350, price_source: 'SEGES markedspriser', source: 'SEGES/Copenhagen Grain Exchange' },
  { crop_id: 'vinterraps', market: 'ab gaard', price_per_tonne: 3800, price_source: 'SEGES markedspriser', source: 'SEGES/Copenhagen Grain Exchange' },
  { crop_id: 'sukkerroer', market: 'leveret fabrik', price_per_tonne: 280, price_source: 'Nordic Sugar kontraktpris', source: 'Nordic Sugar / Nordzucker' },
  { crop_id: 'kartofler-spise', market: 'ab gaard', price_per_tonne: 1200, price_source: 'SEGES markedspriser', source: 'SEGES/Kartoffelafgiftsfonden' },
  { crop_id: 'kartofler-stivelse', market: 'leveret fabrik', price_per_tonne: 550, price_source: 'KMC kontraktpris', source: 'KMC (Kartoffelmelcentralen)' },
  { crop_id: 'silomajs', market: 'ab mark', price_per_tonne: 1100, price_source: 'SEGES grovfodervurdering', source: 'SEGES Grovfoder' },
];

const insertPrice = db.instance.prepare(
  `INSERT INTO commodity_prices (crop_id, market, price_per_tonne, currency, price_source, published_date, retrieved_at, source, jurisdiction)
   VALUES (?, ?, ?, 'DKK', ?, ?, ?, ?, 'DK')`
);

for (const p of prices) {
  insertPrice.run(p.crop_id, p.market, p.price_per_tonne, p.price_source, now, now, p.source);
}
console.log(`Inserted ${prices.length} commodity prices`);

// ── FTS5 Search Index ───────────────────────────────────────────────────

// Clear existing index
db.run('DELETE FROM search_index');

// Index crops
for (const c of crops) {
  db.run(
    `INSERT INTO search_index (title, body, crop_group, jurisdiction) VALUES (?, ?, ?, 'DK')`,
    [
      c.name,
      `${c.name} (${c.crop_group}). Typisk udbytte: ${c.typical_yield_t_ha} t/ha. N-bortfoersel: ${c.nutrient_offtake_n} kg/t. P2O5: ${c.nutrient_offtake_p2o5} kg/t. K2O: ${c.nutrient_offtake_k2o} kg/t. ${c.growth_stages}`,
      c.crop_group,
    ]
  );
}

// Index nutrient recommendations
for (const r of recommendations) {
  const crop = crops.find(c => c.id === r.crop_id);
  if (!crop) continue;
  const soilLabel = `jordgruppe ${r.soil_group}`;
  db.run(
    `INSERT INTO search_index (title, body, crop_group, jurisdiction) VALUES (?, ?, ?, 'DK')`,
    [
      `${crop.name} goedningsanbefaling ${soilLabel}`,
      `${crop.name} paa ${soilLabel}: N=${r.n_rec} kg/ha, P=${r.p_rec} kg/ha, K=${r.k_rec} kg/ha, S=${r.s_rec} kg/ha. ${r.notes}`,
      crop.crop_group,
    ]
  );
}

// Index soil types
for (const s of soils) {
  db.run(
    `INSERT INTO search_index (title, body, crop_group, jurisdiction) VALUES (?, ?, ?, 'DK')`,
    [
      s.name,
      `${s.name}: ${s.description} Tekstur: ${s.texture}. Draenering: ${s.drainage_class}. Jordgruppe: ${s.soil_group}.`,
      'Jordklassifikation',
    ]
  );
}

const ftsCount = db.get<{ cnt: number }>('SELECT COUNT(*) as cnt FROM search_index');
console.log(`Built FTS5 search index: ${ftsCount?.cnt ?? 0} entries`);

// ── Metadata ────────────────────────────────────────────────────────────

const metadataEntries: [string, string][] = [
  ['schema_version', '1.0'],
  ['mcp_name', 'Denmark Crop Nutrients MCP'],
  ['jurisdiction', 'DK'],
  ['last_ingest', now],
  ['build_date', now],
  ['data_sources', 'Landbrugsstyrelsen kvaelstofnormer 2025/26, SEGES Dyrkningsvejledninger, Aarhus Universitet DCA jordbundsklassifikation'],
  ['disclaimer', 'Data er baseret paa danske kvaelstofnormer og naeringsstofanbefalinger. Kontakt altid din lokale planteavlskonsulent for raadgivning tilpasset din bedrift.'],
  ['crop_count', String(crops.length)],
  ['soil_type_count', String(soils.length)],
  ['recommendation_count', String(recommendations.length)],
  ['price_count', String(prices.length)],
];

for (const [key, value] of metadataEntries) {
  db.run('INSERT OR REPLACE INTO db_metadata (key, value) VALUES (?, ?)', [key, value]);
}

// ── Coverage JSON ───────────────────────────────────────────────────────

writeFileSync('data/coverage.json', JSON.stringify({
  mcp_name: 'Denmark Crop Nutrients MCP',
  jurisdiction: 'DK',
  build_date: now,
  status: 'populated',
  data_sources: [
    'Landbrugsstyrelsen kvaelstofnormer 2025/26',
    'SEGES Dyrkningsvejledninger',
    'Aarhus Universitet DCA jordbundsklassifikation',
    'SEGES markedspriser / Copenhagen Grain Exchange',
  ],
  stats: {
    crops: crops.length,
    soil_types: soils.length,
    nutrient_recommendations: recommendations.length,
    commodity_prices: prices.length,
    fts_entries: ftsCount?.cnt ?? 0,
  },
  crop_groups: [...new Set(crops.map(c => c.crop_group))].sort(),
  soil_classification_system: 'JB 1-12 (Aarhus Universitet DCA)',
}, null, 2));

db.close();

console.log('');
console.log('Database populated with Danish agricultural data.');
console.log(`  ${crops.length} crops`);
console.log(`  ${soils.length} soil types (JB 1-12)`);
console.log(`  ${recommendations.length} nutrient recommendations`);
console.log(`  ${prices.length} commodity prices`);
console.log(`  ${ftsCount?.cnt ?? 0} FTS5 search index entries`);
