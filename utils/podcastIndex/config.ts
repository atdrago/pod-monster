import type { IPodcastIndexConfig } from './types';

let _config: IPodcastIndexConfig | null = null;

export function assertConfig(
  name: string,
  config: IPodcastIndexConfig | null = getConfig()
): asserts config is IPodcastIndexConfig {
  if (!config) {
    throw new Error(`
      No config found. Please call \`setConfig\`, or pass a config in as the last
      argument to \`${name}\`.
    `);
  }
}

export function setConfig(config: IPodcastIndexConfig | null = null): void {
  _config = config;
}

export function getConfig(): IPodcastIndexConfig | null {
  return _config ? { ..._config } : null;
}
