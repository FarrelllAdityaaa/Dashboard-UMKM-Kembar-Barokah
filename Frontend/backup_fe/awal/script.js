// Load navbar ke halaman lain
fetch('../layouts/navbar/navbar.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('navbar-placeholder').innerHTML = data;
  });
