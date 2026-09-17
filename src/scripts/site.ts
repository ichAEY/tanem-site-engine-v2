const menuButton = document.querySelector<HTMLButtonElement>("[data-menu-button]");
const mobileMenu = document.querySelector<HTMLElement>("[data-mobile-menu]");

function closeMenu() {
  if (!menuButton || !mobileMenu) return;
  menuButton.setAttribute("aria-expanded", "false");
  mobileMenu.hidden = true;
  document.body.classList.remove("menu-open");
}

menuButton?.addEventListener("click", () => {
  if (!mobileMenu) return;
  const nextOpen = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(nextOpen));
  mobileMenu.hidden = !nextOpen;
  document.body.classList.toggle("menu-open", nextOpen);
});

mobileMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

const tabs = document.querySelector<HTMLElement>("[data-tabs]");
const tabsWrap = document.querySelector<HTMLElement>("[data-tabs-wrap]");
const groupsRoot = document.querySelector<HTMLElement>("[data-service-groups]");
const globalShowMore = document.querySelector<HTMLButtonElement>("[data-show-all-services]");
const tabButtons = tabs
  ? [...tabs.querySelectorAll<HTMLButtonElement>("[data-category-tab]")]
  : [];

function updateTabOverflow() {
  if (!tabs || !tabsWrap) return;
  tabs.classList.add("is-measuring");
  tabs.classList.remove("is-overflowing");
  const overflowing = tabs.scrollWidth > tabs.clientWidth + 2;
  tabs.classList.remove("is-measuring");
  tabs.classList.toggle("is-overflowing", overflowing);
  tabsWrap.classList.toggle("has-overflow", overflowing);
  tabsWrap.classList.toggle("at-end", !overflowing || tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 4);
}

function activateCategory(category: string, selectedTab?: HTMLButtonElement) {
  if (!groupsRoot) return;
  groupsRoot.dataset.activeCategory = category;
  groupsRoot.querySelectorAll<HTMLElement>("[data-category-group]").forEach((group) => {
    group.hidden = category !== "all" && group.dataset.categoryGroup !== category;
  });

  tabButtons.forEach((button) => {
    const selected = button.dataset.categoryTab === category;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });

  if (globalShowMore) {
    globalShowMore.hidden = category !== "all";
  }

  selectedTab?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => activateCategory(button.dataset.categoryTab || "all", button));
});

tabs?.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || !tabButtons.length) return;
  event.preventDefault();
  const currentIndex = Math.max(0, tabButtons.indexOf(document.activeElement as HTMLButtonElement));
  let nextIndex = currentIndex;
  if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
  if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabButtons.length;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = tabButtons.length - 1;
  tabButtons[nextIndex].focus();
  tabButtons[nextIndex].click();
});

tabs?.addEventListener("scroll", () => {
  if (!tabsWrap) return;
  tabsWrap.classList.toggle("at-end", tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 4);
}, { passive: true });

if (groupsRoot) activateCategory(groupsRoot.dataset.activeCategory || "all");
if (tabs) {
  const observer = new ResizeObserver(updateTabOverflow);
  observer.observe(tabs);
  window.addEventListener("load", updateTabOverflow, { once: true });
}

document.querySelectorAll<HTMLButtonElement>("[data-show-more]").forEach((button) => {
  button.addEventListener("click", () => {
    const group = button.closest<HTMLElement>("[data-category-group]");
    if (!group) return;
    const expanded = group.classList.toggle("is-expanded");
    button.setAttribute("aria-expanded", String(expanded));
    button.textContent = expanded ? "Свернуть список" : button.dataset.collapsedLabel || "Показать ещё";
  });
});

globalShowMore?.addEventListener("click", () => {
  if (!groupsRoot) return;
  const expanded = groupsRoot.classList.toggle("is-all-expanded");
  globalShowMore.setAttribute("aria-expanded", String(expanded));
  globalShowMore.textContent = expanded ? "Свернуть список" : "Открыть все услуги";
});

const galleryDialog = document.querySelector<HTMLDialogElement>("[data-gallery-dialog]");
const galleryImage = galleryDialog?.querySelector<HTMLImageElement>("[data-gallery-image]");
const galleryCaption = galleryDialog?.querySelector<HTMLElement>("[data-gallery-caption]");
const galleryIndex = galleryDialog?.querySelector<HTMLElement>("[data-gallery-index]");
const galleryDataNode = galleryDialog?.querySelector<HTMLScriptElement>("[data-gallery-data]");
let galleryItems: Array<{ src: string; alt: string }> = [];
let currentGalleryIndex = 0;

try {
  galleryItems = galleryDataNode?.textContent ? JSON.parse(galleryDataNode.textContent) : [];
} catch {
  galleryItems = [];
}

function showGalleryItem(index: number) {
  if (!galleryImage || !galleryItems.length) return;
  currentGalleryIndex = (index + galleryItems.length) % galleryItems.length;
  const item = galleryItems[currentGalleryIndex];
  galleryImage.src = item.src;
  galleryImage.alt = item.alt;
  if (galleryCaption) galleryCaption.textContent = item.alt;
  if (galleryIndex) galleryIndex.textContent = String(currentGalleryIndex + 1);
}

document.querySelectorAll<HTMLButtonElement>("[data-gallery-open]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!galleryDialog) return;
    showGalleryItem(Number(button.dataset.galleryOpen || 0));
    galleryDialog.showModal();
  });
});

galleryDialog?.querySelector("[data-gallery-close]")?.addEventListener("click", () => galleryDialog.close());
galleryDialog?.querySelector("[data-gallery-prev]")?.addEventListener("click", () => showGalleryItem(currentGalleryIndex - 1));
galleryDialog?.querySelector("[data-gallery-next]")?.addEventListener("click", () => showGalleryItem(currentGalleryIndex + 1));
galleryDialog?.addEventListener("click", (event) => {
  if (event.target === galleryDialog) galleryDialog.close();
});

const openStatus = document.querySelector<HTMLElement>("[data-open-status]");
const hoursNode = document.querySelector<HTMLScriptElement>("[data-hours]");

type DayHours = { day: number; open?: string; close?: string; closed?: boolean };

function timeToMinutes(value?: string) {
  if (!value) return -1;
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function updateOpenStatus() {
  if (!openStatus || !hoursNode?.textContent) return;
  try {
    const config = JSON.parse(hoursNode.textContent) as { timezone: string; hours: DayHours[] };
    if (!config.hours.length) return;

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: config.timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const weekday = parts.find((part) => part.type === "weekday")?.value || "Sun";
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const now = Number(parts.find((part) => part.type === "hour")?.value || 0) * 60 +
      Number(parts.find((part) => part.type === "minute")?.value || 0);
    const today = config.hours.find((item) => item.day === dayMap[weekday]);

    openStatus.classList.remove("is-open", "is-closed");
    if (today && !today.closed && today.open && today.close) {
      const opens = timeToMinutes(today.open);
      const closes = timeToMinutes(today.close);
      if (now >= opens && now < closes) {
        openStatus.textContent = `Открыто до ${today.close}`;
        openStatus.classList.add("is-open");
        return;
      }
      if (now < opens) {
        openStatus.textContent = `Откроется сегодня в ${today.open}`;
        openStatus.classList.add("is-closed");
        return;
      }
    }

    for (let offset = 1; offset <= 7; offset += 1) {
      const candidateDay = (dayMap[weekday] + offset) % 7;
      const candidate = config.hours.find((item) => item.day === candidateDay);
      if (candidate && !candidate.closed && candidate.open) {
        openStatus.textContent = offset === 1
          ? `Откроется завтра в ${candidate.open}`
          : `Ближайшая запись с ${candidate.open}`;
        openStatus.classList.add("is-closed");
        return;
      }
    }
  } catch {
    // The static schedule label remains visible if data cannot be parsed.
  }
}

updateOpenStatus();
