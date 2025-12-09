import { isSomattosUrl } from '../engines/somattos/somattos.config';
import { isConartesUrl } from '../engines/conartes/conartes.config';
import { isCanopusUrl } from '../engines/canopus/canopus.config';

describe('Scraper URL detection', () => {
  it('detects Somattos URLs', () => {
    expect(isSomattosUrl('https://somattos.com.br/empreendimentos/teste')).toBe(true);
    expect(isSomattosUrl('https://example.com/other')).toBe(false);
  });

  it('detects Conartes URLs', () => {
    expect(isConartesUrl('https://www.conartes.com.br/empreendimento/hakken-residence')).toBe(true);
    expect(isConartesUrl('https://www.conartes.com.br/blog/post')).toBe(false);
  });

  it('detects Canopus URLs', () => {
    expect(isCanopusUrl('https://canopus.com.br/infinity')).toBe(true);
    expect(isCanopusUrl('https://canopus.com.br/wp-content/uploads/file.jpg')).toBe(false);
  });
});
