/* =========================================================
   Products (Shop) Page Logic
   ========================================================= */

let currentFilters = {
  keyword: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  rating: '',
  sort: 'newest',
  featured: '',
  page: 1
};

function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  currentFilters.keyword = params.get('keyword') || '';
  currentFilters.category = params.get('category') || '';
  currentFilters.featured = params.get('featured') || '';
  currentFilters.sort = params.get('sort') || 'newest';
}

async function renderFilterPanel() {
  let categories = [];
  try {
    const res = await Api.get('/categories');
    categories = res.categories;
  } catch (e) {
    categories = [];
  }

  const html = `
    <div class="filter-group">
      <h6>Search</h6>
      <input type="search" class="form-control" id="filterKeyword" placeholder="Search products..." value="${currentFilters.keyword}">
    </div>
    <div class="filter-group">
      <h6>Category</h6>
      <div class="d-flex flex-column gap-2">
        <div class="form-check">
          <input class="form-check-input filter-category" type="radio" name="categoryRadio" value="" id="catAll" ${!currentFilters.category ? 'checked' : ''}>
          <label class="form-check-label" for="catAll">All Categories</label>
        </div>
        ${categories
          .map(
            (c) => `
        <div class="form-check">
          <input class="form-check-input filter-category" type="radio" name="categoryRadio" value="${c._id}" id="cat${c._id}" ${currentFilters.category === c._id ? 'checked' : ''}>
          <label class="form-check-label" for="cat${c._id}">${c.name} <small class="text-muted">(${c.productCount})</small></label>
        </div>`
          )
          .join('')}
      </div>
    </div>
    <div class="filter-group">
      <h6>Price Range</h6>
      <div class="d-flex gap-2">
        <input type="number" class="form-control form-control-sm" id="filterMinPrice" placeholder="Min">
        <input type="number" class="form-control form-control-sm" id="filterMaxPrice" placeholder="Max">
      </div>
    </div>
    <div class="filter-group">
      <h6>Minimum Rating</h6>
      <div class="d-flex flex-column gap-2">
        ${[4, 3, 2, 1]
          .map(
            (r) => `
        <div class="form-check">
          <input class="form-check-input filter-rating" type="radio" name="ratingRadio" value="${r}" id="rating${r}">
          <label class="form-check-label" for="rating${r}">${starRatingHtml(r)} &amp; up</label>
        </div>`
          )
          .join('')}
        <div class="form-check">
          <input class="form-check-input filter-rating" type="radio" name="ratingRadio" value="" id="ratingAny" checked>
          <label class="form-check-label" for="ratingAny">Any rating</label>
        </div>
      </div>
    </div>
    <button class="btn btn-brand w-100" onclick="applyFilters()">Apply Filters</button>
    <button class="btn btn-ghost w-100 mt-2" onclick="resetFilters()">Clear All</button>
  `;

  document.getElementById('filterFormDesktop').innerHTML = html;
  document.getElementById('filterFormMobile').innerHTML = html.replaceAll('filterKeyword', 'filterKeywordM')
    .replaceAll('filterMinPrice', 'filterMinPriceM').replaceAll('filterMaxPrice', 'filterMaxPriceM')
    .replaceAll(/id="cat/g, 'id="catM').replaceAll(/id="rating/g, 'id="ratingM')
    .replaceAll('name="categoryRadio"', 'name="categoryRadioM"').replaceAll('name="ratingRadio"', 'name="ratingRadioM"');

  document.getElementById('sortSelect').value = currentFilters.sort;
}

function applyFilters() {
  const keyword = document.getElementById('filterKeyword')?.value || '';
  const category = document.querySelector('input[name="categoryRadio"]:checked')?.value || '';
  const minPrice = document.getElementById('filterMinPrice')?.value || '';
  const maxPrice = document.getElementById('filterMaxPrice')?.value || '';
  const rating = document.querySelector('input[name="ratingRadio"]:checked')?.value || '';

  currentFilters = { ...currentFilters, keyword, category, minPrice, maxPrice, rating, page: 1 };
  loadProducts();

  const offcanvasEl = document.getElementById('filterOffcanvas');
  const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
  if (offcanvas) offcanvas.hide();
}

function resetFilters() {
  currentFilters = { keyword: '', category: '', minPrice: '', maxPrice: '', rating: '', sort: 'newest', featured: '', page: 1 };
  renderFilterPanel();
  document.getElementById('sortSelect').value = 'newest';
  loadProducts();
}

function onFilterChange() {
  currentFilters.sort = document.getElementById('sortSelect').value;
  currentFilters.page = 1;
  loadProducts();
}

async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  const resultCount = document.getElementById('resultCount');
  grid.innerHTML = Array(8).fill(skeletonCardHtml()).join('');

  const params = new URLSearchParams();
  Object.entries(currentFilters).forEach(([key, val]) => {
    if (val) params.append(key, val);
  });
  params.append('limit', 12);

  try {
    const { products, page, pages, total } = await Api.get(`/products?${params.toString()}`);
    resultCount.textContent = `${total} product${total !== 1 ? 's' : ''} found`;

    grid.innerHTML = products.length
      ? products.map(productCardHtml).join('')
      : `<div class="col-12 empty-state"><i class="bi bi-search"></i><h5>No products found</h5><p class="text-muted">Try adjusting your filters or search term.</p></div>`;

    renderPagination(page, pages);
  } catch (err) {
    grid.innerHTML = `<div class="col-12 text-center text-muted py-5">Unable to load products. Please make sure the backend server is running.</div>`;
    resultCount.textContent = '';
  }
}

function renderPagination(current, totalPages) {
  const nav = document.getElementById('paginationNav');
  if (totalPages <= 1) {
    nav.innerHTML = '';
    return;
  }

  let items = '';
  for (let i = 1; i <= totalPages; i++) {
    items += `<li class="page-item ${i === current ? 'active' : ''}"><a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a></li>`;
  }

  nav.innerHTML = `
    <ul class="pagination justify-content-center">
      <li class="page-item ${current === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="goToPage(${current - 1}); return false;">&laquo;</a></li>
      ${items}
      <li class="page-item ${current === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="goToPage(${current + 1}); return false;">&raquo;</a></li>
    </ul>`;
}

function goToPage(page) {
  currentFilters.page = page;
  loadProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('products');
  renderFooter();
  readUrlParams();
  await renderFilterPanel();
  loadProducts();
  hidePageLoader();
});
