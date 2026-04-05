import { buildMeta } from '../metadata.js';
import { SUPPORTED_JURISDICTIONS } from '../jurisdiction.js';

export function handleAbout() {
  return {
    name: 'Denmark Crop Nutrients MCP',
    description:
      'Danish crop nutrient recommendations based on Landbrugsstyrelsen kvaelstofnormer. ' +
      'Provides NPK planning, JB soil classification (1-12), crop requirements, and commodity ' +
      'pricing for Danish agricultural decision-making.',
    version: '0.1.0',
    jurisdiction: [...SUPPORTED_JURISDICTIONS],
    data_sources: [
      'Landbrugsstyrelsen Kvaelstofnormer 2025/26',
      'SEGES Dyrkningsvejledninger',
      'Aarhus Universitet DCA Jordbundsklassifikation',
      'SEGES Markedspriser',
    ],
    tools_count: 10,
    links: {
      homepage: 'https://ansvar.eu/open-agriculture',
      repository: 'https://github.com/ansvar-systems/dk-crop-nutrients-mcp',
      mcp_network: 'https://ansvar.ai/mcp',
    },
    _meta: buildMeta(),
  };
}
