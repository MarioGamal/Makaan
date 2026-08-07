import { EnvironmentConfig, parseEnvironment } from './environment';

export interface MakaanConfiguration {
  makaan: EnvironmentConfig;
}

/** Typed configuration factory for injection after ConfigModule has validated the environment. */
export function loadConfiguration(): MakaanConfiguration {
  return { makaan: parseEnvironment(process.env) };
}
