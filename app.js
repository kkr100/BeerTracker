const STORAGE_KEY = 'hoplog-tastings';
const SESSION_KEY = 'hoplog-current-user';

const starterBeers = [
  { id: 'starter-1', name: 'Foggy Window', brewery: 'North Pier Brewing', style: 'IPA', rating: 4, notes: 'Piney, bright citrus and a clean bitter finish.', date: '2024-08-18', image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=500&q=80' },
  { id: 'starter-2', name: 'Sunroom Pils', brewery: 'Fieldwork Ales', style: 'Lager', rating: 5, notes: 'Crisp as a summer morning. Soft malt, floral hop snap.', date: '2024-08-03', image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=500&q=80' },
  { id: 'starter-3', name: 'Night Shift', brewery: 'Moorland Works', style: 'Stout', rating: 3, notes: 'Dark chocolate, espresso and a whisper of smoke.', date: '2024-07-22', image: 'https://images.unsplash.com/photo-1575367439058-6096bb9cf5e2?auto=format&fit=crop&w=500&q=80' },
  { id: 'starter-4', name: 'Apricot Theory', brewery: 'Low Tide Ferments', style: 'Sour', rating: 4, notes: 'Tart stone fruit with a soft, almost creamy body.', date: '2024-07-09', image: 'https://images.unsplash.com/photo-1559526642-c3f001ea68ee?auto=format&fit=crop&w=500&q=80' }
];

let currentUser = localStorage.getItem(SESSION_KEY) || '';
let beers = loadBeers();
let selectedRating = 0;
let selectedFilter = 'All';
let photoData = '';
let authMode = 'login';

const form = document.querySelector('#beer-form');
const list = document.querySelector('#beer-list');
const emptyState = document.querySelector('#empty-state');
const searchInput = document.querySelector('#search-input');
const sortSelect = document.querySelector('#sort-select');
const photoInput = document.querySelector('#photo');
const photoPreview = document.querySelector('#photo-preview');
const previewImage = document.querySelector('#preview-image');
const ratingValue = document.querySelector('#rating-value');
const authBackdrop = document.querySelector('#auth-backdrop');
const authForm = document.querySelector('#auth-form');
const authEmail = document.querySelector('#auth-email');
const authPassword = document.querySelector('#auth-password');
const authError = document.querySelector('#auth-error');

function loadBeers() {
  const stored = localStorage.getItem(currentUser ? `${STORAGE_KEY}:${currentUser}` : STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  return currentUser ? [] : starterBeers;
}

function saveBeers() {
  localStorage.setItem(currentUser ? `${STORAGE_KEY}:${currentUser}` : STORAGE_KEY, JSON.stringify(beers));
}

function updateAccountButton() {
  const accountButton = document.querySelector('#account-button');
  accountButton.innerHTML = currentUser ? `<span class="account-email">${escapeHtml(currentUser)}</span> <span>Log out</span>` : 'Log in <span>↗</span>';
  accountButton.classList.toggle('logged-in', Boolean(currentUser));
}

function openAuth(mode = 'login') {
  authMode = mode;
  document.querySelector('#auth-title').innerHTML = mode === 'login' ? 'Keep your pours<br><em>in one place.</em>' : 'Start your private<br><em>beer journal.</em>';
  document.querySelector('#auth-subtitle').textContent = mode === 'login' ? 'Log in to see your beer list on this device.' : 'Create an account to keep your tastings separate.';
  document.querySelector('#auth-submit-label').textContent = mode === 'login' ? 'Log in' : 'Create account';
  document.querySelector('#auth-switch-copy').textContent = mode === 'login' ? 'New to Hoplog?' : 'Already have an account?';
  document.querySelector('#auth-switch').textContent = mode === 'login' ? 'Create an account' : 'Log in';
  authError.hidden = true; authBackdrop.hidden = false; authEmail.focus();
}

function closeAuth() {
  authBackdrop.hidden = true; authForm.reset(); authError.hidden = true;
}

function setCurrentUser(email) {
  currentUser = email; localStorage.setItem(SESSION_KEY, email);
  beers = loadBeers(); selectedFilter = 'All'; searchInput.value = ''; updateAccountButton(); render();
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${dateString}T12:00:00`));
}

function stars(rating) {
  return `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`;
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const visibleBeers = beers
    .filter((beer) => selectedFilter === 'All' || beer.style === selectedFilter || (selectedFilter === 'Other' && !['IPA', 'Lager', 'Stout', 'Sour'].includes(beer.style)))
    .filter((beer) => [beer.name, beer.brewery, beer.style, beer.notes].join(' ').toLowerCase().includes(query))
    .sort((first, second) => {
      if (sortSelect.value === 'rating') return second.rating - first.rating;
      if (sortSelect.value === 'name') return first.name.localeCompare(second.name);
      return new Date(second.date) - new Date(first.date);
    });

  list.innerHTML = visibleBeers.map((beer, index) => `
    <article class="beer-card" style="animation-delay: ${index * 55}ms">
      ${beer.image ? `<div class="beer-image"><img src="${beer.image}" alt="Photo of ${escapeHtml(beer.name)}" loading="lazy"></div>` : '<div class="beer-image no-image"><span>✦</span></div>'}
      <div class="beer-info">
        <div>
          <div class="beer-style">${escapeHtml(beer.style)}</div>
          <h3 class="beer-name">${escapeHtml(beer.name)}</h3>
          <p class="brewery">${escapeHtml(beer.brewery || 'Independent brewer')}</p>
        </div>
        ${beer.notes ? `<p class="beer-notes">“${escapeHtml(beer.notes)}”</p>` : ''}
        <div class="card-bottom"><span class="stars" aria-label="${beer.rating} out of 5 stars">${stars(beer.rating)}</span><span class="date">${formatDate(beer.date)}</span><button class="delete-button" data-delete="${beer.id}" aria-label="Delete ${escapeHtml(beer.name)}">×</button></div>
      </div>
    </article>`).join('');

  emptyState.hidden = visibleBeers.length > 0;
  document.querySelector('#visible-count').textContent = visibleBeers.length;
  document.querySelector('#beer-count').textContent = beers.length;
  document.querySelector('#all-count').textContent = beers.length;
  const average = beers.length ? (beers.reduce((sum, beer) => sum + beer.rating, 0) / beers.length).toFixed(1) : '—';
  document.querySelector('#average-rating').textContent = average === '—' ? average : `${average}/5`;
  const styleCounts = beers.reduce((counts, beer) => ({ ...counts, [beer.style]: (counts[beer.style] || 0) + 1 }), {});
  const favorite = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0];
  document.querySelector('#top-style').textContent = favorite ? favorite[0] : '—';

  document.querySelectorAll('.filter-chip').forEach((chip) => {
    const count = beers.filter((beer) => chip.dataset.filter === 'All' || beer.style === chip.dataset.filter).length;
    if (chip.dataset.filter !== 'All' && count === 0) chip.hidden = true;
    else { chip.hidden = false; if (chip.dataset.filter !== 'All') chip.querySelector('span')?.remove(); }
    chip.classList.toggle('active', chip.dataset.filter === selectedFilter);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

document.querySelector('#rating-picker').addEventListener('click', (event) => {
  const button = event.target.closest('.rating-star');
  if (!button) return;
  selectedRating = Number(button.dataset.rating);
  document.querySelectorAll('.rating-star').forEach((star) => star.classList.toggle('selected', Number(star.dataset.rating) <= selectedRating));
  ratingValue.textContent = `${selectedRating} / 5`; ratingValue.style.color = '#e5a847';
});

photoInput.addEventListener('change', () => {
  const file = photoInput.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { photoInput.value = ''; window.alert('That photo is over 5 MB. Please choose a smaller one.'); return; }
  const reader = new FileReader();
  reader.addEventListener('load', () => { photoData = reader.result; previewImage.src = photoData; photoPreview.hidden = false; });
  reader.readAsDataURL(file);
});

document.querySelector('#remove-photo').addEventListener('click', () => { photoData = ''; photoInput.value = ''; photoPreview.hidden = true; previewImage.removeAttribute('src'); });

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!currentUser) {
    openAuth('login');
    authError.textContent = 'Log in to save a tasting to your private journal.';
    authError.hidden = false;
    return;
  }
  const data = new FormData(form);
  if (!selectedRating) { ratingValue.textContent = 'Pick a rating first'; ratingValue.style.color = '#ef9470'; return; }
  beers.unshift({ id: `beer-${Date.now()}`, name: data.get('name'), brewery: data.get('brewery'), style: data.get('style'), rating: selectedRating, notes: data.get('notes'), date: new Date().toISOString().slice(0, 10), image: photoData });
  saveBeers(); form.reset(); selectedRating = 0; photoData = ''; photoPreview.hidden = true; document.querySelectorAll('.rating-star').forEach((star) => star.classList.remove('selected')); ratingValue.textContent = 'Pick a rating'; ratingValue.style.color = '';
  render();
});

list.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-delete]');
  if (!deleteButton) return;
  beers = beers.filter((beer) => beer.id !== deleteButton.dataset.delete); saveBeers(); render();
});

document.querySelector('#filter-row').addEventListener('click', (event) => { const chip = event.target.closest('.filter-chip'); if (chip) { selectedFilter = chip.dataset.filter; render(); } });
searchInput.addEventListener('input', render); sortSelect.addEventListener('change', render);

document.querySelector('#account-button').addEventListener('click', () => {
  if (currentUser) {
    currentUser = ''; localStorage.removeItem(SESSION_KEY); beers = loadBeers(); updateAccountButton(); render();
  } else openAuth();
});
document.querySelector('#auth-close').addEventListener('click', closeAuth);
authBackdrop.addEventListener('click', (event) => { if (event.target === authBackdrop) closeAuth(); });
document.querySelector('#auth-switch').addEventListener('click', () => openAuth(authMode === 'login' ? 'register' : 'login'));
authForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = authEmail.value.trim().toLowerCase();
  const password = authPassword.value;
  fetch(`/api/${authMode === 'register' ? 'register' : 'login'}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
  }).then(async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('The API is not running. Start Hoplog with "npm.cmd start" and open the Node server URL.');
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    setCurrentUser(result.email); closeAuth();
  }).catch((error) => {
    authError.textContent = error instanceof TypeError
      ? 'The login server is not available. Host Hoplog with Node.js and SQLite enabled.'
      : (error.message || 'Unable to connect to Hoplog.');
    authError.hidden = false;
  });
});

updateAccountButton(); render();
