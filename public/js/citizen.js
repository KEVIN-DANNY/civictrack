// citizen.js - jQuery handler for Index Feed, Report Form, and Citizen Dashboard

const CHENNAI_WARDS = [
  'Adyar', 'Anna Nagar', 'T Nagar', 'Mylapore', 'Velachery',
  'Kodambakkam', 'Tambaram', 'Perambur', 'Royapuram', 'Tondiarpet'
];

const ICONS = {
  roads: `<svg class="inline-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19L8 5M20 19l-4-14M12 5v3M12 11v3M12 17v3"/></svg>`,
  water: `<svg class="inline-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
  electricity: `<svg class="inline-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  sanitation: `<svg class="inline-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
  illegal_construction: `<svg class="inline-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="8" rx="1"/><path d="M17 14v7M7 14v7M4 14l3-8M20 14l-3-8M8 6h8"/></svg>`,
  drainage: `<svg class="inline-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14M12 2v20M2 12h20M4.93 19.07l14.14-14.14"/></svg>`,
  other: `<svg class="inline-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  location: `<svg class="inline-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  clock: `<svg class="inline-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  heart: `<svg class="inline-svg sm heart-filled" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  comment: `<svg class="inline-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  user: `<svg class="inline-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
};

const CATEGORIES = [
  { id: 'roads', label: 'Roads & Pavements', dept: 'Roads & Infrastructure', deptSub: 'Public Works Department' },
  { id: 'water', label: 'Water Supply', dept: 'Water Supply & Utilities', deptSub: 'MetroWater Supply Board' },
  { id: 'electricity', label: 'Electricity & Streetlights', dept: 'Electrical Infrastructure', deptSub: 'Power Distribution Wing' },
  { id: 'sanitation', label: 'Sanitation & Garbage', dept: 'Solid Waste & Sanitation', deptSub: 'Sanitation & Health Dept' },
  { id: 'illegal_construction', label: 'Illegal Construction', dept: 'Urban Planning Enforcement', deptSub: 'Town Planning Division' },
  { id: 'drainage', label: 'Drainage & Sewage', dept: 'Drainage & Stormwater', deptSub: 'Stormwater Management Division' },
  { id: 'other', label: 'Other Civic Grievance', dept: 'Municipal Grievance Wing', deptSub: 'Ward Administrative Office' }
];

// Helper to format time ago
function timeAgo(dateString) {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

// Helper to format category icon
function getCategoryIcon(cat) {
  return ICONS[cat] || ICONS.other;
}

function getCategoryLabel(cat) {
  const match = CATEGORIES.find(c => c.id === cat);
  return match ? match.label : cat.replace('_', ' ');
}

// Render dynamic civic placeholder banner for empty photo cards
function renderPlaceholderBanner(catId) {
  const meta = CATEGORIES.find(c => c.id === catId) || CATEGORIES[6];
  const iconSvg = ICONS[catId] || ICONS.other;

  return `
    <div class="civic-card-banner civic-banner-${catId}">
      <div class="banner-pattern"></div>
      <div class="banner-tag">Official Municipal Log</div>
      <div class="banner-center">
        <div class="banner-icon-circle">
          ${iconSvg}
        </div>
        <div class="banner-dept-name">${meta.dept}</div>
        <div class="banner-dept-sub">${meta.deptSub}</div>
      </div>
    </div>
  `;
}

// Session state checker for navbar on jQuery pages
function checkSessionNav() {
  $.ajax({
    url: '/api/auth/me',
    method: 'GET',
    xhrFields: { withCredentials: true },
    success: function (res) {
      if (res.success && res.user) {
        const user = res.user;
        sessionStorage.setItem('civictrack_user', JSON.stringify(user));

        let dashLink = '';
        if (user.role === 'citizen') {
          dashLink = `<a href="/pages/citizen-dashboard.html" class="nav-link">My Dashboard</a>`;
        } else if (user.role === 'authority') {
          dashLink = `<a href="/pages/authority-dashboard.html" class="nav-link">Authority Dashboard</a>`;
        }

        $('#navLinksDynamic').html(dashLink);

        $('#navAuthDynamic').html(`
          <div class="user-tag">
            <span>${ICONS.user} ${user.name}</span>
            <span class="role-pill ${user.role}">${user.role}</span>
          </div>
          <button id="navLogoutBtn" class="btn btn-outline-danger btn-sm">Logout</button>
        `);

        $('#navLogoutBtn').on('click', function () {
          logoutUser();
        });
      }
    },
    error: function () {
      sessionStorage.removeItem('civictrack_user');
      $('#navLinksDynamic').empty();
      $('#navAuthDynamic').html(`
        <a href="/pages/login.html" class="btn btn-outline-primary btn-sm">Login</a>
        <a href="/pages/register.html" class="btn btn-primary btn-sm">Register</a>
      `);
    }
  });
}

function logoutUser() {
  $.ajax({
    url: '/api/auth/logout',
    method: 'POST',
    xhrFields: { withCredentials: true },
    success: function () {
      sessionStorage.removeItem('civictrack_user');
      window.location.href = '/pages/login.html';
    },
    error: function () {
      window.location.href = '/pages/login.html';
    }
  });
}

// Mobile hamburger handler
$(document).on('click', '#navHamburger', function () {
  $('#navMenuWrapper').toggleClass('active');
});

// ==========================================
// 1. INDEX PAGE (FEED & FILTERS)
// ==========================================
let currentPage = 1;
const pageLimit = 9;
let currentSearch = '';
let currentWard = 'all';
let currentCategory = 'all';
let currentStatus = 'all';

function initIndexPage() {
  // Populate ward dropdown
  const $wardSelect = $('#filterWard');
  $wardSelect.empty().append('<option value="all">All Wards</option>');
  CHENNAI_WARDS.forEach(w => {
    $wardSelect.append(`<option value="${w}">${w}</option>`);
  });

  // Populate category dropdown
  const $catSelect = $('#filterCategory');
  $catSelect.empty().append('<option value="all">All Categories</option>');
  CATEGORIES.forEach(c => {
    $catSelect.append(`<option value="${c.id}">${c.label}</option>`);
  });

  // Load summary stats once on load
  loadSummaryStats();

  // Load issues
  loadIssues(1);

  // Filter change listeners
  $('#filterWard, #filterCategory, #filterStatus').on('change', function () {
    currentWard = $('#filterWard').val();
    currentCategory = $('#filterCategory').val();
    currentStatus = $('#filterStatus').val();
    currentPage = 1;
    loadIssues(currentPage);
  });

  // Search keyword listener with debounce
  let searchTimeout = null;
  $('#filterSearch').on('input', function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(function () {
      currentSearch = $('#filterSearch').val();
      currentPage = 1;
      loadIssues(currentPage);
    }, 300);
  });

  // Pagination click handlers
  $('#prevPageBtn').on('click', function () {
    if (currentPage > 1) {
      currentPage--;
      loadIssues(currentPage);
      $('html, body').animate({ scrollTop: $('#issuesFeedSection').offset().top - 80 }, 300);
    }
  });

  $('#nextPageBtn').on('click', function () {
    currentPage++;
    loadIssues(currentPage);
    $('html, body').animate({ scrollTop: $('#issuesFeedSection').offset().top - 80 }, 300);
  });
}

function loadSummaryStats() {
  $.ajax({
    url: '/api/issues?limit=1000',
    method: 'GET',
    success: function (res) {
      if (res.success && res.issues) {
        const issues = res.issues;
        const total = issues.length;
        const resolved = issues.filter(i => i.status === 'resolved').length;
        const pending = issues.filter(i => i.status === 'pending').length;
        const escalated = issues.filter(i => i.status === 'escalated' || i.escalationLevel > 0).length;

        $('#statTotal').text(total);
        $('#statResolved').text(resolved);
        $('#statPending').text(pending);
        $('#statEscalated').text(escalated);
      }
    }
  });
}

function loadIssues(page) {
  $('#issuesLoading').show();
  $('#issuesGrid').empty();
  $('#noIssuesAlert').hide();

  const queryParams = {
    page: page,
    limit: pageLimit,
    ward: currentWard,
    category: currentCategory,
    status: currentStatus,
    search: currentSearch
  };

  $.ajax({
    url: '/api/issues',
    method: 'GET',
    data: queryParams,
    success: function (res) {
      $('#issuesLoading').hide();
      if (res.success && res.issues) {
        renderIssuesGrid(res.issues);
        updatePagination(res.page, res.totalPages, res.totalCount);
      } else {
        $('#noIssuesAlert').show();
      }
    },
    error: function (xhr) {
      $('#issuesLoading').hide();
      const err = xhr.responseJSON ? xhr.responseJSON.error : 'Failed to fetch issues';
      $('#noIssuesAlert').text(`Error: ${err}`).show();
    }
  });
}

function renderIssuesGrid(issues) {
  const $grid = $('#issuesGrid');
  $grid.empty();

  if (issues.length === 0) {
    $('#noIssuesAlert').show();
    return;
  }

  $('#noIssuesAlert').hide();

  issues.forEach(issue => {
    const isEscalated = issue.escalationLevel > 0;
    const escalationHtml = isEscalated
      ? `<div class="escalation-indicator"><span class="pulsing-dot"></span> Escalated L${issue.escalationLevel}</div>`
      : '';

    const thumbHtml = issue.photo
      ? `<img src="${issue.photo}" alt="${escapeHtml(issue.title)}">`
      : renderPlaceholderBanner(issue.category);

    const card = `
      <a href="/pages/issue.html?id=${issue._id}" class="issue-card" data-id="${issue._id}">
        <div class="issue-thumb">
          ${thumbHtml}
        </div>
        <div class="issue-card-body">
          <div class="issue-badges">
            <span class="badge badge-${issue.status}"><span class="status-dot"></span>${issue.status.replace('_', ' ')}</span>
            <span class="category-badge">${getCategoryIcon(issue.category)} ${getCategoryLabel(issue.category)}</span>
            ${escalationHtml}
          </div>
          <h3 class="issue-title">${escapeHtml(issue.title)}</h3>
          <div class="issue-meta">
            <span>${ICONS.location} Ward: ${escapeHtml(issue.ward)}</span>
            <span>•</span>
            <span>${ICONS.clock} ${timeAgo(issue.createdAt)}</span>
          </div>
          <div class="issue-card-footer">
            <div class="card-counts">
              <span class="count-pill">${ICONS.heart} ${issue.upvoteCount || 0}</span>
              <span class="count-pill">${ICONS.comment} ${issue.comments ? issue.comments.length : 0}</span>
            </div>
            <span>Reported by: ${issue.reportedBy ? escapeHtml(issue.reportedBy.name) : 'Citizen'}</span>
          </div>
        </div>
      </a>
    `;

    $grid.append(card);
  });
}

function updatePagination(page, totalPages, totalCount) {
  currentPage = page;
  $('#pageInfo').text(`Page ${page} of ${totalPages} (${totalCount} issues)`);

  $('#prevPageBtn').prop('disabled', page <= 1);
  $('#nextPageBtn').prop('disabled', page >= totalPages);
}

// ==========================================
// 2. REPORT ISSUE PAGE
// ==========================================
function initReportPage() {
  // Check auth first: must be logged in citizen
  $.ajax({
    url: '/api/auth/me',
    method: 'GET',
    xhrFields: { withCredentials: true },
    success: function (res) {
      if (!res.success || !res.user) {
        window.location.href = '/pages/login.html?redirect=report';
      } else if (res.user.role !== 'citizen') {
        alert('Only citizen accounts can report issues.');
        window.location.href = '/';
      }
    },
    error: function () {
      window.location.href = '/pages/login.html?redirect=report';
    }
  });

  // Populate ward select
  const $wardSelect = $('#reportWard');
  $wardSelect.empty().append('<option value="">-- Select Ward --</option>');
  CHENNAI_WARDS.forEach(w => {
    $wardSelect.append(`<option value="${w}">${w}</option>`);
  });

  // Populate category select
  const $catSelect = $('#reportCategory');
  $catSelect.empty().append('<option value="">-- Select Category --</option>');
  CATEGORIES.forEach(c => {
    $catSelect.append(`<option value="${c.id}">${c.label}</option>`);
  });

  // Live character counter for description
  $('#reportDescription').on('input', function () {
    const len = $(this).val().length;
    $('#descCharCount').text(`${len} / 1000 characters`);
  });

  // Photo preview
  $('#reportPhoto').on('change', function () {
    const file = this.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Photo must be less than 5MB');
        $(this).val('');
        $('#photoPreviewBox').hide();
        return;
      }
      const reader = new FileReader();
      reader.onload = function (e) {
        $('#photoPreviewImg').attr('src', e.target.result);
        $('#photoPreviewBox').show();
      };
      reader.readAsDataURL(file);
    } else {
      $('#photoPreviewBox').hide();
    }
  });

  // Report Form Submission with jQuery validation
  $('#reportIssueForm').on('submit', function (e) {
    e.preventDefault();

    let isValid = true;
    const title = $('#reportTitle').val().trim();
    const category = $('#reportCategory').val();
    const description = $('#reportDescription').val().trim();
    const ward = $('#reportWard').val();
    const address = $('#reportAddress').val().trim();
    const lat = $('#reportLat').val().trim();
    const lng = $('#reportLng').val().trim();

    // Reset error states
    $('.form-control').removeClass('is-invalid');
    $('.error-message').hide();
    $('#reportAlert').hide();

    // 1. Title validation
    if (!title || title.length < 10 || title.length > 100) {
      $('#reportTitle').addClass('is-invalid');
      $('#titleError').text('Title must be between 10 and 100 characters.').show();
      isValid = false;
    }

    // 2. Category validation
    if (!category) {
      $('#reportCategory').addClass('is-invalid');
      $('#categoryError').text('Please select a category.').show();
      isValid = false;
    }

    // 3. Description validation: min 20, max 1000, reject all-caps or all-number
    if (!description || description.length < 20 || description.length > 1000) {
      $('#reportDescription').addClass('is-invalid');
      $('#descError').text('Description must be between 20 and 1000 characters.').show();
      isValid = false;
    } else if (/^[A-Z\s\W\d]+$/.test(description) && !/[a-z]/.test(description)) {
      $('#reportDescription').addClass('is-invalid');
      $('#descError').text('Description cannot be entirely in ALL CAPS.').show();
      isValid = false;
    } else if (/^\d+$/.test(description.replace(/\s+/g, ''))) {
      $('#reportDescription').addClass('is-invalid');
      $('#descError').text('Description cannot be entirely numbers.').show();
      isValid = false;
    }

    // 4. Ward validation
    if (!ward) {
      $('#reportWard').addClass('is-invalid');
      $('#wardError').text('Please select your municipal ward.').show();
      isValid = false;
    }

    // 5. Address validation
    if (!address || address.length < 5) {
      $('#reportAddress').addClass('is-invalid');
      $('#addressError').text('Detailed street address is required.').show();
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    // Submit via AJAX FormData
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('ward', ward);
    formData.append('address', address);
    if (lat) formData.append('lat', lat);
    if (lng) formData.append('lng', lng);

    const fileInput = document.getElementById('reportPhoto');
    if (fileInput.files.length > 0) {
      formData.append('photo', fileInput.files[0]);
    }

    $('#submitReportBtn').prop('disabled', true).text('Submitting...');
    $('#reportProgress').show();

    $.ajax({
      url: '/api/issues',
      method: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      xhrFields: { withCredentials: true },
      success: function (res) {
        $('#reportProgress').hide();
        if (res.success && res.issue) {
          window.location.href = `/pages/issue.html?id=${res.issue._id}`;
        } else {
          $('#submitReportBtn').prop('disabled', false).text('Submit Issue');
          $('#reportAlert').removeClass('alert-success').addClass('alert-danger')
            .text(res.error || 'Failed to file issue.').show();
        }
      },
      error: function (xhr) {
        $('#reportProgress').hide();
        $('#submitReportBtn').prop('disabled', false).text('Submit Issue');
        const err = xhr.responseJSON ? xhr.responseJSON.error : 'Network error submitting issue.';
        $('#reportAlert').removeClass('alert-success').addClass('alert-danger').text(err).show();
      }
    });
  });
}

// ==========================================
// 3. CITIZEN DASHBOARD PAGE
// ==========================================
let citizenIssues = [];

function initCitizenDashboard() {
  $.ajax({
    url: '/api/auth/me',
    method: 'GET',
    xhrFields: { withCredentials: true },
    success: function (res) {
      if (!res.success || !res.user) {
        window.location.href = '/pages/login.html';
        return;
      }
      if (res.user.role !== 'citizen') {
        alert('Citizen dashboard is for registered citizens only.');
        window.location.href = '/';
        return;
      }

      const user = res.user;
      $('#citizenWelcomeName').text(user.name);
      $('#citizenWardInfo').text(`Ward: ${user.ward} | Phone: ${user.phone}`);

      // Setup RTI export button link
      $('#btnExportRti').attr('href', `/api/export/rti/${user.id}`);

      loadCitizenIssues(user.id);
    },
    error: function () {
      window.location.href = '/pages/login.html';
    }
  });

  // Filter issues by status
  $('#citizenFilterStatus').on('change', function () {
    const selected = $(this).val();
    renderCitizenTable(selected);
  });
}

function loadCitizenIssues(userId) {
  $('#citizenTableLoading').show();

  $.ajax({
    url: `/api/issues?limit=500`,
    method: 'GET',
    xhrFields: { withCredentials: true },
    success: function (res) {
      $('#citizenTableLoading').hide();
      if (res.success && res.issues) {
        // Filter issues reported by current user
        citizenIssues = res.issues.filter(i => {
          return i.reportedBy && (i.reportedBy._id === userId || i.reportedBy === userId);
        });

        // Compute citizen stats
        const total = citizenIssues.length;
        const resolved = citizenIssues.filter(i => i.status === 'resolved').length;
        const pending = citizenIssues.filter(i => i.status === 'pending').length;
        const escalated = citizenIssues.filter(i => i.status === 'escalated' || i.escalationLevel > 0).length;

        $('#citizenTotalFiled').text(total);
        $('#citizenResolved').text(resolved);
        $('#citizenPending').text(pending);
        $('#citizenEscalated').text(escalated);

        renderCitizenTable('all');
      }
    },
    error: function (xhr) {
      $('#citizenTableLoading').hide();
      const err = xhr.responseJSON ? xhr.responseJSON.error : 'Failed to load your issues.';
      $('#citizenTableAlert').text(err).show();
    }
  });
}

function renderCitizenTable(statusFilter) {
  const $tbody = $('#citizenIssuesTable tbody');
  $tbody.empty();

  let list = citizenIssues;
  if (statusFilter && statusFilter !== 'all') {
    list = citizenIssues.filter(i => i.status === statusFilter);
  }

  if (list.length === 0) {
    $tbody.append(`<tr><td colspan="7" style="text-align: center; color: var(--gray); padding: 24px;">No issues found matching this filter.</td></tr>`);
    return;
  }

  list.forEach(issue => {
    const isEscalated = issue.escalationLevel > 0;
    const escalationBadge = isEscalated
      ? `<span class="escalation-indicator"><span class="pulsing-dot"></span> Level ${issue.escalationLevel}</span>`
      : `<span style="color: var(--gray);">None</span>`;

    const row = `
      <tr class="${isEscalated ? 'row-escalated' : ''}">
        <td><strong><a href="/pages/issue.html?id=${issue._id}">${escapeHtml(issue.title)}</a></strong></td>
        <td><span class="category-badge">${getCategoryIcon(issue.category)} ${getCategoryLabel(issue.category)}</span></td>
        <td><span class="badge badge-${issue.status}"><span class="status-dot"></span>${issue.status.replace('_', ' ')}</span></td>
        <td>${escalationBadge}</td>
        <td><span class="count-pill">${ICONS.heart} ${issue.upvoteCount || 0}</span></td>
        <td>${new Date(issue.createdAt).toLocaleDateString()}</td>
        <td>
          <a href="/pages/issue.html?id=${issue._id}" class="btn btn-outline-primary btn-sm">View Details</a>
        </td>
      </tr>
    `;

    $tbody.append(row);
  });
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

$(document).ready(function () {
  checkSessionNav();
});
