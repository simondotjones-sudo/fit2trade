// Fit2Trade's lightweight site enhancements. The website does not require JavaScript to render.

document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const navigationGroups = [...document.querySelectorAll(".desktop-nav > details")];

navigationGroups.forEach((group) => {
  group.addEventListener("toggle", () => {
    if (!group.open) return;
    navigationGroups.forEach((otherGroup) => {
      if (otherGroup !== group) otherGroup.open = false;
    });
  });
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".site-header")) return;
  navigationGroups.forEach((group) => { group.open = false; });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  const activeElement = document.activeElement;
  const activeDesktopGroup = navigationGroups.find((group) => group.open && group.contains(activeElement));
  const activeMobileMenu = [...document.querySelectorAll(".mobile-menu[open]")].find((menu) => menu.contains(activeElement));

  navigationGroups.forEach((group) => { group.open = false; });
  document.querySelectorAll(".mobile-menu[open]").forEach((menu) => { menu.open = false; });

  const menuToRefocus = activeDesktopGroup || activeMobileMenu;
  if (menuToRefocus) {
    menuToRefocus.querySelector("summary")?.focus();
  }
});
