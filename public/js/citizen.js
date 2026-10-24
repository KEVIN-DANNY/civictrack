// citizen.js - jQuery handler for Index Feed, Report Form, and Citizen Dashboard

const CHENNAI_WARDS = [
  'Adyar', 'Anna Nagar', 'T Nagar', 'Mylapore', 'Velachery',
  'Kodambakkam', 'Tambaram', 'Perambur', 'Royapuram', 'Tondiarpet'
];

const CATEGORIES = [
  { id: 'roads', label: 'Roads & Pavements', icon: '🛣️' },
  { id: 'water', label: 'Water Supply', icon: '💧' },
  { id: 'electricity', label: 'Electricity & Streetlights', icon: '⚡' },
  { id: 'sanitation', label: 'Sanitation & Garbage', icon: '🗑️' },
  { id: 'illegal_construction', label: 'Illegal Construction', icon: '🏗️' },
  { id: 'drainage', label: 'Drainage & Sewage', icon: '🚰' },
  { id: 'other', label: 'Other Civic Grievance', icon: '📌' }
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
  const match = CATEGORIES.find(c => c.id === cat);
  return match ? match.icon : '📌';
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
            <span>👤 ${user.name}</span>
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
      ? `<img src="${issue.photo}" alt="${issue.title}">`
      : `<div class="issue-placeholder-icon">${getCategoryIcon(issue.category)}</div>`;

    const card = `
      <a href="/pages/issue.html?id=${issue._id}" class="issue-card" data-id="${issue._id}">
        <div class="issue-thumb">
          ${thumbHtml}
        </div>
        <div class="issue-card-body">
          <div class="issue-badges">
            <span class="badge badge-${issue.status}">${issue.status.replace('_', ' ')}</span>
            <span class="category-badge">${getCategoryIcon(issue.category)} ${issue.category.replace('_', ' ')}</span>
            ${escalationHtml}
          </div>
          <h3 class="issue-title">${escapeHtml(issue.title)}</h3>
          <div class="issue-meta">
            <span>📍 Ward: ${escapeHtml(issue.ward)}</span>
            <span>•</span>
            <span>🕒 ${timeAgo(issue.createdAt)}</span>
          </div>
          <div class="issue-card-footer">
            <div class="card-counts">
              <span class="count-pill">❤️ ${issue.upvoteCount || 0}</span>
              <span class="count-pill">💬 ${issue.comments ? issue.comments.length : 0}</span>
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
    $catSelect.append(`<option value="${c.id}">${c.icon} ${c.label}</option>`);
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
        <td><span class="category-badge">${getCategoryIcon(issue.category)} ${issue.category.replace('_', ' ')}</span></td>
        <td><span class="badge badge-${issue.status}">${issue.status.replace('_', ' ')}</span></td>
        <td>${escalationBadge}</td>
        <td>❤️ ${issue.upvoteCount || 0}</td>
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
