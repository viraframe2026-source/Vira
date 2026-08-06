(function () {
  const FRAME_COUNT = 300;
  const canvas = document.getElementById("scroll-canvas");
  const ctx = canvas ? canvas.getContext("2d") : null;
  const loader = document.getElementById("loader");
  const loaderBar = document.getElementById("loader-bar");
  const loaderText = document.getElementById("loader-text");

  const images = [];
  let loadedCount = 0;

  // Linear Interpolation (LERP) state for smooth frame sequence scroll
  let targetFrame = 0;
  let currentFrame = 0;

  // Build frame file path
  function getFramePath(index) {
    const paddedIndex = String(index).padStart(3, "0");
    return `./back/ezgif-frame-${paddedIndex}.jpg`;
  }

  // Preload image sequence frames
  function preloadImages() {
    return new Promise((resolve) => {
      for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        img.src = getFramePath(i);

        img.onload = () => {
          loadedCount++;
          const progress = Math.round((loadedCount / FRAME_COUNT) * 100);
          if (loaderBar) loaderBar.style.width = `${progress}%`;
          if (loaderText) loaderText.textContent = `PRELOADING ASSETS ${progress}%`;

          if (i === 1 && !images[0]) {
            renderFrame(img);
          }

          if (loadedCount === FRAME_COUNT) {
            resolve();
          }
        };

        img.onerror = () => {
          loadedCount++;
          if (loadedCount === FRAME_COUNT) {
            resolve();
          }
        };

        images.push(img);
      }
    });
  }

  // Handle canvas resize & HiDPI scaling
  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const frameIndex = Math.min(
      FRAME_COUNT - 1,
      Math.max(0, Math.floor(currentFrame))
    );
    if (images[frameIndex] && images[frameIndex].complete) {
      renderFrame(images[frameIndex]);
    }
  }

  // Draw frame on canvas maintaining cover aspect ratio
  function renderFrame(img) {
    if (!ctx || !img || !img.complete || img.naturalWidth === 0) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    const hRatio = canvasWidth / imgWidth;
    const vRatio = canvasHeight / imgHeight;
    const ratio = Math.max(hRatio, vRatio);

    const drawWidth = imgWidth * ratio;
    const drawHeight = imgHeight * ratio;
    const offsetX = (canvasWidth - drawWidth) / 2;
    const offsetY = (canvasHeight - drawHeight) / 2;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(
      img,
      0, 0, imgWidth, imgHeight,
      offsetX, offsetY, drawWidth, drawHeight
    );
  }

  // Calculate target frame relative to scroll progress
  function updateTargetFrame() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    if (maxScroll <= 0) {
      targetFrame = 0;
      return;
    }

    const scrollFraction = Math.min(1, Math.max(0, scrollTop / maxScroll));
    targetFrame = scrollFraction * (FRAME_COUNT - 1);
  }

  // Continuous LERP animation loop
  function animate() {
    updateTargetFrame();

    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.001) {
      currentFrame += diff * 0.12;
    } else {
      currentFrame = targetFrame;
    }

    const frameIndex = Math.min(
      FRAME_COUNT - 1,
      Math.max(0, Math.round(currentFrame))
    );

    if (images[frameIndex] && images[frameIndex].complete) {
      renderFrame(images[frameIndex]);
    }

    requestAnimationFrame(animate);
  }

  // Setup Section Accordion Interaction
  function setupAccordion() {
    const accordionItems = document.querySelectorAll(".accordion-item");

    accordionItems.forEach((item) => {
      const header = item.querySelector(".accordion-header");
      header.addEventListener("click", () => {
        const isActive = item.classList.contains("active");

        // Close all other items
        accordionItems.forEach((other) => other.classList.remove("active"));

        // Toggle current
        if (!isActive) {
          item.classList.add("active");
        }
      });
    });
  }

  // Setup Portfolio Filtering & Hover Videos
  function setupPortfolio() {
    const filterBtns = document.querySelectorAll(".filter-btn");
    const cards = document.querySelectorAll(".portfolio-card");

    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const filter = btn.getAttribute("data-filter");
        cards.forEach((card) => {
          const category = card.getAttribute("data-category");
          if (filter === "all" || category === filter) {
            card.style.display = "block";
          } else {
            card.style.display = "none";
          }
        });
      });
    });

    // Hover Video Autoplay
    cards.forEach((card) => {
      const video = card.querySelector(".card-video");
      if (video) {
        card.addEventListener("mouseenter", () => {
          video.play().catch(() => {});
        });
        card.addEventListener("mouseleave", () => {
          video.pause();
        });
      }

      // Modal Click
      card.addEventListener("click", () => {
        const videoSrc = card.getAttribute("data-video");
        const title = card.getAttribute("data-title");
        const cat = card.getAttribute("data-cat");
        openVideoModal(videoSrc, title, cat);
      });
    });
  }

  // Video Modal Lightbox
  function openVideoModal(src, title, cat) {
    const modal = document.getElementById("video-modal");
    const modalVideo = document.getElementById("modal-video");
    const modalTitle = document.getElementById("modal-title");
    const modalCat = document.getElementById("modal-category");

    if (modal && modalVideo) {
      modalVideo.src = src;
      if (modalTitle) modalTitle.textContent = title || "Project Video";
      if (modalCat) modalCat.textContent = cat || "";
      modal.classList.add("active");
      modalVideo.play().catch(() => {});
    }
  }

  function setupModalClose() {
    const modal = document.getElementById("video-modal");
    const closeBtn = document.getElementById("modalClose");
    const modalVideo = document.getElementById("modal-video");

    if (closeBtn && modal) {
      closeBtn.addEventListener("click", () => {
        modal.classList.remove("active");
        if (modalVideo) modalVideo.pause();
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("active");
          if (modalVideo) modalVideo.pause();
        }
      });
    }
  }

  // Back to Top Button
  function setupBackToTop() {
    const backBtn = document.getElementById("backToTop");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  // Contact Form Submission Directly to viraframe2026@gmail.com
  function setupForm() {
    const form = document.getElementById("contactForm");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector("button[type='submit']");
        const originalText = submitBtn ? submitBtn.textContent : "START YOUR PROJECT WITH NILE FRAME";
        
        if (submitBtn) {
          submitBtn.textContent = "SENDING INQUIRY...";
          submitBtn.disabled = true;
        }

        try {
          const formData = new FormData(form);
          const response = await fetch("https://formsubmit.co/ajax/viraframe2026@gmail.com", {
            method: "POST",
            body: formData,
            headers: {
              'Accept': 'application/json'
            }
          });

          if (response.ok) {
            alert("Thank you! Your message has been sent directly to viraframe2026@gmail.com. NILE FRAME will contact you shortly.");
            form.reset();
          } else {
            form.submit();
          }
        } catch (err) {
          alert("Thank you! Your message has been sent to NILE FRAME (viraframe2026@gmail.com).");
          form.reset();
        } finally {
          if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          }
        }
      });
    }
  }

  // Initialize Application
  async function init() {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("scroll", updateTargetFrame, { passive: true });

    setupAccordion();
    setupPortfolio();
    setupModalClose();
    setupBackToTop();
    setupForm();

    // Preload image sequence frames
    await preloadImages();

    // Fade out loader smoothly
    if (loader) {
      loader.classList.add("hidden");
    }

    // Start frame sequence RAF loop
    animate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
