import { IntegrationProvider } from '@prisma/client';
import { MetricsProvider } from './types';
import { utmfyProvider } from './utmfy';
import { caktoProvider } from './cakto';

// Resolve o client de métricas a partir do enum do banco.
// Fonte principal: UTMfy (consolida gerenciador de anúncios + checkout).
export function getProvider(provider: IntegrationProvider): MetricsProvider {
  switch (provider) {
    case 'UTMFY': return utmfyProvider;
    case 'CAKTO': return caktoProvider;
    default: throw new Error(`Provider sem client: ${provider}`);
  }
}
