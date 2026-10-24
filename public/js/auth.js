// auth.js - jQuery authentication logic for Login and Register pages

const CHENNAI_WARDS = [
  'Adyar', 'Anna Nagar', 'T Nagar', 'Mylapore', 'Velachery',
  'Kodambakkam', 'Tambaram', 'Perambur', 'Royapuram', 'Tondiarpet'
];

$(document).ready(function () {
  // Populate ward select on registration form
  const $wardSelect = $('#regWard');
  if ($wardSelect.length) {
    $wardSelect.empty().append('<option value="">-- Select Ward --</option>');
    CHENNAI_WARDS.forEach(w => {
      $wardSelect.append(`<option value="${w}">${w}</option>`);
    });
  }

  // Check URL parameters for any messages (e.g., registered=true)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('registered') === 'true') {
    $('#authAlert')
      .removeClass('alert-danger')
      .addClass('alert-success')
      .text('Registration successful! Please login with your credentials.')
      .show();
  }

  // 1. LOGIN FORM HANDLER
  $('#loginForm').on('submit', function (e) {
    e.preventDefault();

    const email = $('#loginEmail').val().trim();
    const password = $('#loginPassword').val();
    let isValid = true;

    $('.form-control').removeClass('is-invalid');
    $('.error-message').hide();
    $('#authAlert').hide();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      $('#loginEmail').addClass('is-invalid');
      $('#emailError').text('Please enter a valid email address.').show();
      isValid = false;
    }

    // Password validation (min 6 chars)
    if (!password || password.length < 6) {
      $('#loginPassword').addClass('is-invalid');
      $('#passwordError').text('Password must be at least 6 characters long.').show();
      isValid = false;
    }

    if (!isValid) return;

    $('#loginBtn').prop('disabled', true).text('Signing In...');

    $.ajax({
      url: '/api/auth/login',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ email, password }),
      xhrFields: { withCredentials: true },
      success: function (res) {
        if (res.success && res.user) {
          sessionStorage.setItem('civictrack_user', JSON.stringify(res.user));
          
          // Role-based redirect
          if (res.user.role === 'authority') {
            window.location.href = '/pages/authority-dashboard.html';
          } else if (res.user.role === 'citizen') {
            const redirectParam = urlParams.get('redirect');
            if (redirectParam === 'report') {
              window.location.href = '/pages/report.html';
            } else {
              window.location.href = '/pages/citizen-dashboard.html';
            }
          } else {
            window.location.href = '/';
          }
        } else {
          $('#loginBtn').prop('disabled', false).text('Sign In');
          $('#authAlert')
            .removeClass('alert-success')
            .addClass('alert-danger')
            .text(res.error || 'Login failed. Please check your credentials.')
            .show();
        }
      },
      error: function (xhr) {
        $('#loginBtn').prop('disabled', false).text('Sign In');
        const err = xhr.responseJSON ? xhr.responseJSON.error : 'Network error occurred during login.';
        $('#authAlert')
          .removeClass('alert-success')
          .addClass('alert-danger')
          .text(err)
          .show();
      }
    });
  });

  // 2. REGISTRATION FORM HANDLER
  $('#registerForm').on('submit', function (e) {
    e.preventDefault();

    const name = $('#regName').val().trim();
    const email = $('#regEmail').val().trim();
    const password = $('#regPassword').val();
    const confirmPassword = $('#regConfirmPassword').val();
    const phone = $('#regPhone').val().trim();
    const ward = $('#regWard').val();
    let isValid = true;

    $('.form-control').removeClass('is-invalid');
    $('.error-message').hide();
    $('#authAlert').hide();

    // Name validation: required, only letters and spaces
    if (!name || !/^[a-zA-Z\s]+$/.test(name)) {
      $('#regName').addClass('is-invalid');
      $('#nameError').text('Full name must contain only letters and spaces.').show();
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      $('#regEmail').addClass('is-invalid');
      $('#emailError').text('Please enter a valid email address.').show();
      isValid = false;
    }

    // Password validation: min 6 chars, at least one number
    if (!password || !/^(?=.*\d).{6,}$/.test(password)) {
      $('#regPassword').addClass('is-invalid');
      $('#passwordError').text('Password must be at least 6 characters and include at least one number.').show();
      isValid = false;
    }

    // Confirm password validation
    if (password !== confirmPassword) {
      $('#regConfirmPassword').addClass('is-invalid');
      $('#confirmPasswordError').text('Passwords do not match.').show();
      isValid = false;
    }

    // Phone validation: Indian mobile regex /^[6-9]\d{9}$/
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      $('#regPhone').addClass('is-invalid');
      $('#phoneError').text('Enter a valid 10-digit Indian mobile number (e.g. 9840123456).').show();
      isValid = false;
    }

    // Ward validation
    if (!ward) {
      $('#regWard').addClass('is-invalid');
      $('#wardError').text('Please select your municipal ward.').show();
      isValid = false;
    }

    if (!isValid) return;

    $('#registerBtn').prop('disabled', true).text('Creating Account...');

    $.ajax({
      url: '/api/auth/register',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        name,
        email,
        password,
        phone,
        ward,
        role: 'citizen'
      }),
      xhrFields: { withCredentials: true },
      success: function (res) {
        if (res.success) {
          window.location.href = '/pages/login.html?registered=true';
        } else {
          $('#registerBtn').prop('disabled', false).text('Register as Citizen');
          $('#authAlert')
            .removeClass('alert-success')
            .addClass('alert-danger')
            .text(res.error || 'Registration failed.')
            .show();
        }
      },
      error: function (xhr) {
        $('#registerBtn').prop('disabled', false).text('Register as Citizen');
        const err = xhr.responseJSON ? xhr.responseJSON.error : 'Network error during registration.';
        $('#authAlert')
          .removeClass('alert-success')
          .addClass('alert-danger')
          .text(err)
          .show();
      }
    });
  });
});
