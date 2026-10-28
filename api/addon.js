'use strict';
const { createHandler } = require('../server');
const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const baseUrl = process.env.PUBLIC_URL || (host ? `https://${host}` : undefined);
module.exports = createHandler(baseUrl ? { baseUrl } : undefined);
