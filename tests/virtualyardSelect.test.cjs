const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const filename = path.resolve(__dirname, '../components/VirtualyardSelect.tsx');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const exported = {};
vm.runInNewContext(compiled, { exports: exported, require });

test('dropdown renders every returned record, including duplicate names and different yards', () => {
  const rows = Array.from({ length: 2000 }, (_, i) => ({ id: String(i + 1), name: 'Demo vehicle', locationId: i % 2 ? '4840' : '4209' }));
  const html = renderToStaticMarkup(React.createElement(exported.VirtualyardSelect, {
    label: 'Demo vehicle', value: '', onChange() {}, rows,
    yardNames: { 4840: 'BYD Fairfield', 4209: 'BYD Melbourne City' },
  }));
  assert.equal((html.match(/<option\b/g) || []).length, rows.length + 1);
  for (const row of rows) assert.ok(html.includes(`value="${row.id}"`));
  assert.ok(html.includes('BYD Fairfield'));
  assert.ok(html.includes('BYD Melbourne City'));
});
