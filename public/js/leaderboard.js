// leaderboard.js - AngularJS 1.8 App for Accountability Leaderboard with Vanilla Canvas Chart

const leaderboardApp = angular.module('LeaderboardApp', []);

leaderboardApp.controller('LeaderboardController', ['$scope', '$http', '$timeout', function ($scope, $http, $timeout) {
  $scope.leaderboard = [];
  $scope.currentUser = null;
  $scope.loading = true;
  $scope.searchQuery = '';
  $scope.expandedAuthorityId = null;

  // Initialize
  $scope.init = function () {
    // Check session to update nav
    $http.get('/api/auth/me')
      .then(function (res) {
        if (res.data.success && res.data.user) {
          $scope.currentUser = res.data.user;
        }
      })
      .catch(function () {
        $scope.currentUser = null;
      });

    $scope.loadLeaderboard();
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

  $scope.loadLeaderboard = function () {
    $scope.loading = true;
    $http.get('/api/authorities/leaderboard')
      .then(function (res) {
        $scope.loading = false;
        if (res.data.success && res.data.leaderboard) {
          $scope.leaderboard = res.data.leaderboard;

          // Render comparative Canvas bar chart
          $timeout(function () {
            $scope.drawComparativeChart($scope.leaderboard);
          }, 100);
        }
      })
      .catch(function (err) {
        $scope.loading = false;
        alert('Failed to load leaderboard data.');
      });
  };

  // Helper for rank medal emoji
  $scope.getRankDisplay = function (index) {
    if (index === 0) return '🥇 1st';
    if (index === 1) return '🥈 2nd';
    if (index === 2) return '🥉 3rd';
    return (index + 1) + 'th';
  };

  // Helper for score grade
  $scope.getGrade = function (score) {
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  };

  // Helper for grade badge class
  $scope.getGradeClass = function (score) {
    if (score >= 70) return 'badge-resolved';
    if (score >= 40) return 'badge-in_progress';
    return 'badge-escalated';
  };

  // Helper for score color
  $scope.getScoreClass = function (score) {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  };

  // Inline row expansion toggle
  $scope.toggleExpand = function (authId) {
    if ($scope.expandedAuthorityId === authId) {
      $scope.expandedAuthorityId = null;
    } else {
      $scope.expandedAuthorityId = authId;
    }
  };

  // ========================================================
  // VANILLA JS HTML5 CANVAS API - COMPARATIVE BAR CHART
  // ========================================================
  $scope.drawComparativeChart = function (data) {
    const canvas = document.getElementById('leaderboardChartCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement.clientWidth || 900;
    const height = 280;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (!data || data.length === 0) return;

    // Filter to top 10 authorities for display
    const items = data.slice(0, 10);
    const count = items.length;

    const paddingLeft = 50;
    const paddingRight = 40;
    const paddingTop = 40;
    const paddingBottom = 60;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Draw horizontal grid lines (0, 25, 50, 75, 100)
    const gridSteps = [0, 25, 50, 75, 100];
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    gridSteps.forEach(function (val) {
      const y = paddingTop + chartHeight - (val / 100) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      ctx.fillText(val + '', paddingLeft - 8, y);
    });

    const slotWidth = chartWidth / count;
    const barWidth = Math.min(64, slotWidth * 0.6);

    items.forEach(function (item, i) {
      const score = item.accountabilityScore || 0;
      const barH = (score / 100) * chartHeight;
      const x = paddingLeft + i * slotWidth + (slotWidth - barWidth) / 2;
      const y = paddingTop + chartHeight - barH;

      // Determine bar color
      let barColor = '#d63031'; // red
      if (score >= 70) {
        barColor = '#1a6b3c'; // green
      } else if (score >= 40) {
        barColor = '#f4a623'; // amber
      }

      // Draw Bar
      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, Math.max(4, barH), [4, 4, 0, 0]);
      ctx.fill();

      // Score text above bar
      ctx.fillStyle = '#1e293b';
      ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(score + '', x + barWidth / 2, y - 6);

      // Label below axis (Ward Name & Officer)
      ctx.fillStyle = '#475569';
      ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const wardName = item.ward || 'Ward';
      ctx.fillText(wardName, x + barWidth / 2, paddingTop + chartHeight + 10);

      // Rank indicator below ward
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('#' + (i + 1), x + barWidth / 2, paddingTop + chartHeight + 28);
    });
  };

  // Re-draw chart on window resize
  window.addEventListener('resize', function () {
    if ($scope.leaderboard.length) {
      $scope.$apply(function () {
        $scope.drawComparativeChart($scope.leaderboard);
      });
    }
  });

  $scope.init();
}]);
