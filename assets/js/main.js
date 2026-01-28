// ------------------ Loader ------------------
window.addEventListener("load", () => {
  const loader = document.getElementById("pageLoader");
  if (!loader) return;

  loader.style.opacity = "0";
  loader.style.transition = "opacity .25s ease";
  setTimeout(() => loader.remove(), 260);

  // ✅ make sure ScrollTrigger recalculates positions after images/layout are ready
  if (window.ScrollTrigger) ScrollTrigger.refresh();
});

// ------------------ Local time ------------------
(function startLocalClock() {
  const el = document.getElementById("localTime");
  if (!el) return;

  const tick = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    el.textContent = `${hh}:${mm}:${ss}`;
  };

  tick();
  setInterval(tick, 1000);
})();

// ------------------ Back to top ------------------
const backToTop = document.getElementById("backToTop");
function toggleBackToTop() {
  if (!backToTop) return;
  backToTop.style.display = window.scrollY > 600 ? "inline-flex" : "none";
}
window.addEventListener("scroll", toggleBackToTop);
toggleBackToTop();

if (backToTop) {
  backToTop.addEventListener("click", () => {
    if (window.lenis) return window.lenis.scrollTo(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ------------------ Smooth anchor scroll ------------------
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;

  const id = a.getAttribute("href");
  const target = id && id !== "#" ? document.querySelector(id) : null;
  if (!target) return;

  e.preventDefault();

  if (window.lenis) {
    window.lenis.scrollTo(target, { offset: -8 });
  } else {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // close offcanvas if open
  const offcanvasEl = document.querySelector(".offcanvas.show");
  if (offcanvasEl && window.bootstrap) {
    const oc = window.bootstrap.Offcanvas.getInstance(offcanvasEl);
    if (oc) oc.hide();
  }
});

// ------------------ Magic cursor ------------------
(function magicCursor() {
  const cursor = document.getElementById("magic-cursor");
  const ball = document.getElementById("ball");
  if (!cursor || !ball) return;

  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  if (isTouch) {
    cursor.style.display = "none";
    return;
  }

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let tx = x;
  let ty = y;

  window.addEventListener("mousemove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
  });

  const setHover = (on) => {
    ball.style.transform = on
      ? "translate(-50%, -50%) scale(1.6)"
      : "translate(-50%, -50%) scale(1)";
  };

  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("a, button, .work-card, .gallery-img, .sink-frame")) setHover(true);
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("a, button, .work-card, .gallery-img, .sink-frame")) setHover(false);
  });

  function raf() {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
})();

// ------------------ Smooth scrolling (Lenis) ------------------
(function setupLenis() {
  if (!window.Lenis) return;

  const lenis = new Lenis({
    duration: 1.15,
    smoothWheel: true,
    smoothTouch: true,
    wheelMultiplier: 1
  });

  window.lenis = lenis;

  // If GSAP is available, drive Lenis from GSAP ticker (best for ScrollTrigger)
  if (window.gsap) {
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  } else {
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
})();

// ------------------ Animations (GSAP + ScrollTrigger) ------------------
(function setupAnimations() {
  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  if (window.lenis) {
    window.lenis.on("scroll", ScrollTrigger.update);
  }

  // ------------------ Bronx-like "sink" image (hover + scroll) ------------------
  (function setupSinkImage() {
    const frame = document.querySelector(".sink-frame");
    if (!frame) return;

    const img = frame.querySelector("img");
    if (!img) return;

    // ---- TWEAK VALUES HERE ----
    const startScale = 1.16;     // default zoom (cropped top/bottom)
    const endScale   = 1.10;     // as you scroll through section
    const startY     = -18;      // px at top of section (image slightly up)
    const endY       = 18;       // px at bottom of section (image slightly down)
    const hoverScale = 1.03;     // reveal more on hover (not full)
    const hoverY     = 0;        // centered on hover
    // ---------------------------

    // Set initial
    gsap.set(img, { scale: startScale, y: startY, transformOrigin: "50% 50%" });

    const st = ScrollTrigger.create({
      trigger: frame,
      start: "top 85%",
      end: "bottom 15%",
      scrub: true,
      onUpdate(self) {
        if (frame.classList.contains("is-hover")) return;

        const p = self.progress;
        const s = gsap.utils.interpolate(startScale, endScale, p);
        const y = gsap.utils.interpolate(startY, endY, p);

        gsap.set(img, { scale: s, y });
      }
    });

    const hoverIn = () => {
      frame.classList.add("is-hover");
      gsap.to(img, {
        scale: hoverScale,
        y: hoverY,
        duration: 0.85,
        ease: "power3.out"
      });
    };

    const hoverOut = () => {
      frame.classList.remove("is-hover");

      // restore scroll-based state smoothly
      const p = st.progress;
      const s = gsap.utils.interpolate(startScale, endScale, p);
      const y = gsap.utils.interpolate(startY, endY, p);

      gsap.to(img, {
        scale: s,
        y,
        duration: 0.7,
        ease: "power3.out"
      });
    };

    frame.addEventListener("mouseenter", hoverIn);
    frame.addEventListener("mouseleave", hoverOut);
    frame.addEventListener("focusin", hoverIn);
    frame.addEventListener("focusout", hoverOut);
  })();

  // ------------------ About heading slides down behind the circle image ------------------
  (function aboutHeadingBehindImage(){
    const section = document.querySelector(".about-showcase");
    if (!section) return;

    const title = section.querySelector(".about-showcase-title");
    const kicker = section.querySelector(".kicker");
    if (!title || !kicker) return;
// start higher (above the circle)
gsap.set([kicker, title], { y: -120 });
    gsap.to([kicker, title], {
      y: 140,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top 70%",
        end: "top 25%",
        scrub: true
      }
    });
  })();

  // base fade-up
  document.querySelectorAll('[data-animate="fade-up"]').forEach((el) => {

    // ✅ IMPORTANT: don't animate the About section's kicker/title with fade-up
    // because they are controlled by the "slide behind circle" ScrollTrigger.
    if (
      el.closest(".about-showcase") &&
      (el.classList.contains("kicker") || el.classList.contains("about-showcase-title"))
    ) {
      return;
    }

    gsap.fromTo(
      el,
      { opacity: 0, y: 26 },
      {
        opacity: 1,
        y: 0,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%" }
      }
    );
  });

  // fade-in
  document.querySelectorAll('[data-animate="fade-in"]').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%" }
      }
    );
  });

  // scale-in (nice for images)
  document.querySelectorAll('[data-animate="scale-in"]').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, scale: 0.97 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" }
      }
    );
  });

  // stagger group (cards)
  document.querySelectorAll('[data-stagger="cards"]').forEach((wrap) => {
    const items = wrap.querySelectorAll(".work-card, .stack-card, .gallery-img");
    if (!items.length) return;

    gsap.fromTo(
      items,
      { opacity: 0, y: 18 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: wrap, start: "top 82%" }
      }
    );
  });

  // parallax (skip anything inside sink-frame so it doesn't double-animate)
  document.querySelectorAll("[data-parallax]").forEach((img) => {
    // IMPORTANT: prevent conflict with sink animation
    if (img.closest(".sink-frame")) return;

    const amount = Number(img.getAttribute("data-parallax")) || 18;

    gsap.fromTo(
      img,
      { y: -amount },
      {
        y: amount,
        ease: "none",
        scrollTrigger: {
          trigger: img,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      }
    );
  });

  // hero micro
  const hero = document.querySelector("[data-hero]");
  if (hero) {
    gsap.fromTo(
      hero,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.85, ease: "power3.out" }
    );
  }
})();


/*new js*/

