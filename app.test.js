import { describe, it, expect, beforeEach, vi } from 'vitest';

const DOM = `
  <form id="username-form"><input id="username" required minlength="5"></form>
  <button id="chart-tab"></button>
  <table><tbody id="data-body"></tbody></table>
  <span id="total-income"></span>
  <span id="total-expense"></span>
  <span id="total-net"></span>
  <button id="download-chart"></button>
  <canvas id="chart"></canvas>
`;

let chartInstances;

beforeEach(async () => {
  document.body.innerHTML = DOM;
  chartInstances = [];
  globalThis.Chart = vi.fn(function (canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this.data = config.data;
    this.update = vi.fn();
    this.toBase64Image = vi.fn(() => 'data:image/png;base64,AAAA');
    chartInstances.push(this);
  });
  vi.resetModules();
  await import('./app.js');
});

const input = (month, label) =>
  document.querySelector(`input[aria-label="${label} for ${month}"]`);

function type(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

const rows = () => document.querySelectorAll('#data-body tr');
const text = id => document.getElementById(id).textContent;

describe('renderRows', () => {
  it('renders one row per month with row-scoped headers', () => {
    expect(rows()).toHaveLength(12);
    const th = rows()[0].querySelector('th');
    expect(th.textContent).toBe('January');
    expect(th.getAttribute('scope')).toBe('row');
  });

  it('creates accessible numeric inputs', () => {
    const el = input('March', 'Income');
    expect(el.type).toBe('number');
    expect(el.min).toBe('0');
    expect(el.step).toBe('0.01');
    expect(input('March', 'Expense')).not.toBeNull();
  });

  it('starts with zero totals and net', () => {
    expect(text('total-income')).toMatch(/€\s?0\.00/);
    expect(text('total-expense')).toMatch(/€\s?0\.00/);
    expect(text('total-net')).toMatch(/€\s?0\.00/);
  });
});

describe('input handling', () => {
  it('updates the monthly net and totals', () => {
    type(input('January', 'Income'), '1000');
    type(input('January', 'Expense'), '250.50');
    type(input('February', 'Income'), '500');

    expect(rows()[0].querySelectorAll('td')[2].textContent).toMatch(/€\s?749\.50/);
    expect(text('total-income')).toMatch(/€1,500\.00/);
    expect(text('total-expense')).toMatch(/€250\.50/);
    expect(text('total-net')).toMatch(/€1,249\.50/);
  });

  it('marks negative net values', () => {
    type(input('May', 'Expense'), '40');
    const netCell = rows()[4].querySelectorAll('td')[2];
    expect(netCell.classList.contains('net-negative')).toBe(true);
    expect(document.getElementById('total-net').classList.contains('net-negative')).toBe(true);

    type(input('May', 'Income'), '100');
    expect(netCell.classList.contains('net-negative')).toBe(false);
  });

  it.each(['', 'abc', '-5', '0'])('treats %j as zero', value => {
    type(input('June', 'Income'), '100');
    type(input('June', 'Income'), value);
    expect(text('total-income')).toMatch(/€\s?0\.00/);
  });
});

describe('username form', () => {
  it('adds was-validated on submit', () => {
    const form = document.getElementById('username-form');
    const event = new Event('submit', { cancelable: true });
    form.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(form.classList.contains('was-validated')).toBe(true);
  });
});

describe('chart', () => {
  const showTab = () =>
    document.getElementById('chart-tab').dispatchEvent(new Event('shown.bs.tab'));

  it('is created lazily when the tab is shown', () => {
    expect(chartInstances).toHaveLength(0);
    showTab();
    expect(chartInstances).toHaveLength(1);
    const { config } = chartInstances[0];
    expect(config.type).toBe('bar');
    expect(config.data.labels).toHaveLength(12);
    expect(config.data.labels[0]).toBe('Jan');
  });

  it('reflects entered data and updates instead of recreating', () => {
    type(input('January', 'Income'), '300');
    showTab();
    expect(chartInstances[0].data.datasets[0].data[0]).toBe(300);

    type(input('January', 'Expense'), '120');
    showTab();
    expect(chartInstances).toHaveLength(1);
    expect(chartInstances[0].data.datasets[1].data[0]).toBe(120);
    expect(chartInstances[0].update).toHaveBeenCalled();
  });

  it('formats axis ticks and tooltips in euro', () => {
    showTab();
    const { options } = chartInstances[0].config;
    expect(options.scales.y.ticks.callback(5)).toMatch(/€\s?5\.00/);
    const label = options.plugins.tooltip.callbacks.label({
      dataset: { label: 'Income' },
      parsed: { y: 12.5 },
    });
    expect(label).toMatch(/^Income: €12\.50$/);
  });

  it('does nothing on download before the chart exists', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    document.getElementById('download-chart').click();
    expect(click).not.toHaveBeenCalled();
    click.mockRestore();
  });

  it('downloads the chart as a PNG', () => {
    showTab();
    let link;
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      link = this;
    });
    document.getElementById('download-chart').click();
    expect(link.download).toBe('expense-chart.png');
    expect(link.href).toContain('data:image/png');
    click.mockRestore();
  });
});
