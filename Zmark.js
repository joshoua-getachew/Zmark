const STORAGE_KEY = 'zmark_bookmarks';
let bookmarks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

const url = document.getElementById('url');
const name = document.getElementById('name');
const select = document.getElementById('folder-select');
const addBtn = document.getElementById('add-btn');
const folderBox = document.getElementById('new-folder');
const grid = document.getElementById('folder-grid');
const list = document.getElementById('bookmark-list');
let currentFolder = null;

function toggleView(view) {
  document.getElementById('bookmark-section').style.display = view === 'bookmark-section' ? 'block' : 'none';
  document.getElementById('dashboard-section').style.display = view === 'dashboard-section' ? 'block' : 'none';
  if (view === 'dashboard-section') renderChart();
}

function updateFolders() {
  select.innerHTML = '<option disabled selected>Choose Folder</option>';
  Object.keys(bookmarks).forEach(f => {
    const o = document.createElement('option');
    o.value = f;
    o.textContent = f;
    select.appendChild(o);
  });
}

function renderBookmarks() {
  grid.innerHTML = '';
  list.innerHTML = '';
  Object.entries(bookmarks).forEach(([folder, items]) => {
    const folderCard = document.createElement('div');
    folderCard.className = 'card-folder';
    folderCard.innerHTML = `<h5 class="text-danger">${folder}</h5>`;
    folderCard.onclick = () => showFolderItems(folder);
    grid.appendChild(folderCard);
  });
}

function showFolderItems(folder) {
  currentFolder = folder;
  list.innerHTML = `<h4 class='text-danger mb-3'>${folder} Items</h4>`;
  const container = document.createElement('div');
  container.className = 'bookmark-flex-grid';
  list.appendChild(container);

  bookmarks[folder].forEach(async (item, i) => {
    const div = document.createElement('div');
    div.className = 'bookmark-card';
    div.innerHTML = '<em>Loading preview...</em>';
    container.appendChild(div);

    let previewHTML = '';
    try {
      const res = await fetch(`https://api.linkpreview.net/?key=aea23af0c10d7d352ea4b63ea65db7e9&q=${item.url}`);
      const preview = await res.json();
      previewHTML = `
        ${preview.image ? `<img src="${preview.image}" class="preview-img" alt="Preview" />` : ''}
        <strong>${preview.title || item.name}</strong><br/>
        <small>${preview.description || ''}</small><br/>
        <a href="${item.url}" target="_blank">${item.url}</a>
      `;
    } catch (err) {
      previewHTML = `<strong>${item.name}</strong><br/><a href="${item.url}" target="_blank">${item.url}</a>`;
    }

    div.innerHTML = `
      <div>${previewHTML}</div>
      <div class="bookmark-actions mt-2">
        <button class="btn btn-sm btn-outline-light me-2" onclick="editBookmark('${folder}', ${i})">Edit</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteBookmark('${folder}', ${i})">Delete</button>
      </div>
    `;
  });
}

folderBox.onclick = () => {
  const name = prompt("Folder name?");
  if (!name || bookmarks[name]) return;
  bookmarks[name] = [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  updateFolders();
  renderBookmarks();
};

addBtn.onclick = () => {
  const u = url.value.trim();
  const n = name.value.trim();
  const f = select.value;
  if (!u || !n || !f || f === 'Choose Folder') return;
  bookmarks[f].push({ name: n, url: u });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  url.value = name.value = '';
  renderBookmarks();
  if (currentFolder === f) showFolderItems(f);
};

function deleteBookmark(folder, index) {
  bookmarks[folder].splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  renderBookmarks();
  if (currentFolder === folder) showFolderItems(folder);
}

function editBookmark(folder, index) {
  const item = bookmarks[folder][index];
  const newName = prompt("New name:", item.name);
  const newUrl = prompt("New URL:", item.url);
  if (newName && newUrl) {
    bookmarks[folder][index] = { name: newName, url: newUrl };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    renderBookmarks();
    showFolderItems(folder);
  }
}

function renderChart() {
  const ctx = document.getElementById('bookmarkChart').getContext('2d');
  const data = Object.entries(bookmarks).map(([k, v]) => ({ folder: k, count: v.length }));
  if (window.bookmarkChart instanceof Chart) window.bookmarkChart.destroy();
  window.bookmarkChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.folder),
      datasets: [{
        label: 'Bookmarks per Folder',
        data: data.map(d => d.count),
        backgroundColor: ['#ff4444', '#44ff44', '#4488ff', '#ffaa44', '#ff44aa']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: '#fff',
            font: { size: 14 }
          }
        }
      }
    }
  });
}

updateFolders();
renderBookmarks();