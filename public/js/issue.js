// issue.js - Single Issue Detail View, Timeline Stepper, Upvote, and Comments

let currentIssue = null;
let currentUser = null;

function initIssueDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const issueId = urlParams.get('id');

  if (!issueId) {
    $('#issueDetailAlert').removeClass('alert-info').addClass('alert-danger')
      .text('Error: No issue ID provided in the URL.').show();
    $('#issueLoading').hide();
    return;
  }

  // 1. Check current logged-in user
  $.ajax({
    url: '/api/auth/me',
    method: 'GET',
    xhrFields: { withCredentials: true },
    success: function (res) {
      if (res.success && res.user) {
        currentUser = res.user;
        $('#commentFormCard').show();
        $('#loginToCommentMsg').hide();
      } else {
        $('#commentFormCard').hide();
        $('#loginToCommentMsg').show();
      }
      // Load issue after determining user
      fetchIssue(issueId);
    },
    error: function () {
      $('#commentFormCard').hide();
      $('#loginToCommentMsg').show();
      fetchIssue(issueId);
    }
  });

  // 2. Upvote click listener
  $('#btnUpvote').on('click', function () {
    if (!currentUser) {
      alert('Please log in as a citizen to upvote this issue.');
      window.location.href = `/pages/login.html?redirect=issue&id=${issueId}`;
      return;
    }
    if (currentUser.role !== 'citizen') {
      alert('Only citizen accounts can upvote issues.');
      return;
    }

    toggleUpvote(issueId);
  });

  // 3. Comment submission listener
  $('#commentForm').on('submit', function (e) {
    e.preventDefault();
    const commentText = $('#commentInput').val().trim();

    if (!commentText) {
      alert('Please enter a comment.');
      return;
    }

    $('#btnPostComment').prop('disabled', true).text('Posting...');

    $.ajax({
      url: `/api/issues/${issueId}/comment`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ text: commentText }),
      xhrFields: { withCredentials: true },
      success: function (res) {
        $('#btnPostComment').prop('disabled', false).text('Post Comment');
        $('#commentInput').val('');
        if (res.success && res.comments) {
          renderComments(res.comments);
        }
      },
      error: function (xhr) {
        $('#btnPostComment').prop('disabled', false).text('Post Comment');
        const err = xhr.responseJSON ? xhr.responseJSON.error : 'Failed to post comment.';
        alert(err);
      }
    });
  });
}

function fetchIssue(issueId) {
  $.ajax({
    url: `/api/issues/${issueId}`,
    method: 'GET',
    success: function (res) {
      $('#issueLoading').hide();
      if (res.success && res.issue) {
        currentIssue = res.issue;
        renderIssueDetail(currentIssue);
      } else {
        $('#issueDetailAlert').removeClass('alert-info').addClass('alert-danger')
          .text('Issue not found.').show();
      }
    },
    error: function (xhr) {
      $('#issueLoading').hide();
      const err = xhr.responseJSON ? xhr.responseJSON.error : 'Failed to retrieve issue.';
      $('#issueDetailAlert').removeClass('alert-info').addClass('alert-danger')
        .text(`Error: ${err}`).show();
    }
  });
}

function renderIssueDetail(issue) {
  $('#issueContainer').show();

  // Title & Basic Info
  $('#issueTitle').text(issue.title);
  $('#issueWard').text(`Ward: ${issue.ward}`);
  $('#issueAddress').text(issue.location ? issue.location.address : 'Address not specified');
  $('#issueDescription').text(issue.description);

  // GPS coordinates if available
  if (issue.location && issue.location.lat && issue.location.lng) {
    $('#issueCoordinates').text(`Coordinates: ${issue.location.lat.toFixed(4)}, ${issue.location.lng.toFixed(4)}`).show();
  } else {
    $('#issueCoordinates').hide();
  }

  // Badges
  $('#issueCategoryBadge')
    .text(issue.category.replace('_', ' '))
    .addClass('category-badge');

  $('#issueStatusBadge')
    .text(issue.status.replace('_', ' '))
    .attr('class', `badge badge-${issue.status}`);

  // Escalation alert
  if (issue.escalationLevel > 0) {
    $('#issueEscalationAlert')
      .html(`<span class="pulsing-dot"></span> <strong>ESCALATION ALERT:</strong> This issue has breached service level agreement (Tier ${issue.escalationLevel}). Priority municipal review in effect.`)
      .show();
  } else {
    $('#issueEscalationAlert').hide();
  }

  // Reporting and Assignment
  const reporterName = issue.reportedBy ? issue.reportedBy.name : 'Anonymous Citizen';
  $('#issueReportedBy').text(reporterName);
  $('#issueCreatedAt').text(new Date(issue.createdAt).toLocaleString());

  const authorityName = issue.assignedTo ? issue.assignedTo.name : 'Unassigned (General Pool)';
  $('#issueAssignedTo').text(authorityName);

  if (issue.resolvedAt) {
    $('#issueResolvedAtRow').show();
    $('#issueResolvedAt').text(new Date(issue.resolvedAt).toLocaleString());
  } else {
    $('#issueResolvedAtRow').hide();
  }

  // Photo
  if (issue.photo) {
    $('#issuePhoto').attr('src', issue.photo).show();
    $('#issuePhotoContainer').show();
  } else {
    $('#issuePhotoContainer').hide();
  }

  // Upvote Button State
  updateUpvoteButton(issue);

  // Stepper Timeline
  renderStepperTimeline(issue);

  // Comments
  renderComments(issue.comments || []);
}

function updateUpvoteButton(issue) {
  $('#upvoteCount').text(issue.upvoteCount || 0);

  let hasUpvoted = false;
  if (currentUser && issue.upvotes && issue.upvotes.length) {
    hasUpvoted = issue.upvotes.some(u => {
      const uId = u._id || u;
      return uId.toString() === currentUser.id.toString();
    });
  }

  if (hasUpvoted) {
    $('#btnUpvote').addClass('upvoted');
    $('#heartIcon').text('❤️');
  } else {
    $('#btnUpvote').removeClass('upvoted');
    $('#heartIcon').text('🤍');
  }

  if (!currentUser) {
    $('#btnUpvote').attr('title', 'Login to upvote');
  } else {
    $('#btnUpvote').removeAttr('title');
  }
}

function toggleUpvote(issueId) {
  $.ajax({
    url: `/api/issues/${issueId}/upvote`,
    method: 'POST',
    xhrFields: { withCredentials: true },
    success: function (res) {
      if (res.success) {
        $('#upvoteCount').text(res.upvoteCount);
        if (res.upvoted) {
          $('#btnUpvote').addClass('upvoted');
          $('#heartIcon').text('❤️');
        } else {
          $('#btnUpvote').removeClass('upvoted');
          $('#heartIcon').text('🤍');
        }
      }
    },
    error: function (xhr) {
      const err = xhr.responseJSON ? xhr.responseJSON.error : 'Failed to update upvote.';
      alert(err);
    }
  });
}

function renderStepperTimeline(issue) {
  const $timeline = $('#statusTimeline');
  $timeline.empty();

  // Standard pipeline order
  const steps = [
    { key: 'pending', label: '1. Issue Reported', defaultNote: 'Filed by citizen' },
    { key: 'acknowledged', label: '2. Acknowledged', defaultNote: 'Inspected and verified by Ward Officer' },
    { key: 'in_progress', label: '3. In Progress', defaultNote: 'Work order issued and remediation underway' },
    { key: 'resolved', label: '4. Resolved', defaultNote: 'Grievance cleared and certified by authority' }
  ];

  // Helper to determine status rank
  const statusRank = {
    'pending': 1,
    'acknowledged': 2,
    'in_progress': 3,
    'resolved': 4,
    'escalated': 2.5 // escalated can occur anywhere before resolution
  };

  const currentRank = statusRank[issue.status] || 1;

  // Find entries from statusHistory
  const historyMap = {};
  if (issue.statusHistory && issue.statusHistory.length) {
    issue.statusHistory.forEach(entry => {
      historyMap[entry.status] = entry;
    });
  }

  // Render standard stages
  steps.forEach((step, idx) => {
    const isCompleted = (statusRank[step.key] <= currentRank && issue.status !== 'pending') || (step.key === 'pending');
    const isCurrent = (issue.status === step.key);
    const hist = historyMap[step.key];

    let dateText = 'Pending completion';
    let noteText = step.defaultNote;

    if (step.key === 'pending') {
      dateText = new Date(issue.createdAt).toLocaleString();
    } else if (step.key === 'acknowledged' && issue.acknowledgedAt) {
      dateText = new Date(issue.acknowledgedAt).toLocaleString();
    } else if (step.key === 'resolved' && issue.resolvedAt) {
      dateText = new Date(issue.resolvedAt).toLocaleString();
    } else if (hist && hist.changedAt) {
      dateText = new Date(hist.changedAt).toLocaleString();
    }

    if (hist && hist.note) {
      noteText = hist.note;
    }

    const stepHtml = `
      <li class="step-item ${isCompleted ? 'completed' : ''}">
        <div class="step-circle">${isCompleted ? '✓' : (idx + 1)}</div>
        <div class="step-connector"></div>
        <div class="step-content">
          <div class="step-title">${step.label} ${isCurrent ? '<span class="badge badge-' + issue.status + '">CURRENT</span>' : ''}</div>
          <div class="step-date">🕒 ${dateText}</div>
          <div class="step-note">${escapeHtml(noteText)}</div>
        </div>
      </li>
    `;
    $timeline.append(stepHtml);

    // If there was an escalation between stages, display escalation card
    if (step.key === 'acknowledged' && issue.escalationLevel > 0) {
      const escHist = historyMap['escalated'];
      const escDate = escHist ? new Date(escHist.changedAt).toLocaleString() : 'Breach threshold reached';
      const escNote = escHist ? escHist.note : `Escalated to Tier ${issue.escalationLevel}`;

      $timeline.append(`
        <li class="step-item escalated">
          <div class="step-circle">!</div>
          <div class="step-connector"></div>
          <div class="step-content" style="border-left: 3px solid var(--danger); background: #fff5f5;">
            <div class="step-title" style="color: var(--danger);">🚨 Escalation Breach (Tier ${issue.escalationLevel})</div>
            <div class="step-date">🕒 ${escDate}</div>
            <div class="step-note">${escapeHtml(escNote)}</div>
          </div>
        </li>
      `);
    }
  });
}

function renderComments(comments) {
  const $list = $('#commentsList');
  $list.empty();

  $('#commentCountTitle').text(`Comments (${comments.length})`);

  if (comments.length === 0) {
    $list.append(`<p style="color: var(--gray); font-style: italic;">No comments posted yet. Be the first to share an update or question.</p>`);
    return;
  }

  comments.forEach(c => {
    const timeString = c.timestamp ? new Date(c.timestamp).toLocaleString() : '';
    const commentCard = `
      <div class="comment-card">
        <div class="comment-header">
          <span class="comment-author">👤 ${escapeHtml(c.userName || 'Citizen')}</span>
          <span class="comment-date">🕒 ${timeString}</span>
        </div>
        <div class="comment-text">${escapeHtml(c.text)}</div>
      </div>
    `;
    $list.append(commentCard);
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
