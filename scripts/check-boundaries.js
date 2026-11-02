#!/usr/bin/env node
'use strict';

// Architecture boundary check. Rules B1-B4 are specified in
// docs/superpowers/specs/2026-09-21-agent-guardrails-design.md
// Text-based: commented-out import lines may be false positives. Accepted trade-off.
const fs = require('fs');
const path = require('path');

const BANNED_DOMAIN_PACKAGES = ['react-native', 'react-redux', 'axios'];
const IMPORT_RE = /(?:import|export)\s[\s\S]*?from\s*['"]([^'"]+)['"]/g;

function listFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(p));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

// Resolve a specifier to path segments relative to rootDir; null for packages.
function resolveTarget(rootDir, file, spec) {
  if (spec.startsWith('.')) {
    return path
      .relative(rootDir, path.resolve(path.dirname(file), spec))
      .split(path.sep);
  }
  if (spec.startsWith('@/')) {
    return spec.slice(2).split('/');
  }
  return null;
}

function ruleFor(rootDir, file, spec, ctx) {
  const {feature, layer, isBarrel} = ctx;
  const segs = resolveTarget(rootDir, file, spec);
  const target = segs ? segs.join('/') : null;

  if (layer === 'domain') {
    if (!segs && (BANNED_DOMAIN_PACKAGES.includes(spec) || spec.startsWith('@reduxjs/'))) {
      return 'B1';
    }
    if (
      segs &&
      segs[0] === 'features' &&
      (segs[2] === 'data' || segs[2] === 'presentation')
    ) {
      return 'B1';
    }
    if (target === 'core/api/axiosClient') {
      return 'B1';
    }
  }

  if (layer === 'data') {
    if (segs && segs[0] === 'features' && segs[2] === 'presentation') {
      return 'B2';
    }
    if (target === 'core/api/axiosClient' && !/RemoteDataSource\.tsx?$/.test(file)) {
      return 'B2';
    }
  }

  if (layer === 'presentation') {
    if (segs && segs[0] === 'features' && segs[2] === 'data') {
      return 'B3';
    }
    if (target === 'core/api/axiosClient') {
      return 'B3';
    }
  }

  if (isBarrel && segs && segs[0] === 'features' && segs[1] === feature && segs[2] === 'data') {
    return 'B4';
  }

  return null;
}

function checkBoundaries(rootDir) {
  rootDir = path.resolve(rootDir);
  const violations = [];
  for (const file of listFiles(rootDir)) {
    const relFile = path.relative(rootDir, file).split(path.sep).join('/');
    const fm = relFile.match(/^features\/([^/]+)\/(.+)$/);
    if (!fm) {
      continue;
    }
    const ctx = {
      feature: fm[1],
      layer: fm[2].split('/')[0],
      isBarrel: fm[2] === 'index.ts',
    };
    const source = fs.readFileSync(file, 'utf8');
    let m;
    IMPORT_RE.lastIndex = 0;
    while ((m = IMPORT_RE.exec(source)) !== null) {
      const rule = ruleFor(rootDir, file, m[1], ctx);
      if (rule) {
        violations.push({
          file: relFile,
          line: source.slice(0, m.index).split('\n').length,
          rule,
          spec: m[1],
        });
      }
    }
  }
  return violations;
}

module.exports = {checkBoundaries, resolveTarget};

if (require.main === module) {
  const rootDir = process.argv[2] || 'src';
  const violations = checkBoundaries(rootDir);
  for (const v of violations) {
    console.error(`${v.file}:${v.line} [${v.rule}] import '${v.spec}'`);
  }
  process.exit(violations.length > 0 ? 1 : 0);
}
