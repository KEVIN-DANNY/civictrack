// authority-dashboard.js - AngularJS 1.8 App for Authority Dashboard with Canvas API Chart

const authorityApp = angular.module('AuthorityApp', []);

authorityApp.controller('DashboardController', ['$scope', '$http', '$timeout', function ($scope, $http, $timeout) {
  $scope.currentUser = null;
  $scope.stats = null;
  $scope.issues = [];
  $scope.statusFilter = 'all';
  $scope.loading = true;
  $scope.alertMessage = '';
  $scope.alertType = '';
  $scope.updateNotes = {};
  $scope.newStatuses = {};

  // Check auth and role on initialize
  $scope.init = function () {
    $http.get('/api/auth/me')
      .then(function (res) {
        if (res.data.success && res.data.user) {
          if (res.data.user.role !== 'authority') {
            alert('Access denied: Authority dashboard requires an authority account.');
            window.location.href = '/';
            return;
          }
          $scope.currentUser = res.data.user;
          $scope.loadDashboardData();
        } else {
          window.location.href = '/pages/login.html';
        }
      })
      .catch(function () {
        window.location.href = '/pages/login.html';
      });
  };

  $scope.logout = function () {
    $http.post('/api/auth/logout')
      .then(function () {
        sessionStorage.removeItem('civictrack_user');
        window.location.href = '/pages/login.html';
      })
      .catch(function () {
        window.location.href = '/pages/login.html';
      });
  };

  $scope.loadDashboardData = function () {
    $scope.loading = true;
    const userId = $scope.currentUser.id;

    // 1. Fetch Authority Stats
    $http.get('/api/authorities/' + userId + '/stats')
      .then(function (statsRes) {
        if (statsRes.data.success) {
          $scope.stats = statsRes.data.stats;
          $timeout(function () {
            $scope.drawBreakdownChart($scope.stats.scoreBreakdown);
          }, 50);
        }
      })
      .catch(function (err) {
        $scope.showAlert('Failed to load authority statistics.', 'danger');
      });

    // 2. Fetch Authority Issues
    $http.get('/api/authorities/' + userId + '/issues')
      .then(function (issuesRes) {
        $scope.loading = false;
        if (issuesRes.data.success) {
          $scope.issues = issuesRes.data.issues;

          // Initialize model bindings for status and notes
          $scope.issues.forEach(function (issue) {
            $scope.newStatuses[issue._id] = issue.status;
            $scope.updateNotes[issue._id] = '';
          });
        }
      })
      .catch(function (err) {
        $scope.loading = false;
        $scope.showAlert('Failed to load assigned issues.', 'danger');
      });
  };

  // Helper for Days Open
  $scope.getDaysOpen = function (dateString) {
    const created = new Date(dateString);
    const diff = Math.floor((new Date() - created) / (1000 * 60 * 60 * 24));
    return diff <= 0 ? 'Today (<1d)' : diff + ' days';
  };

  // Helper for score color classes
  $scope.getScoreClass = function (score) {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  };

  // Filter issues by status
  $scope.filterByStatus = function (issue) {
    if ($scope.statusFilter === 'all') return true;
    return issue.status === $scope.statusFilter;
  };

  // Update Issue Status
  $scope.updateIssueStatus = function (issue) {
    const issueId = issue._id;
    const nextStatus = $scope.newStatuses[issueId];
    const note = $scope.updateNotes[issueId] || '';

    if (!nextStatus) {
      alert('Please select a valid status.');
      return;
    }

    issue.isUpdating = true;

    $http.put('/api/issues/' + issueId + '/status', {
      status: nextStatus,
      note: note
    })
      .then(function (res) {
        issue.isUpdating = false;
        if (res.data.success) {
          issue.status = res.data.issue.status;
          issue.statusHistory = res.data.issue.statusHistory;
          $scope.updateNotes[issueId] = ''; // clear note
          $scope.showAlert('Status updated successfully for "' + issue.title + '"! Score recalculated.', 'success');

          // Immediately re-fetch stats and re-draw Canvas chart without page reload
          $scope.refreshStatsOnly();
        } else {
          $scope.showAlert(res.data.error || 'Failed to update status.', 'danger');
        }
      })
      .catch(function (err) {
        issue.isUpdating = false;
        const msg = err.data && err.data.error ? err.data.error : 'Network error updating issue status.';
        $scope.showAlert(msg, 'danger');
      });
  };

  // Refresh stats only (called after status update)
  $scope.refreshStatsOnly = function () {
    const userId = $scope.currentUser.id;
    $http.get('/api/authorities/' + userId + '/stats')
      .then(function (res) {
        if (res.data.success && res.data.stats) {
          $scope.stats = res.data.stats;
          $timeout(function () {
            $scope.drawBreakdownChart($scope.stats.scoreBreakdown);
          }, 50);
        }
      });
  };

  $scope.showAlert = function (msg, type) {
    $scope.alertMessage = msg;
    $scope.alertType = type;
    $timeout(function () {
      $scope.alertMessage = '';
    }, 6000);
  };

  // ========================================================
  // VANILLA JS HTML5 CANVAS API - HORIZONTAL BAR CHART
  // ========================================================
  $scope.drawBreakdownChart = function (breakdown) {
    const canvas = document.getElementById('breakdownCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement.clientWidth || 600;
    const height = 240;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (!breakdown) return;

    const items = [
      { name: 'Resolution Rate (40%)', val: breakdown.resolutionRate || 0, color: '#1a6b3c' },
      { name: 'Speed Score (30%)', val: breakdown.speedScore || 0, color: '#0984e3' },
      { name: 'Response Rate (20%)', val: breakdown.responseRate || 0, color: '#8e44ad' },
      { name: 'Escalation Penalty (-10%)', val: breakdown.escalationPenalty || 0, color: '#d63031' }
    ];

    const labelWidth = 190;
    const rightMargin = 60;
    const barMaxWidth = Math.max(80, width - labelWidth - rightMargin);
    const startY = 30;
    const rowHeight = 48;
    const barHeight = 22;

    items.forEach(function (item, index) {
      const y = startY + index * rowHeight;

      // Label text
      ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#2d3436';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.name, 10, y + barHeight / 2);

      // Background track
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(labelWidth, y, barMaxWidth, barHeight, 4);
      ctx.fill();

      // Foreground bar
      const fillWidth = Math.max(2, (Math.min(100, item.val) / 100) * barMaxWidth);
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.roundRect(labelWidth, y, fillWidth, barHeight, 4);
      ctx.fill();

      // Value text
      ctx.fillStyle = '#1e293b';
      ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      const prefix = item.name.includes('Penalty') ? '-' : '';
      ctx.fillText(prefix + item.val + '%', labelWidth + barMaxWidth + 12, y + barHeight / 2);
    });
  };

  // Window resize re-draws canvas
  window.addEventListener('resize', function () {
    if ($scope.stats && $scope.stats.scoreBreakdown) {
      $scope.$apply(function () {
        $scope.drawBreakdownChart($scope.stats.scoreBreakdown);
      });
    }
  });

  // Start initialization
  $scope.init();
}]);
