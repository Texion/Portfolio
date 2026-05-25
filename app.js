(function () {
  const world = document.querySelector("#world");
  const viewport = document.querySelector("#portfolio");
  const targetButtons = Array.from(document.querySelectorAll("[data-target]"));
  const navButtons = Array.from(document.querySelectorAll(".nav-map [data-target]"));
  const edgeButtons = Array.from(document.querySelectorAll("[data-direction]"));
  const viewLabel = document.querySelector(".view-label");
  const form = document.querySelector(".contact-form");
  const formStatus = document.querySelector(".form-status");
  const presentationPanel = document.querySelector(".panel-presentation");
  const revealProfileButton = document.querySelector("[data-reveal-profile]");
  const profileReveal = document.querySelector("[data-profile-reveal]");
  const carouselSlides = Array.from(document.querySelectorAll(".carousel-slide"));
  const carouselDots = Array.from(document.querySelectorAll("[data-slide-target]"));
  const carouselControls = Array.from(document.querySelectorAll("[data-carousel]"));

  const views = {
    presentation: { x: 1, y: 1, label: "Présentation" },
    etudes: { x: 1, y: 0, label: "Études" },
    parcours: { x: 1, y: 2, label: "Parcours professionnel" },
    realisations: { x: 0, y: 1, label: "Réalisations" },
    contact: { x: 2, y: 1, label: "Contact" },
  };

  const routes = {
    presentation: {
      up: "etudes",
      down: "parcours",
      left: "realisations",
      right: "contact",
    },
    etudes: { down: "presentation" },
    parcours: { up: "presentation" },
    realisations: { right: "presentation" },
    contact: { left: "presentation" },
  };

  const directionLabels = {
    up: "Études",
    down: "Parcours",
    left: "Réalisations",
    right: "Contact",
  };

  const reverseLabels = {
    up: "Présentation",
    down: "Présentation",
    left: "Présentation",
    right: "Présentation",
  };

  let currentView = "presentation";
  let activeSlide = 0;
  let isViewTransitioning = false;
  let lastWheelMove = 0;
  let touchStart = null;

  function normalizeView(value) {
    return views[value] ? value : "presentation";
  }

  function setView(nextView, updateHash = true) {
    currentView = normalizeView(nextView);
    const view = views[currentView];

    world.style.setProperty("--view-x", view.x);
    world.style.setProperty("--view-y", view.y);
    document.body.dataset.view = currentView;
    viewLabel.textContent = view.label;

    navButtons.forEach((button) => {
      const isCurrent = button.dataset.target === currentView;
      if (isCurrent) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    edgeButtons.forEach((button) => {
      const direction = button.dataset.direction;
      const target = routes[currentView][direction];
      const label = button.querySelector("span");

      button.disabled = !target;
      button.setAttribute(
        "aria-label",
        target ? `Aller vers ${views[target].label}` : "Direction indisponible"
      );

      if (label) {
        label.textContent = currentView === "presentation" ? directionLabels[direction] : reverseLabels[direction];
      }
    });

    if (updateHash && window.location.hash !== `#${currentView}`) {
      history.pushState(null, "", `#${currentView}`);
    }

    const activePanel = document.getElementById(currentView);
    if (activePanel) {
      activePanel.scrollTop = 0;
    }
  }

  function move(direction) {
    const target = routes[currentView][direction];
    if (target) {
      transitionToView(target);
    }
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function transitionToView(nextView, updateHash = true) {
    const normalizedView = normalizeView(nextView);
    if (normalizedView === currentView) return;

    if (prefersReducedMotion()) {
      setView(normalizedView, updateHash);
      return;
    }

    if (isViewTransitioning) return;
    isViewTransitioning = true;
    setView(normalizedView, updateHash);

    window.setTimeout(() => {
      isViewTransitioning = false;
    }, 700);
  }

  function setActiveSlide(index) {
    if (!carouselSlides.length) return;
    activeSlide = (index + carouselSlides.length) % carouselSlides.length;

    carouselSlides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeSlide;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    carouselDots.forEach((dot, dotIndex) => {
      if (dotIndex === activeSlide) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  }

  function revealProfile() {
    if (!presentationPanel || !profileReveal || presentationPanel.classList.contains("is-profile-visible")) {
      return;
    }

    if (revealProfileButton) {
      revealProfileButton.disabled = true;
    }

    presentationPanel.classList.add("is-fading-intro");

    window.setTimeout(
      () => {
        profileReveal.removeAttribute("aria-hidden");
        presentationPanel.classList.add("is-profile-visible");
        presentationPanel.classList.remove("is-fading-intro");
      },
      prefersReducedMotion() ? 0 : 360
    );
  }

  targetButtons.forEach((button) => {
    button.addEventListener("click", () => transitionToView(button.dataset.target));
  });

  if (revealProfileButton) {
    revealProfileButton.addEventListener("click", revealProfile);
  }

  edgeButtons.forEach((button) => {
    button.addEventListener("click", () => move(button.dataset.direction));
  });

  carouselControls.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveSlide(activeSlide + (button.dataset.carousel === "next" ? 1 : -1));
    });
  });

  carouselDots.forEach((button) => {
    button.addEventListener("click", () => setActiveSlide(Number(button.dataset.slideTarget)));
  });

  window.addEventListener("hashchange", () => {
    transitionToView(normalizeView(window.location.hash.replace("#", "")), false);
  });

  window.addEventListener(
    "wheel",
    (event) => {
      const now = Date.now();
      if (now - lastWheelMove < 650) return;

      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      const direction = horizontal
        ? event.deltaX > 16
          ? "right"
          : event.deltaX < -16
            ? "left"
            : null
        : event.deltaY > 16
          ? "down"
          : event.deltaY < -16
            ? "up"
            : null;

      if (direction && routes[currentView][direction]) {
        event.preventDefault();
        lastWheelMove = now;
        move(direction);
      }
    },
    { passive: false }
  );

  window.addEventListener("keydown", (event) => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    const keyMap = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };

    if (keyMap[event.key]) {
      event.preventDefault();
      move(keyMap[event.key]);
    }
  });

  window.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      touchStart = { x: touch.clientX, y: touch.clientY };
    },
    { passive: true }
  );

  window.addEventListener(
    "touchend",
    (event) => {
      if (!touchStart) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStart.x;
      const dy = touch.clientY - touchStart.y;
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      touchStart = null;

      if (distance < 48) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        move(dx < 0 ? "right" : "left");
      } else {
        move(dy < 0 ? "down" : "up");
      }
    },
    { passive: true }
  );

  function encodeMailto(payload) {
    const subject = encodeURIComponent(`Portfolio - ${payload.subject}`);
    const body = encodeURIComponent(
      `Nom: ${payload.name}\nEmail: ${payload.email}\n\n${payload.message}`
    );
    return `mailto:laurent.schaeffer20@gmail.com?subject=${subject}&body=${body}`;
  }

  function readPayload() {
    const data = new FormData(form);
    return {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      subject: String(data.get("subject") || "").trim(),
      message: String(data.get("message") || "").trim(),
      company: String(data.get("company") || "").trim(),
    };
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = readPayload();
      const submitButton = form.querySelector("button[type='submit']");

      if (payload.company) {
        form.reset();
        form.classList.remove("was-submitted");
        formStatus.textContent = "Merci, votre message a bien été pris en compte.";
        return;
      }

      form.classList.add("was-submitted");
      if (!form.reportValidity()) return;

      submitButton.disabled = true;
      formStatus.textContent = "Envoi en cours...";

      try {
        const response = await fetch(form.dataset.endpoint || form.action, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.ok === false) {
          throw new Error(result.error || "send_failed");
        }

        form.reset();
        form.classList.remove("was-submitted");
        formStatus.textContent = "Merci, votre message a bien été envoyé.";
      } catch (error) {
        window.location.href = encodeMailto(payload);
        formStatus.textContent = "Votre messagerie va s’ouvrir pour finaliser l’envoi.";
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  // ── Career ticker : boucle seamless ──────────────────────────────────────
  const careerTicker = document.querySelector(".career-ticker");
  const careerGroup = document.querySelector(".career-group");

  if (careerTicker && careerGroup && !prefersReducedMotion()) {
    // Dupliquer le groupe pour la boucle infinie
    const clone = careerGroup.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    careerTicker.appendChild(clone);

    // Mesurer la hauteur du groupe original et définir l'offset
    const setTickerOffset = () => {
      const h = careerGroup.getBoundingClientRect().height;
      if (h > 0) {
        careerTicker.style.setProperty("--ticker-offset", `-${h}px`);
      }
    };

    // Double rAF pour s'assurer que le layout est calculé
    requestAnimationFrame(() => requestAnimationFrame(setTickerOffset));

    // Recalculer en cas de redimensionnement
    window.addEventListener("resize", setTickerOffset, { passive: true });
  }
  // ─────────────────────────────────────────────────────────────────────────

  setView(normalizeView(window.location.hash.replace("#", "")), false);
  setActiveSlide(0);
  requestAnimationFrame(() => document.body.classList.add("is-ready"));
})();
