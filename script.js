/**
 * Maama's Care Women Hostel — Interactive Frontend Logic
 * Pure Vanilla JavaScript + Bootstrap 5 API
 */

// ============================================================================
// 1. GOOGLE APPS SCRIPT INTEGRATION CONFIGURATION
// Replace with your deployed Google Apps Script Web App URL (ending in /exec)
// ============================================================================
const GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";

document.addEventListener("DOMContentLoaded", () => {
  syncDynamicCanonicalMeta();
  initNavbarScrollAndCollapse();
  initTariffModeToggle();
  initRoomEnquiryLinks();
  initGalleryFilterAndLightbox();
  initEnquiryForm();
  initImageFallbacks();
  setCurrentYear();
});

/**
 * Sync canonical and OpenGraph URL dynamically for SPA / Live Server / Cloud Run
 */
function syncDynamicCanonicalMeta() {
  const currentUrl = window.location.origin + window.location.pathname;
  const canonicalEl = document.querySelector('link[rel="canonical"]');
  const ogUrlEl = document.querySelector('meta[property="og:url"]');
  if (canonicalEl) canonicalEl.setAttribute("href", currentUrl);
  if (ogUrlEl) ogUrlEl.setAttribute("content", currentUrl);
}

/**
 * Sticky navbar elevation on scroll + auto-collapse mobile menu on link click
 */
function initNavbarScrollAndCollapse() {
  const navbar = document.getElementById("mainNavbar");
  const navCollapseEl = document.getElementById("navbarNav");
  const navLinks = document.querySelectorAll(".bn-nav-link");

  const updateNavShadow = () => {
    if (!navbar) return;
    navbar.classList.toggle("is-scrolled", window.scrollY > 18);
  };

  updateNavShadow();
  window.addEventListener("scroll", updateNavShadow, { passive: true });

  // Auto-close Bootstrap mobile drawer when a link is clicked
  if (navCollapseEl && window.bootstrap) {
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (navCollapseEl.classList.contains("show")) {
          const instance = window.bootstrap.Collapse.getOrCreateInstance(navCollapseEl);
          instance.hide();
        }
      });
    });
  }

  // Lightweight IntersectionObserver to highlight active section nav link
  const sections = document.querySelectorAll("main section[id]");
  if ("IntersectionObserver" in window && sections.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("id");
            navLinks.forEach((link) => {
              const matches = link.getAttribute("href") === `#${id}`;
              link.classList.toggle("active", matches);
            });
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0.01 }
    );

    sections.forEach((section) => observer.observe(section));
  }
}

/**
 * Interactive AC / Non-AC Room Tariff Toggle
 */
function initTariffModeToggle() {
  const toggleButtons = document.querySelectorAll("[data-tariff-mode]");
  const priceElements = document.querySelectorAll("[data-price-ac]");
  const climateMetaElements = document.querySelectorAll("[data-meta-ac]");

  if (!toggleButtons.length) return;

  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.getAttribute("data-tariff-mode"); // "ac" or "non-ac"

      toggleButtons.forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle("is-active", isActive);
        b.setAttribute("aria-pressed", String(isActive));
      });

      priceElements.forEach((el) => {
        const nextPrice =
          mode === "non-ac"
            ? el.getAttribute("data-price-non-ac")
            : el.getAttribute("data-price-ac");
        if (nextPrice) {
          el.textContent = nextPrice;
        }
      });

      climateMetaElements.forEach((el) => {
        const nextMeta =
          mode === "non-ac"
            ? el.getAttribute("data-meta-non-ac")
            : el.getAttribute("data-meta-ac");
        if (nextMeta) {
          el.textContent = nextMeta;
        }
      });
    });
  });
}

/**
 * "Enquire Now" buttons on room cards auto-select the room in the Enquiry Form
 */
function initRoomEnquiryLinks() {
  const enquireButtons = document.querySelectorAll("[data-room-select]");
  const sharingSelect = document.getElementById("sharingType");
  const coolingSelect = document.getElementById("coolingPref");
  const contactSection = document.getElementById("contact");
  const nameInput = document.getElementById("fullName");

  if (!enquireButtons.length || !sharingSelect) return;

  enquireButtons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      const selectedRoom = btn.getAttribute("data-room-select");
      if (selectedRoom) {
        sharingSelect.value = selectedRoom;
        sharingSelect.classList.remove("bn-select-highlight");
        // Trigger reflow so repeat clicks re-run highlight animation
        void sharingSelect.offsetWidth;
        sharingSelect.classList.add("bn-select-highlight");
      }

      if (coolingSelect) {
        const activeModeBtn = document.querySelector("[data-tariff-mode].is-active");
        const mode = activeModeBtn?.getAttribute("data-tariff-mode");
        const isSingle = selectedRoom?.startsWith("Single");
        coolingSelect.value = !isSingle && mode === "non-ac" ? "Non-AC Room" : "AC Room";
      }

      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      window.setTimeout(() => {
        if (nameInput) nameInput.focus({ preventScroll: true });
      }, 450);
    });
  });
}

/**
 * Photo Gallery Category Filtering + Bootstrap Lightbox Modal with Prev/Next
 */
function initGalleryFilterAndLightbox() {
  const filterButtons = document.querySelectorAll("[data-gallery-filter]");
  const galleryItems = Array.from(document.querySelectorAll(".bn-gallery-item"));
  const modalEl = document.getElementById("galleryLightboxModal");

  if (!galleryItems.length) return;

  // Category filter buttons
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const category = btn.getAttribute("data-gallery-filter");

      filterButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });

      galleryItems.forEach((item) => {
        const itemCat = item.getAttribute("data-gallery-category");
        const shouldShow = category === "all" || itemCat === category;
        item.classList.toggle("is-hidden", !shouldShow);
      });
    });
  });

  // Lightbox Modal Controls
  if (!modalEl || !window.bootstrap) return;

  const lightboxImg = document.getElementById("lightboxImage");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxCounter = document.getElementById("lightboxCounter");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");

  const modalInstance = window.bootstrap.Modal.getOrCreateInstance(modalEl);
  let visibleCards = [];
  let activeIndex = 0;

  const renderLightboxSlide = (index) => {
    if (!visibleCards.length) return;
    activeIndex = (index + visibleCards.length) % visibleCards.length;
    const card = visibleCards[activeIndex];
    const src = card.getAttribute("data-src") || "";
    const alt = card.getAttribute("data-alt") || "";
    const title = card.getAttribute("data-title") || "";
    const caption = card.getAttribute("data-caption") || "";

    if (lightboxImg) {
      lightboxImg.src = src;
      lightboxImg.alt = alt;
    }
    if (lightboxTitle) lightboxTitle.textContent = title;
    if (lightboxCaption) lightboxCaption.textContent = caption;
    if (lightboxCounter) {
      lightboxCounter.textContent = `${activeIndex + 1} / ${visibleCards.length}`;
    }
  };

  galleryItems.forEach((item) => {
    const trigger = item.querySelector(".bn-gallery-card");
    if (!trigger) return;

    trigger.addEventListener("click", () => {
      visibleCards = galleryItems
        .filter((el) => !el.classList.contains("is-hidden"))
        .map((el) => el.querySelector(".bn-gallery-card"))
        .filter(Boolean);

      const clickedIdx = visibleCards.indexOf(trigger);
      renderLightboxSlide(clickedIdx >= 0 ? clickedIdx : 0);
      modalInstance.show();
    });
  });

  if (prevBtn) {
    prevBtn.addEventListener("click", () => renderLightboxSlide(activeIndex - 1));
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => renderLightboxSlide(activeIndex + 1));
  }

  document.addEventListener("keydown", (event) => {
    if (!modalEl.classList.contains("show")) return;
    if (event.key === "ArrowLeft") renderLightboxSlide(activeIndex - 1);
    if (event.key === "ArrowRight") renderLightboxSlide(activeIndex + 1);
  });
}

/**
 * Enquiry & Visit Booking Form Validation + Google Apps Script POST Submission
 */
function initEnquiryForm() {
  const form = document.getElementById("enquiryForm");
  const moveInInput = document.getElementById("moveInDate");
  const phoneInput = document.getElementById("phoneNumber");
  const submitBtn = document.getElementById("submitEnquiryBtn");
  const btnText = submitBtn?.querySelector(".bn-btn-label");
  const btnSpinner = submitBtn?.querySelector(".spinner-border");
  const inlineStatus = document.getElementById("formInlineStatus");
  const inlineStatusText = document.getElementById("formInlineStatusText");
  const toastEl = document.getElementById("enquiryToast");
  const toastBody = document.getElementById("enquiryToastBody");

  // Restrict move-in date to today or future
  if (moveInInput) {
    const today = new Date().toISOString().split("T")[0];
    moveInInput.setAttribute("min", today);
  }

  // Strip non-digit characters in phone number field for cleaner UX
  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      const cleaned = phoneInput.value.replace(/[^\d+\s-]/g, "");
      if (phoneInput.value !== cleaned) {
        phoneInput.value = cleaned;
      }
      validateIndianPhone(phoneInput);
    });
  }

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (phoneInput) validateIndianPhone(phoneInput);
    form.classList.add("was-validated");

    if (!form.checkValidity()) {
      const firstInvalid = form.querySelector(":invalid");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const payload = {
      name: document.getElementById("fullName")?.value.trim() || "",
      phone: phoneInput?.value.trim() || "",
      profession: document.getElementById("profession")?.value || "",
      sharingType: document.getElementById("sharingType")?.value || "",
      coolingPref: document.getElementById("coolingPref")?.value || "AC Room",
      preferredArea: document.getElementById("preferredArea")?.value || "Not Specified",
      moveInDate: moveInInput?.value || "",
      message: document.getElementById("enquiryMessage")?.value.trim() || "",
      source: "Maama's Care Women Hostel Website",
      submittedAt: new Date().toISOString(),
    };

    setLoadingState(true);
    hideInlineStatus();

    try {
      const isPlaceholderUrl =
        !GOOGLE_SCRIPT_URL ||
        GOOGLE_SCRIPT_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL" ||
        !GOOGLE_SCRIPT_URL.startsWith("http");

      if (!isPlaceholderUrl) {
        // Using text/plain with JSON string avoids CORS preflight issues with Google Apps Script
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Graceful local preview delay when Google Apps Script URL is not yet configured
        await new Promise((resolve) => window.setTimeout(resolve, 700));
      }

      const confirmationMsg = `Thank you, ${payload.name}! Your visit & enquiry request at Maama's Care Women Hostel (${payload.sharingType}) has been received. Our female warden will call you within 30 minutes.`;

      showInlineStatus("success", confirmationMsg);
      showToast(confirmationMsg);

      form.reset();
      form.classList.remove("was-validated");
    } catch (error) {
      console.error("Enquiry submission error:", error);
      const errorMsg =
        "We could not send your enquiry right now. Please try again or call/WhatsApp us directly at +91 78248 09809.";
      showInlineStatus("error", errorMsg);
      showToast(errorMsg);
    } finally {
      setLoadingState(false);
    }
  });

  function validateIndianPhone(input) {
    const digitsOnly = input.value.replace(/\D/g, "");
    const normalized = digitsOnly.length === 12 && digitsOnly.startsWith("91")
      ? digitsOnly.slice(2)
      : digitsOnly;
    const isValid = /^[6-9]\d{9}$/.test(normalized);
    input.setCustomValidity(isValid ? "" : "Enter a valid 10-digit Indian mobile number.");
  }

  function setLoadingState(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    if (btnText) {
      btnText.textContent = isLoading ? "Submitting Enquiry..." : "Schedule Free Visit";
    }
    if (btnSpinner) {
      btnSpinner.classList.toggle("d-none", !isLoading);
    }
  }

  function showInlineStatus(type, message) {
    if (!inlineStatus || !inlineStatusText) return;
    inlineStatus.classList.remove("is-success", "is-error");
    inlineStatus.classList.add("is-visible", type === "success" ? "is-success" : "is-error");
    inlineStatusText.textContent = message;
  }

  function hideInlineStatus() {
    if (!inlineStatus) return;
    inlineStatus.classList.remove("is-visible", "is-success", "is-error");
  }

  function showToast(message) {
    if (!toastEl || !toastBody || !window.bootstrap) return;
    toastBody.textContent = message;
    const toastInstance = window.bootstrap.Toast.getOrCreateInstance(toastEl, {
      delay: 6000,
    });
    toastInstance.show();
  }
}

/**
 * Zero-Broken-Image Policy: Graceful styled fallback if an image fails to load
 */
function initImageFallbacks() {
  document.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", () => {
      if (img.dataset.fallbackApplied === "true") return;
      img.dataset.fallbackApplied = "true";
      const label = img.getAttribute("alt") || "Maama's Care Women Hostel";
      const wrapper = img.parentElement;
      if (!wrapper) return;

      const fallback = document.createElement("div");
      fallback.className = "bn-img-fallback";
      fallback.innerHTML = `<i class="bi bi-house-heart" aria-hidden="true"></i><span class="small fw-semibold">${label}</span>`;
      img.replaceWith(fallback);
    });
  });
}

function setCurrentYear() {
  const yearEl = document.getElementById("currentYear");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}
