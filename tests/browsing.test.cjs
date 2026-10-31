const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(relative, mocks = {}, globals = {}) {
  const file = path.resolve(__dirname, '..', relative);
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    exports: module.exports,
    module,
    Date,
    Intl,
    TextEncoder,
    AbortController,
    setTimeout,
    clearTimeout,
    require(key) {
      return Object.hasOwn(mocks, key) ? mocks[key] : require(key);
    },
    ...globals,
  });
  return module.exports;
}
const dates = load('lib/calendar.ts');
const hooks = load('lib/useBrowse.ts', { './api': {} });
const plain = (value) => JSON.parse(JSON.stringify(value));

test('month, leap-year, week and day navigation use whole dates independently of browser timezone', () => {
  assert.equal(dates.addMonths('2026-01-31', 1), '2026-02-01');
  assert.equal(dates.addDays('2028-02-28', 1), '2028-02-29');
  assert.deepEqual(plain(dates.calendarRange('2026-10-04', 'week')), {
    from: '2026-09-28',
    to: '2026-10-05',
  });
  assert.deepEqual(plain(dates.calendarRange('2026-10-31', 'day')), {
    from: '2026-10-31',
    to: '2026-11-01',
  });
  assert.deepEqual(plain(dates.calendarRange('2026-12-31', 'list')), {
    from: '2026-12-01',
    to: '2027-01-01',
  });
  const grid = dates.calendarRange('2026-10-31', 'month');
  assert.equal((Date.parse(grid.to) - Date.parse(grid.from)) / 86400000, 42);
});

test('calendar grids and exports read every server page, including records beyond the old first fifty', async () => {
  const calls = [];
  const result = await hooks.readAllPages(async (page) => {
    calls.push(page);
    return {
      success: true,
      data: Array.from(
        { length: page === 3 ? 9 : 100 },
        (_, i) => (page - 1) * 100 + i
      ),
      pagination: { page, total: 209, pages: 3, hasNextPage: page < 3 },
    };
  }, new AbortController().signal);
  assert.deepEqual(calls, [1, 2, 3]);
  assert.equal(result.data.length, 209);
  assert.equal(result.data.at(-1), 208);
});

test('a failed page or cancelled calendar load never returns a partial success', async () => {
  await assert.rejects(
    hooks.readAllPages(
      async (page) =>
        page === 1
          ? {
              success: true,
              data: [1],
              pagination: { page, hasNextPage: true, total: 2 },
            }
          : { success: false, message: 'Server failed' },
      new AbortController().signal
    ),
    /Server failed/
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    hooks.readAllPages(async () => {
      throw new Error('Must not fetch');
    }, controller.signal),
    /cancelled/
  );
  await assert.rejects(
    hooks.readAllPages(
      async (page) => ({
        success: true,
        data: [{ id: 'duplicate' }],
        pagination: { page, total: 2, hasNextPage: page === 1 },
      }),
      new AbortController().signal
    ),
    /Records changed/
  );
});

test('iCalendar export uses real UTC timestamps, escapes notes and folds long UTF-8 lines', () => {
  const ics = dates.calendarIcs([
    {
      id: 'one',
      date: '2026-10-31T13:30:00Z',
      endsAt: '2026-10-31T14:15:00Z',
      title: 'Driver, booking',
      notes: 'Line one\nLine two;' + '車'.repeat(80),
    },
  ]);
  assert.ok(ics.includes('DTSTART:20261031T133000Z'));
  assert.ok(ics.includes('DTEND:20261031T141500Z'));
  assert.ok(ics.includes('SUMMARY:Driver\\, booking'));
  assert.ok(ics.includes('Line one\\nLine two\\;'));
  for (const line of ics.split('\r\n'))
    assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
});

function harness(request) {
  let cursor = 0,
    cells = [],
    effects = [],
    pending = [],
    timers = [];
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in cells))
        cells[i] = typeof initial === 'function' ? initial() : initial;
      return [
        cells[i],
        (value) => {
          cells[i] = typeof value === 'function' ? value(cells[i]) : value;
        },
      ];
    },
    useEffect(callback, dependencies) {
      const i = cursor++;
      if (
        !effects[i] ||
        dependencies.some(
          (value, index) => value !== effects[i].dependencies[index]
        )
      )
        pending.push(() => {
          effects[i]?.cleanup?.();
          effects[i] = { dependencies, cleanup: callback() };
        });
    },
  };
  const loaded = load(
    'lib/useBrowse.ts',
    { react, './api': { browseApi: { list: request } } },
    {
      setTimeout(callback) {
        const timer = { callback };
        timers.push(timer);
        return timer;
      },
      clearTimeout(timer) {
        timer.cancelled = true;
      },
    }
  );
  return {
    hooks: loaded,
    render(callback) {
      cursor = 0;
      const value = callback(loaded);
      pending.splice(0).forEach((effect) => effect());
      return value;
    },
    async flush() {
      const active = timers.splice(0).filter((timer) => !timer.cancelled);
      await Promise.all(active.map((timer) => timer.callback()));
    },
  };
}

test('changing any filter, date/site scope, or page size resets pagination to page one', () => {
  const view = harness();
  let scope = 'All Sites';
  const render = () =>
    view.render((hooks) => hooks.useBrowseQuery({ q: '', stage: '' }, scope));
  let query = render();
  query.setPage(4);
  query = render();
  assert.equal(query.page, 4);
  query.change('q', 'Driver');
  query = render();
  assert.equal(query.page, 1);
  assert.equal(query.filters.q, 'Driver');
  query.setPage(3);
  query = render();
  query.setLimit(50);
  query = render();
  assert.equal(query.page, 1);
  assert.equal(query.limit, 50);
  query.setPage(2);
  query = render();
  scope = 'BYD Fairfield';
  query = render();
  assert.equal(query.page, 1);
});

test('late page-one responses cannot overwrite page two and each page is requested from the server', async () => {
  const deferred = [];
  const view = harness(
    (resource, params, signal) =>
      new Promise((resolve) => deferred.push({ params, signal, resolve }))
  );
  let page = 1;
  const render = () =>
    view.render((hooks) =>
      hooks.useBrowse('opportunities', { browse: true, page, limit: 25 })
    );
  render();
  const first = view.flush();
  page = 2;
  render();
  const second = view.flush();
  assert.equal(deferred[0].signal.aborted, true);
  assert.deepEqual(
    deferred.map((item) => item.params.page),
    [1, 2]
  );
  deferred[1].resolve({
    success: true,
    data: ['page two'],
    pagination: { page: 2 },
  });
  await second;
  deferred[0].resolve({
    success: true,
    data: ['late page one'],
    pagination: { page: 1 },
  });
  await first;
  assert.deepEqual(plain(render().data), ['page two']);
});

test('mark sold accepts a deal from any page and returns only the server-confirmed result', async () => {
  const actions = load('lib/dealActions.ts', {
    './api': { opportunityApi: {} },
  });
  const calls = [];
  const result = await actions.confirmDealSold(
    'deal-from-page-8',
    { sale_type: 'Retail' },
    async (id, payload) => {
      calls.push(id);
      return {
        success: true,
        data: {
          opportunity: { opportunity_id: id, stage: 'Written / Sold' },
          deliverySyncPending: true,
        },
        message: 'Delivery sync pending',
      };
    }
  );
  assert.deepEqual(calls, ['deal-from-page-8']);
  assert.equal(result.opportunity.opportunity_id, 'deal-from-page-8');
  assert.equal(result.message, 'Delivery sync pending');
  await assert.rejects(
    actions.confirmDealSold('deal-from-page-8', {}, async () => ({
      success: false,
      message: 'Order failed',
    })),
    /Order failed/
  );
});
