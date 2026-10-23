document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");

  if (sidebar) {
    sidebar.addEventListener("mouseenter", () => {
      sidebar.classList.remove("collapsed");
    });

    sidebar.addEventListener("mouseleave", () => {
      sidebar.classList.add("collapsed");
    });
  }

  const dropdownTrigger = document.querySelector(".dropdown-trigger");
  const dropdownMenu = document.querySelector(".dropdown-trigger .dropdown-menu");

  if (dropdownTrigger && dropdownMenu) {
    dropdownTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      dropdownMenu.classList.remove("show");
    });
  }
});
