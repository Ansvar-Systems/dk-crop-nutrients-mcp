export interface Meta {
  disclaimer: string;
  data_age: string;
  source_url: string;
  copyright: string;
  server: string;
  version: string;
}

const DISCLAIMER =
  'Data er baseret paa danske kvaelstofnormer og naeringsstofanbefalinger fra Landbrugsstyrelsen, ' +
  'SEGES og Aarhus Universitet DCA. Kontakt altid din lokale planteavlskonsulent for raadgivning ' +
  'tilpasset din bedrift. This data is for informational purposes only and does not constitute ' +
  'professional agricultural advice.';

export function buildMeta(overrides?: Partial<Meta>): Meta {
  return {
    disclaimer: DISCLAIMER,
    data_age: overrides?.data_age ?? 'unknown',
    source_url: overrides?.source_url ?? 'https://lbst.dk/landbrug/goedning/',
    copyright: 'Data: Landbrugsstyrelsen, SEGES, Aarhus Universitet DCA. Server: Apache-2.0 Ansvar Systems.',
    server: 'dk-crop-nutrients-mcp',
    version: '0.1.0',
    ...overrides,
  };
}

export function buildStalenessWarning(publishedDate: string): string | undefined {
  const published = new Date(publishedDate);
  const now = new Date();
  const daysSincePublished = Math.floor(
    (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSincePublished > 14) {
    return `Price data is ${daysSincePublished} days old (published ${publishedDate}). Check current market rates before making decisions.`;
  }
  return undefined;
}
