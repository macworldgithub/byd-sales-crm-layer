const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.resolve(__dirname, '../lib/bookingTime.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exported = {};
vm.runInNewContext(compiled, { exports: exported, Date, Intl });
const { melbourneBookingTime } = exported;

test('Melbourne bookings use daylight saving independently of the computer timezone', () => {
  assert.equal(melbourneBookingTime('2026-10-31', '21:00'), '2026-10-31T10:00:00.000Z');
  assert.equal(melbourneBookingTime('2026-07-01', '10:00'), '2026-07-01T00:00:00.000Z');
  assert.equal(melbourneBookingTime('2026-10-31', '00:15'), '2026-10-30T13:15:00.000Z');
});
test('rejects missing and repeated Melbourne daylight-saving hours and invalid dates', () => {
  assert.throws(() => melbourneBookingTime('2026-10-04', '02:30'), /daylight saving/);
  assert.throws(() => melbourneBookingTime('2026-04-05', '02:30'), /daylight saving/);
  assert.throws(() => melbourneBookingTime('2026-02-30', '10:00'));
  assert.throws(() => melbourneBookingTime('', ''));
});
