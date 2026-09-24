const insightFilters = [...document.querySelectorAll('[data-insight-filter]')];
const insightCards = [...document.querySelectorAll('[data-insight-card]')];
const insightStatus = document.getElementById('insights-filter-status');

insightFilters.forEach(button => button.addEventListener('click', () => {
  const category = button.dataset.insightFilter;
  let count = 0;
  insightFilters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  insightCards.forEach(card => {
    card.hidden = category !== 'all' && card.dataset.category !== category;
    if (!card.hidden) count++;
  });
  if (insightStatus) insightStatus.textContent = `Showing ${count} ${count === 1 ? 'guide' : 'guides'}.`;
}));
