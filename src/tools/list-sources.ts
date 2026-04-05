import { buildMeta } from '../metadata.js';
import type { Database } from '../db.js';

interface Source {
  name: string;
  authority: string;
  official_url: string;
  retrieval_method: string;
  update_frequency: string;
  license: string;
  coverage: string;
  last_retrieved?: string;
}

export function handleListSources(db: Database): { sources: Source[]; _meta: ReturnType<typeof buildMeta> } {
  const lastIngest = db.get<{ value: string }>('SELECT value FROM db_metadata WHERE key = ?', ['last_ingest']);

  const sources: Source[] = [
    {
      name: 'Landbrugsstyrelsen Kvaelstofnormer 2025/26',
      authority: 'Landbrugsstyrelsen (Danish Agricultural Agency)',
      official_url: 'https://lbst.dk/landbrug/goedning/',
      retrieval_method: 'HTML_SCRAPE',
      update_frequency: 'annual',
      license: 'Danish public sector data (PSI directive)',
      coverage: 'NPK recommendations for all major Danish crops by soil group (JB classification)',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'SEGES Dyrkningsvejledninger',
      authority: 'SEGES Innovation (Landbrug & Foedevarer)',
      official_url: 'https://www.seges.dk/fagomraader/planteavl',
      retrieval_method: 'HTML_SCRAPE',
      update_frequency: 'annual',
      license: 'SEGES proprietary (summarised under fair use)',
      coverage: 'Crop management guides, yield norms, and nutrient offtake data for Danish agriculture',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'Aarhus Universitet DCA Jordbundsklassifikation',
      authority: 'Aarhus Universitet, DCA - Nationalt Center for Foedevarer og Jordbrug',
      official_url: 'https://dca.au.dk/',
      retrieval_method: 'PUBLICATION',
      update_frequency: 'infrequent',
      license: 'Academic publication',
      coverage: 'JB 1-12 soil classification system used in Danish agriculture',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'SEGES Markedspriser / Copenhagen Grain Exchange',
      authority: 'SEGES Innovation / Koebenhavns Kornboers',
      official_url: 'https://www.seges.dk/fagomraader/oekonomi/markedspriser',
      retrieval_method: 'HTML_SCRAPE',
      update_frequency: 'weekly',
      license: 'SEGES proprietary (summarised under fair use)',
      coverage: 'Danish agricultural commodity prices (cereals, oilseeds, root crops)',
      last_retrieved: lastIngest?.value,
    },
  ];

  return {
    sources,
    _meta: buildMeta({ source_url: 'https://lbst.dk/landbrug/goedning/' }),
  };
}
