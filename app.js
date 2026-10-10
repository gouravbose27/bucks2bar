const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

const state = MONTHS.map(() => ({ income: 0, expense: 0 }));

const tbody = document.getElementById('data-body');
const netCells = [];
let chart = null;

function parseAmount(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function setNet(cell, net) {
  cell.textContent = eur.format(net);
  cell.classList.toggle('net-negative', net < 0);
}

function updateTotals() {
  const income = state.reduce((s, m) => s + m.income, 0);
  const expense = state.reduce((s, m) => s + m.expense, 0);
  document.getElementById('total-income').textContent = eur.format(income);
  document.getElementById('total-expense').textContent = eur.format(expense);
  setNet(document.getElementById('total-net'), income - expense);
}

function createInput(index, field, label) {
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.step = '0.01';
  input.inputMode = 'decimal';
  input.className = 'form-control form-control-sm amount-input';
  input.placeholder = '0.00';
  input.setAttribute('aria-label', `${label} for ${MONTHS[index]}`);
  input.addEventListener('input', () => {
    state[index][field] = parseAmount(input.value);
    setNet(netCells[index], state[index].income - state[index].expense);
    updateTotals();
  });
  return input;
}

function renderRows() {
  MONTHS.forEach((month, i) => {
    const tr = document.createElement('tr');

    const th = document.createElement('th');
    th.scope = 'row';
    th.className = 'fw-normal';
    th.textContent = month;

    const incomeTd = document.createElement('td');
    incomeTd.appendChild(createInput(i, 'income', 'Income'));

    const expenseTd = document.createElement('td');
    expenseTd.appendChild(createInput(i, 'expense', 'Expense'));

    const netTd = document.createElement('td');
    netTd.className = 'text-end';
    netCells.push(netTd);
    setNet(netTd, 0);

    tr.append(th, incomeTd, expenseTd, netTd);
    tbody.appendChild(tr);
  });
  updateTotals();
}

function renderChart() {
  const incomeData = state.map(m => m.income);
  const expenseData = state.map(m => m.expense);

  if (chart) {
    chart.data.datasets[0].data = incomeData;
    chart.data.datasets[1].data = expenseData;
    chart.update();
    return;
  }

  chart = new Chart(document.getElementById('chart'), {
    type: 'bar',
    data: {
      labels: MONTHS.map(m => m.slice(0, 3)),
      datasets: [
        { label: 'Income', data: incomeData, backgroundColor: 'rgba(25, 135, 84, 0.8)' },
        { label: 'Expense', data: expenseData, backgroundColor: 'rgba(220, 53, 69, 0.8)' },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: value => eur.format(value) },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${eur.format(ctx.parsed.y)}`,
          },
        },
      },
    },
  });
}

renderRows();

const usernameForm = document.getElementById('username-form');
usernameForm.addEventListener('submit', event => {
  event.preventDefault();
  usernameForm.classList.add('was-validated');
});

// Chart is built on tab show because a hidden canvas has zero size.
document.getElementById('chart-tab').addEventListener('shown.bs.tab', renderChart);

document.getElementById('download-chart').addEventListener('click', () => {
  if (!chart) return;
  const link = document.createElement('a');
  link.href = chart.toBase64Image('image/png', 1);
  link.download = 'expense-chart.png';
  link.click();
});
