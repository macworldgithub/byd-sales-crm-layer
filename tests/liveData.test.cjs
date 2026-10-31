const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');

test('financial totals preserve recorded zero and expose incomplete amounts', () => {
  const { recordedTotal } = load('lib/liveData.ts');
  assert.equal(recordedTotal([0, 12, 8]), 20);
  assert.equal(recordedTotal([0]), 0);
  assert.equal(recordedTotal([12, null]), null);
  assert.equal(recordedTotal([undefined]), null);
});
function load(file, mocks = {}, globals = {}) {
  const module = { exports: {} };
  const source = ts.transpileModule(
    fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }
  ).outputText;
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    crypto,
    setTimeout() {},
    Date,
    console,
    require(key) {
      return Object.hasOwn(mocks, key) ? mocks[key] : require(key);
    },
    ...globals,
  });
  return module.exports;
}
function provider(overrides = {}) {
  let cursor = 0;
  const cells = [];
  const react = {
    createContext: () => ({ Provider: 'context-provider' }),
    useState(initial) {
      const index = cursor++;
      if (!(index in cells))
        cells[index] = typeof initial === 'function' ? initial() : initial;
      return [
        cells[index],
        (value) => {
          cells[index] =
            typeof value === 'function' ? value(cells[index]) : value;
        },
      ];
    },
    useRef(value) {
      const index = cursor++;
      return (cells[index] ||= { current: value });
    },
    useCallback: (fn) => fn,
    useEffect() {},
    useContext() {},
  };
  const failed = async () => ({
    success: false,
    message: 'Server unavailable',
  });
  const api = {
    customerApi: { createCustomer: failed, getTimeline: failed },
    opportunityApi: { createOpportunity: failed },
    crmMessageApi: { sendSms: failed },
    getLockedSite: () => '',
    getToken: () => '',
    ...overrides,
  };
  const exported = load('lib/crmContext.tsx', {
    react,
    './api': api,
    './dealActions': {},
  });
  return () => {
    cursor = 0;
    return exported.CrmProvider({ children: null }).props.value;
  };
}

test('CRM starts with no business records or impersonated staff identity', () => {
  const context = provider()();
  for (const field of [
    'customers',
    'opportunities',
    'allocations',
    'vyStock',
    'salesLog',
    'deliveryWatch',
    'appointments',
    'auditLog',
    'timelineEvents',
  ])
    assert.equal(context[field].length, 0);
  assert.equal(context.currentUser.id, '');
  assert.equal(context.currentUser.name, '');
  assert.equal(context.isOnline, false);
});

test('failed customer/deal saves and SMS sends do not fabricate records or success notifications', async () => {
  const render = provider();
  let context = render();
  await assert.rejects(
    context.addCustomer({ name: 'Entered customer', site: 'BYD Fairfield' }),
    /Server unavailable/
  );
  await assert.rejects(
    context.addOpportunity({ customer_id: 'existing', site: 'BYD Fairfield' }),
    /Server unavailable/
  );
  assert.equal(
    await context.sendSmsMessage('existing', '0400000000', 'A manual message'),
    false
  );
  context = render();
  assert.equal(context.customers.length, 0);
  assert.equal(context.opportunities.length, 0);
  assert.ok(context.toasts.length >= 3);
  assert.ok(context.toasts.every((toast) => toast.type === 'error'));
});

test('a confirmed customer save displays the server record without a synthetic ID or contact details', async () => {
  const saved = {
    customer_id: 'server-customer',
    name: 'Entered customer',
    site: 'BYD Fairfield',
    phone: '',
    email: '',
  };
  const render = provider({
    customerApi: {
      async createCustomer() {
        return { success: true, data: saved };
      },
    },
  });
  await render().addCustomer({ name: saved.name, site: saved.site });
  assert.deepEqual(render().customers[0], saved);
});

test('templates retain unavailable merge fields and measurements retain genuine zero values', () => {
  const { fillSavedTemplate, measured } = load('lib/liveData.ts');
  assert.equal(
    fillSavedTemplate('Hi {{name}}, {{vehicle}} at {{time}}', {
      name: 'Entered name',
    }),
    'Hi Entered name, {{vehicle}} at {{time}}'
  );
  assert.equal(measured(0, '%'), '0%');
  assert.equal(measured(null), '—');
});

test('production sources contain no bundled sample datasets or one-click credential presets', () => {
  const data = fs.readFileSync(
    path.resolve(__dirname, '../lib/data.ts'),
    'utf8'
  );
  assert.ok(!/INITIAL_|CURRENT_USER|CONSULTANT_SCORES|ALL_USERS/.test(data));
  const login = fs.readFileSync(
    path.resolve(__dirname, '../components/auth/LoginView.tsx'),
    'utf8'
  );
  assert.ok(!/directLogins|BYD2026!Demo|BYD@Admin2024|123456/.test(login));
});
