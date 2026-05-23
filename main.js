const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("open");
    navToggle.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const target = document.querySelector(anchor.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("visible"));
}

const slides = document.querySelectorAll(".testimonial-slide");
const dotsContainer = document.querySelector(".slider-dots");
const prevButton = document.querySelector(".prev-testimonial");
const nextButton = document.querySelector(".next-testimonial");
let currentSlide = 0;
let sliderTimer;

function showSlide(index) {
  if (!slides.length) return;
  currentSlide = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("active", slideIndex === currentSlide);
  });

  document.querySelectorAll(".dot").forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === currentSlide);
  });
}

function startSlider() {
  if (slides.length < 2) return;
  clearInterval(sliderTimer);
  sliderTimer = setInterval(() => showSlide(currentSlide + 1), 6500);
}

if (slides.length && dotsContainer) {
  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.className = "dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Show testimonial ${index + 1}`);
    dot.addEventListener("click", () => {
      showSlide(index);
      startSlider();
    });
    dotsContainer.appendChild(dot);
  });

  prevButton?.addEventListener("click", () => {
    showSlide(currentSlide - 1);
    startSlider();
  });

  nextButton?.addEventListener("click", () => {
    showSlide(currentSlide + 1);
    startSlider();
  });

  showSlide(0);
  startSlider();
}

const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    formStatus.textContent = "Thank you. Your enquiry is ready for frontend integration.";
    contactForm.reset();
  });
}

const year = document.querySelector("#year");
if (year) {
  year.textContent = new Date().getFullYear();
}

const apiBaseURL = "https://ziptontours.great-site.net/wp-json/wp/v2/posts";
const apiURL = `${apiBaseURL}?_embed`;

function stripHTML(value = "") {
  const parser = new DOMParser();
  const documentValue = parser.parseFromString(value, "text/html");
  return documentValue.body.textContent || "";
}

function sanitizePostContent(value = "") {
  const parser = new DOMParser();
  const documentValue = parser.parseFromString(value, "text/html");
  documentValue.querySelectorAll("script, iframe, object, embed").forEach((element) => element.remove());
  documentValue.querySelectorAll("*").forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      if (attribute.name.startsWith("on")) {
        element.removeAttribute(attribute.name);
      }
    });
  });
  return documentValue.body.innerHTML;
}

function getFeaturedImage(post) {
  return post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "https://via.placeholder.com/900x520";
}

function formatPostDate(dateValue) {
  if (!dateValue) return "";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(dateValue));
}

async function loadBlogPosts() {
  const blogContainer = document.querySelector(".blog-container");
  if (!blogContainer) return;

  try {
    const response = await fetch(apiURL);
    if (!response.ok) {
      throw new Error(`WordPress API returned ${response.status}`);
    }

    const posts = await response.json();

    if (!Array.isArray(posts) || posts.length === 0) {
      return;
    }

    blogContainer.innerHTML = posts
      .map((post) => {
        const featuredImage = getFeaturedImage(post);
        const title = stripHTML(post.title?.rendered);
        const excerpt = stripHTML(post.excerpt?.rendered).substring(0, 120);

        return `
          <article class="blog-card reveal visible">
            <img src="${featuredImage}" alt="${title}">
            <div class="blog-content">
              <p class="card-kicker">From the blog</p>
              <h3>${title}</h3>
              <p>${excerpt}...</p>
              <a href="single-post.html?id=${post.id}">Read More</a>
            </div>
          </article>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Failed to load posts:", error);
  }
}

loadBlogPosts();

async function loadSinglePost() {
  const postPage = document.querySelector(".single-post-page");
  if (!postPage) return;

  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");
  const titleElement = document.querySelector("#post-title");
  const metaElement = document.querySelector("#post-meta");
  const imageElement = document.querySelector("#post-featured-image");
  const contentElement = document.querySelector("#post-content");

  if (!postId) {
    titleElement.textContent = "Choose a travel story";
    metaElement.textContent = "Open an article from the homepage blog preview to read it here.";
    contentElement.innerHTML = `
      <p>This page displays full WordPress articles inside the Zipton Tours website. Please return to the homepage and select a story.</p>
      <a class="btn btn-primary" href="index.html#blog-posts">View Travel Stories</a>
    `;
    return;
  }

  try {
    const response = await fetch(`${apiBaseURL}/${postId}?_embed`);
    if (!response.ok) {
      throw new Error(`WordPress API returned ${response.status}`);
    }

    const post = await response.json();
    const title = stripHTML(post.title?.rendered);
    const featuredImage = getFeaturedImage(post);

    document.title = `${title} | Zipton Tours`;
    titleElement.textContent = title;
    metaElement.textContent = formatPostDate(post.date) || "Zipton Tours";
    imageElement.innerHTML = `<img src="${featuredImage}" alt="${title}">`;
    contentElement.innerHTML = sanitizePostContent(post.content?.rendered);
  } catch (error) {
    console.error("Failed to load post:", error);
    titleElement.textContent = "Article could not be loaded";
    metaElement.textContent = "Please try again in a moment.";
    contentElement.innerHTML = `
      <p>We could not load this WordPress article inside the website right now. The post link may be unavailable or the API request may be blocked by the hosting provider.</p>
      <a class="btn btn-primary" href="index.html#blog-posts">Back to Travel Stories</a>
    `;
  }
}

loadSinglePost();
