// main.js

document.addEventListener("DOMContentLoaded", function () {
  // Navigation toggle for mobile devices
  const toggleButton = document.querySelector(".toggle-button");
  const navCollapse = document.querySelector(".collapse");

  toggleButton.addEventListener("click", function () {
    navCollapse.classList.toggle("show");
  });

  // Image click event
  const imageBoxes = document.querySelectorAll(".image-box");

  imageBoxes.forEach((box) => {
    box.addEventListener("click", function () {
      // Replace this alert with your desired action
      alert(`Clicked on ${box.dataset.title}`);
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const loadMoreButton = document.getElementById("load-more-posts");

  loadMoreButton.addEventListener("click", function () {
    // Implement your logic to load more posts here
    alert("Load more posts functionality will be implemented here.");
  });
});
