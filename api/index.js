import app, { initApp } from '../server/src/index.js';

export default async function handler(req, res) {
  await initApp();
  return app(req, res);
}
