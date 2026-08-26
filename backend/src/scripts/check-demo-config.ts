import { parseEnvironment } from '../config/environment';

try {
  const environment = parseEnvironment(process.env);
  if (environment.appMode !== 'demo') {
    throw new Error('APP_MODE must be demo.');
  }
  console.log('Hosted demo configuration is valid.');
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  console.error(message);
  process.exitCode = 1;
}
