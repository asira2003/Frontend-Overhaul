let navbar = document.querySelector(".header");
let navbarLinks = document.querySelectorAll(".navbar a");
let mainLinks = document.querySelectorAll(".main a");
let whatsappButton = document.querySelector(".whatsapp");
let todo = document.querySelector(".to-top");
let menu = document.querySelector(".navbar");
let menuIcon = document.querySelector("#menu-icon");

menuIcon.onclick = () => {
  menuIcon.classList.toggle("bx-x");
  menu.classList.toggle("side");
  navbar.classList.toggle("side");
  mainLinks.forEach((link) => link.classList.toggle("side"));
};

// Function to start animation after all images are loaded
function startAnimation() {
  // Start your animation logic here
  // For example, start the scroll reveal animations
  ScrollReveal().reveal(".section-title", { origin: "top" });
  ScrollReveal().reveal(".home-content h1", { origin: "top", delay: 260 });
  // Add more scroll reveal animations for other sections as needed
}

// Function to transform navbar based on scroll position
function transformNavbar() {
  let isScrolled = window.scrollY > 100;

  navbar.classList.toggle("scrolled", isScrolled);
  whatsappButton.classList.toggle("scrolled", isScrolled);
  todo.classList.toggle("active", isScrolled);

  navbarLinks.forEach((link) => {
    link.classList.toggle("scrolled", isScrolled);
  });
  mainLinks.forEach((link) => {
    link.classList.toggle("scrolled", isScrolled);
  });

  menuIcon.classList.toggle("scrolled", isScrolled);

  // Save scroll state in local storage
  localStorage.setItem("isScrolled", isScrolled);
}

// Function to retrieve scroll state from local storage
function retrieveScrollState() {
  let isScrolled = localStorage.getItem("isScrolled") === "true";
  if (isScrolled) {
    transformNavbar();
  }
}

// Function for smooth scrolling to top
function smoothScrollToTop() {
  const targetPosition = 0;
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  const duration = 500; // Adjust scrolling speed here

  let start = null;
  window.requestAnimationFrame(step);

  function step(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    window.scrollTo(
      0,
      easeInOutCubic(progress, startPosition, distance, duration)
    );
    if (progress < duration) window.requestAnimationFrame(step);
  }
}

// Easing function for smooth scrolling
function easeInOutCubic(t, b, c, d) {
  // cubic easing in/out - acceleration until halfway, then deceleration
  t /= d / 2;
  if (t < 1) return (c / 2) * t * t * t + b;
  t -= 2;
  return (c / 2) * (t * t * t + 2) + b;
}

// Call smooth scroll function when the to-top button is clicked
todo.addEventListener("click", smoothScrollToTop);

// Scroll event listener
window.onscroll = () => {
  transformNavbar();
};

// Scroll Reveal animations
ScrollReveal({
  reset: false,
  distance: "80px",
  duration: 650,
  delay: 130,
});

// home
ScrollReveal().reveal(".section-title", { origin: "top" });
ScrollReveal().reveal(".home-content h1", { origin: "top", delay: 260 });
ScrollReveal().reveal(".home-content p", { origin: "top", delay: 390 });
ScrollReveal().reveal(".button", { origin: "top", delay: 520 });
ScrollReveal().reveal("a.whatsapp", { origin: "bottom", delay: 650 });

// travel
ScrollReveal().reveal(".travel-content p", { origin: "top", delay: 260 });
ScrollReveal().reveal(".travel-1", { origin: "top", delay: 390 });
ScrollReveal().reveal(".travel-2", { origin: "top", delay: 520 });
ScrollReveal().reveal(".travel-3", { origin: "top", delay: 650 });
ScrollReveal().reveal(".travel-4", { origin: "top", delay: 780 });

//to-do
ScrollReveal().reveal(".to-do-content p", { origin: "top", delay: 260 });
ScrollReveal().reveal(".to-do-1", { origin: "top", delay: 390 });
ScrollReveal().reveal(".to-do-2", { origin: "top", delay: 520 });
ScrollReveal().reveal(".to-do-3", { origin: "top", delay: 650 });
ScrollReveal().reveal(".to-do-6", { origin: "top", delay: 780 });
ScrollReveal().reveal(".to-do-4", { origin: "top", delay: 910 });
ScrollReveal().reveal(".to-do-5", { origin: "top", delay: 1040 });
ScrollReveal().reveal(".button-to-do", { origin: "top", delay: 1170 });

//Paralax-1
ScrollReveal().reveal(".parallax-1-inner h1", { origin: "top", delay: 260 });
ScrollReveal().reveal(".parallax-1-inner h2", { origin: "top", delay: 390 });

//Paralax-2
ScrollReveal().reveal(".parallax-2-inner h1", { origin: "top", delay: 260 });
ScrollReveal().reveal(".parallax-2-inner h2", { origin: "top", delay: 390 });

//Paralax-3
ScrollReveal().reveal(".parallax-3-inner h1", { origin: "top", delay: 260 });
ScrollReveal().reveal(".parallax-3-inner h2", { origin: "top", delay: 390 });

//Paralax-4
ScrollReveal().reveal(".parallax-4-inner h1", { origin: "top", delay: 260 });
ScrollReveal().reveal(".parallax-4-inner h2", { origin: "top", delay: 390 });

//testimonials
ScrollReveal().reveal(".review-content p", { origin: "top", delay: 260 });
ScrollReveal().reveal(".review-card-1", { origin: "top", delay: 390 });
ScrollReveal().reveal(".review-card-2", { origin: "top", delay: 520 });
ScrollReveal().reveal(".review-card-3", { origin: "top", delay: 650 });
ScrollReveal().reveal(".button-review", { origin: "top", delay: 780 });

//why us
ScrollReveal().reveal(".why-us-content p", { origin: "top", delay: 260 });
ScrollReveal().reveal(".why-us-box-1", { origin: "top", delay: 390 });
ScrollReveal().reveal(".why-us-box-2", { origin: "top", delay: 520 });
ScrollReveal().reveal(".why-us-box-3", { origin: "top", delay: 650 });
ScrollReveal().reveal(".button-why-us", { origin: "top", delay: 780 });

//gallery
ScrollReveal().reveal(".gallery-content p", { origin: "top", delay: 260 });
ScrollReveal().reveal(".gallery-1", { origin: "top", delay: 390 });
ScrollReveal().reveal(".gallery-2", { origin: "top", delay: 520 });
ScrollReveal().reveal(".gallery-3", { origin: "top", delay: 650 });
ScrollReveal().reveal(".gallery-4", { origin: "top", delay: 780 });
ScrollReveal().reveal(".gallery-5", { origin: "top", delay: 910 });
ScrollReveal().reveal(".gallery-6", { origin: "top", delay: 1040 });
ScrollReveal().reveal(".gallery-7", { origin: "top", delay: 1170 });
ScrollReveal().reveal(".gallery-8", { origin: "top", delay: 1300 });
ScrollReveal().reveal(".button-gallery", { origin: "top", delay: 1430 });

//vacation
ScrollReveal().reveal(".vacation-content p", { origin: "top", delay: 260 });
ScrollReveal().reveal(".wrapper", { origin: "top", delay: 390 });
ScrollReveal().reveal(".step-box-1", { origin: "top", delay: 520 });
ScrollReveal().reveal(".step-box-2", { origin: "top", delay: 650 });
ScrollReveal().reveal(".step-box-3", { origin: "top", delay: 780 });
ScrollReveal().reveal(".button-vacation", { origin: "top", delay: 910 });

if (window.innerWidth < 900) {
  ScrollReveal().reveal(".travel-1", { origin: "top", delay: 280 });
  ScrollReveal().reveal(".travel-2", { origin: "top", delay: 300 });
  ScrollReveal().reveal(".travel-3", { origin: "top", delay: 320 });
  ScrollReveal().reveal(".travel-4", { origin: "top", delay: 340 });

  ScrollReveal().reveal(".to-do-1", { origin: "top", delay: 280 });
  ScrollReveal().reveal(".to-do-2", { origin: "top", delay: 300 });
  ScrollReveal().reveal(".to-do-3", { origin: "top", delay: 320 });
  ScrollReveal().reveal(".to-do-6", { origin: "top", delay: 340 });
  ScrollReveal().reveal(".to-do-4", { origin: "top", delay: 360 });
  ScrollReveal().reveal(".to-do-5", { origin: "top", delay: 380 });
  ScrollReveal().reveal(".button-to-do", { origin: "top", delay: 400 });

  ScrollReveal().reveal(".review-card-1", { origin: "top", delay: 280 });
  ScrollReveal().reveal(".review-card-2", { origin: "top", delay: 300 });
  ScrollReveal().reveal(".review-card-3", { origin: "top", delay: 320 });
  ScrollReveal().reveal(".button-review", { origin: "top", delay: 340 });

  ScrollReveal().reveal(".why-us-box-1", { origin: "top", delay: 280 });
  ScrollReveal().reveal(".why-us-box-2", { origin: "top", delay: 300 });
  ScrollReveal().reveal(".why-us-box-3", { origin: "top", delay: 320 });
  ScrollReveal().reveal(".button-why-us", { origin: "top", delay: 340 });

  ScrollReveal().reveal(".gallery-1", { origin: "top", delay: 280 });
  ScrollReveal().reveal(".gallery-2", { origin: "top", delay: 300 });
  ScrollReveal().reveal(".gallery-3", { origin: "top", delay: 320 });
  ScrollReveal().reveal(".gallery-4", { origin: "top", delay: 340 });
  ScrollReveal().reveal(".gallery-5", { origin: "top", delay: 360 });
  ScrollReveal().reveal(".gallery-6", { origin: "top", delay: 380 });
  ScrollReveal().reveal(".gallery-7", { origin: "top", delay: 400 });
  ScrollReveal().reveal(".gallery-8", { origin: "top", delay: 420 });
  ScrollReveal().reveal(".button-gallery", { origin: "top", delay: 440 });

  ScrollReveal().reveal(".wrapper", { origin: "top", delay: 280 });
  ScrollReveal().reveal(".step-box-1", { origin: "top", delay: 300 });
  ScrollReveal().reveal(".step-box-2", { origin: "top", delay: 320 });
  ScrollReveal().reveal(".step-box-3", { origin: "top", delay: 340 });
  ScrollReveal().reveal(".button-vacation", { origin: "top", delay: 360 });
}
