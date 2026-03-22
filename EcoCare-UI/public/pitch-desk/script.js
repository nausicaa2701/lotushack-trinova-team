const slides = Array.from(document.querySelectorAll(".slide"));
const dots = Array.from(document.querySelectorAll(".slide-dot"));
const counter = document.getElementById("section-counter");
const reveals = Array.from(document.querySelectorAll(".reveal"));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.2 }
);

reveals.forEach((item) => revealObserver.observe(item));

const slideObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    const index = slides.indexOf(visible.target);
    const countLabel = `${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    if (counter) {
      counter.textContent = countLabel;
    }

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === index);
    });
  },
  { threshold: 0.55 }
);

slides.forEach((slide) => slideObserver.observe(slide));

window.addEventListener("keydown", (event) => {
  if (["ArrowDown", "PageDown", "ArrowRight"].includes(event.key)) {
    event.preventDefault();
    const activeIndex = dots.findIndex((dot) => dot.classList.contains("active"));
    const nextIndex = Math.min(slides.length - 1, activeIndex + 1);
    slides[nextIndex].scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (["ArrowUp", "PageUp", "ArrowLeft"].includes(event.key)) {
    event.preventDefault();
    const activeIndex = dots.findIndex((dot) => dot.classList.contains("active"));
    const nextIndex = Math.max(0, activeIndex - 1);
    slides[nextIndex].scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (event.key.toLowerCase() === "home") {
    event.preventDefault();
    slides[0].scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (event.key.toLowerCase() === "end") {
    event.preventDefault();
    slides[slides.length - 1].scrollIntoView({ behavior: "smooth", block: "start" });
  }
});
