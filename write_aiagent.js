#!/usr/bin/env node
/**
 * Generates client/src/pages/dashboard/AIAgent.jsx from template.
 * Run: node write_aiagent.js
 */
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'scripts', 'aiagent.template.jsx');
const outPath = path.join(__dirname, 'client', 'src', 'pages', 'dashboard', 'AIAgent.jsx');

if (!fs.existsSync(templatePath)) {
  console.error('Missing template:', templatePath);
  process.exit(1);
}

const source = fs.readFileSync(templatePath, 'utf8');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, source, 'utf8');
console.log(`✓ Wrote ${outPath} (${source.length} bytes)`);
