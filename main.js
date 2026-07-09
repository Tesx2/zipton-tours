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
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(contactForm);

    try {
      const response = await fetch(contactForm.action || "https://formspree.io/f/xqejlbbq", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      });

      if (response.ok) {
        formStatus.textContent = "✅ Message sent successfully!";
        contactForm.reset();
      } else {
        formStatus.textContent = "❌ Something went wrong. Try again.";
      }
    } catch (err) {
      console.error("Form submit failed:", err);
      formStatus.textContent = "❌ Something went wrong. Try again.";
    }
  });
}

const year = document.querySelector("#year");
if (year) {
  year.textContent = new Date().getFullYear();
}

const apiBaseURL = "https://ziptontour.netlify.app/.netlify/functions/wp-posts";
const apiURL = apiBaseURL;
const toursApiURL = "https://ziptontour.netlify.app/.netlify/functions/wp-tours";
const leadershipApiURL = "https://ziptontour.netlify.app/.netlify/functions/wp-leadership";
const leadershipPlaceholderImage = "images/team/placeholder.jpg";

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

function escapeHTML(value = "") {
  const element = document.createElement("textarea");
  element.textContent = String(value);
  return element.innerHTML;
}

function escapeAttribute(value = "") {
  return escapeHTML(value).replace(/"/g, "&quot;");
}

function getFeaturedImage(post, fallback = "https://via.placeholder.com/900x520") {
  return post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || fallback;
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
              <p class="card-kicker">Latest Article</p>
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

async function fetchLeadershipMembers() {
  console.log("Leadership Endpoint:", leadershipApiURL);
  const response = await fetch(leadershipApiURL);
  if (!response.ok) {
    const errorBody = await response.text();
    console.log("Leadership HTTP Status:", response.status);
    console.log("Leadership Error Body:", errorBody);
    throw new Error(`WordPress API returned ${response.status}`);
  }

  const data = await response.json();
  console.log("Leadership Response:", data);
  return data;
}

function getLeadershipBiography(post) {
  return getField(post, ["biography", "bio", "leadership_biography"]) || stripHTML(post.content?.rendered);
}

function normalizeLeadershipMember(post) {
  const name = stripHTML(post.title?.rendered);
  const position = getField(post, ["position", "job_title", "leadership_position"]);

  return {
    name,
    position,
    biography: getLeadershipBiography(post),
    image: getFeaturedImage(post, leadershipPlaceholderImage),
    displayOrder: Number(getField(post, ["display_order", "menu_order", "leadership_display_order"]) || post.menu_order || 0),
    socialLinks: [
      { label: "Facebook", url: getField(post, ["facebook_url", "facebook"]), icon: "images/icons/facebook.png" },
      { label: "Instagram", url: getField(post, ["instagram_url", "instagram"]), icon: "images/icons/instagram.png" },
      { label: "LinkedIn", url: getField(post, ["linkedin_url", "linkedin"]), icon: "images/icons/linkedin.png" },
      { label: "TikTok", url: getField(post, ["tiktok_url", "tiktok"]), icon: "images/icons/tiktok.png" },
      { label: "Twitter", url: getField(post, ["x_url", "twitter_url", "x_twitter_url", "twitter"]), icon: "images/icons/twitter.png" },
      { label: "Website", shortLabel: "Web", url: getField(post, ["website_url", "website"]), icon: "" },
      { label: "Email", shortLabel: "Mail", url: formatEmailLink(getField(post, ["email", "email_address"])), icon: "" }
    ].filter((link) => link.url)
  };
}

function formatEmailLink(value) {
  if (!value) return "";
  const email = String(value).trim();
  return email.startsWith("mailto:") ? email : `mailto:${email}`;
}

function renderLeadershipSocialLinks(member) {
  if (!member.socialLinks.length) return "";

  return `
    <div class="social-links" aria-label="${escapeAttribute(member.name)} social links">
      ${member.socialLinks
        .map((link) => `
          <a href="${escapeAttribute(link.url)}" target="_blank" rel="noopener" aria-label="${escapeAttribute(link.label)}">
            ${link.icon ? `<img src="${escapeAttribute(link.icon)}" alt="${escapeAttribute(link.label)} Icon">` : escapeHTML(link.shortLabel || link.label)}
          </a>
        `)
        .join("")}
    </div>
  `;
}

function renderLeadershipCards(members) {
  const container = document.querySelector("#leadership-container");
  if (!container || !Array.isArray(members) || members.length === 0) return;

  container.innerHTML = members
    .map((member) => `
      <article class="team-card reveal visible" data-team-name="${escapeAttribute(member.name)}">
        <img src="${escapeAttribute(member.image)}" alt="Portrait of ${escapeAttribute(member.name)}" onerror="this.src='${leadershipPlaceholderImage}'; this.onerror=null;">
        <div class="team-content">
          <p class="card-kicker">${escapeHTML(member.position)}</p>
          <h3>${escapeHTML(member.name)}</h3>
          <p>${escapeHTML(member.biography)}</p>
          ${renderLeadershipSocialLinks(member)}
        </div>
      </article>
    `)
    .join("");
}

async function loadLeadershipMembers() {
  const container = document.querySelector("#leadership-container");
  if (!container) return;

  container.setAttribute("aria-busy", "true");

  try {
    const posts = await fetchLeadershipMembers();
    if (!Array.isArray(posts) || posts.length === 0) {
      container.innerHTML = "";
      return;
    }

    const members = posts
      .map(normalizeLeadershipMember)
      .sort((first, second) => first.displayOrder - second.displayOrder);

    renderLeadershipCards(members);
  } catch (error) {
    console.error("Failed to load leadership members:", error);
    container.innerHTML = "";
  } finally {
    container.removeAttribute("aria-busy");
  }
}

loadLeadershipMembers();

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
    const response = await fetch(`${apiBaseURL}?id=${postId}`);
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

const tourDetails = {
  "classic-safari-trail": {
    title: "Classic Safari Trail",
    category: "5 days · Safari",
    price: "From KSh 85,000",
    image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1400&q=85",
    summary: "A wildlife-focused escape designed for travelers who want iconic safari moments, comfortable lodge stays, and expert guiding.",
    overview: "Follow open savannah routes, track wildlife with experienced guides, and end each day with calm lodge evenings. This trip balances early-morning game drives, scenic rest stops, cultural context, and enough flexibility for photography and quiet time.",
    facts: ["5 days", "Safari", "Lodge stays", "Private guide"],
    highlights: ["Morning and evening game drives", "Comfortable lodge accommodation", "Wildlife photography stops", "Sundowner moments in scenic locations"],
    itinerary: ["Arrival, briefing, and transfer to your safari lodge", "Full-day wildlife drives with picnic or lodge lunch", "Guided cultural stop and afternoon game viewing", "Slow morning drive, relaxation, and sunset experience", "Final breakfast, scenic transfer, and departure"],
    includes: ["Transport during the tour", "Professional local guide", "Accommodation planning support", "Park and activity guidance", "Pre-trip consultation"]
  },
  "highland-culture-route": {
    title: "Highland Culture Route",
    category: "7 days · Culture",
    price: "From KSh 95,000",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85",
    summary: "A deeper cultural route through highland landscapes, local markets, heritage stories, village visits, and scenic walking experiences.",
    overview: "This journey is shaped for guests who want to understand the people and rhythms behind the landscape. Expect thoughtful community encounters, slow scenic drives, guided walks, and meals that connect you with place.",
    facts: ["7 days", "Culture", "Scenic drives", "Community hosts"],
    highlights: ["Guided market and village visits", "Storytelling with local hosts", "Highland viewpoints and gentle hikes", "Traditional food experiences"],
    itinerary: ["Welcome briefing and highland transfer", "Market walk and local lunch experience", "Village visit and heritage storytelling", "Scenic hike and photography afternoon", "Community craft or cooking session", "Restful day with optional nature walk", "Return transfer and departure"],
    includes: ["Route planning", "Local guide coordination", "Cultural experience facilitation", "Transport support", "Accommodation recommendations"]
  },
  "coastal-heritage-stay": {
    title: "Coastal Heritage Stay",
    category: "4 days · Coast",
    price: "From KSh 68,000",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85",
    summary: "A relaxed coastal escape mixing beach calm, Swahili heritage, seafood dining, spice stories, and old-town architecture.",
    overview: "Made for travelers who want both rest and meaning, this stay blends ocean time with guided heritage experiences. Enjoy slow mornings, cultural walks, coastal cuisine, and warm evenings by the water.",
    facts: ["4 days", "Coast", "Heritage walks", "Beach stay"],
    highlights: ["Swahili architecture and heritage walks", "Beach relaxation and coastal dining", "Spice and seafood experiences", "Optional dhow or sunset activity"],
    itinerary: ["Arrival and transfer to coastal stay", "Heritage walk and local dining experience", "Beach day with optional water activity", "Breakfast, final coastal stop, and departure"],
    includes: ["Coastal itinerary planning", "Local guide coordination", "Restaurant and activity recommendations", "Transport guidance", "Guest support before travel"]
  },
  "market-makers-weekend": {
    title: "Market & Makers Weekend",
    category: "3 days · Immersion",
    price: "From KSh 38,000",
    image: "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1400&q=85",
    summary: "A short, culture-rich weekend meeting artisans, tasting local dishes, and exploring the stories behind handmade craft.",
    overview: "Perfect for guests with limited time, this immersive weekend focuses on local creativity and community-led experiences. Move through markets, workshops, kitchens, and conversations that reveal the texture of a destination.",
    facts: ["3 days", "Culture", "Food", "Craft"],
    highlights: ["Guided market visit", "Artisan workshop experience", "Local food tasting", "Small-group cultural storytelling"],
    itinerary: ["Arrival, welcome, and local food introduction", "Market walk, maker visit, and craft session", "Slow breakfast, final cultural stop, and departure"],
    includes: ["Experience coordination", "Local host support", "Workshop planning", "Transport guidance", "Pre-trip briefing"]
  },
  "mountain-valley-trek": {
    title: "Mountain & Valley Trek",
    category: "6 days · Adventure",
    price: "From KSh 78,000",
    image: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=1400&q=85",
    summary: "A scenic adventure for active travelers who want guided trails, panoramic viewpoints, forest paths, and restful evenings.",
    overview: "This trek combines movement and comfort. Days are built around guided walking routes, landscape interpretation, and recovery time, making it ideal for travelers who want adventure without losing care and pace.",
    facts: ["6 days", "Adventure", "Guided trails", "Nature"],
    highlights: ["Guided mountain and valley walks", "Panoramic viewpoints", "Forest and rural trail sections", "Comfortable recovery evenings"],
    itinerary: ["Arrival, route briefing, and acclimatization walk", "Valley trail and scenic picnic", "Forest route with local guide", "Mountain viewpoint day", "Flexible nature day or cultural stop", "Departure transfer"],
    includes: ["Guided trekking support", "Route planning", "Safety briefing", "Accommodation recommendations", "Transport guidance"]
  },
  "private-bespoke-journey": {
    title: "Private Bespoke Journey",
    category: "Custom · Private",
    price: "Custom quote",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=85",
    summary: "A private route built around your dates, budget, pace, interests, and preferred travel style.",
    overview: "This option is for travelers who want Zipton Tours to design a custom experience from scratch. We shape the route around your group, whether you want safari, culture, coast, hiking, food, photography, or a bit of everything.",
    facts: ["Custom length", "Private", "Flexible", "Tailored"],
    highlights: ["Built around your dates and budget", "Flexible accommodation style", "Private guide and transport options", "Safari, culture, coast, or adventure combinations"],
    itinerary: ["Discovery call and travel brief", "Custom route proposal", "Refinement based on your feedback", "Booking support and pre-trip briefing", "On-trip coordination and guest care"],
    includes: ["Custom itinerary design", "Supplier and guide coordination", "Budget planning support", "Booking guidance", "Dedicated communication before travel"]
  }
};

function toList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getField(post, names) {
  const sources = [post?.acf, post?.meta, post?.leadership_meta, post];
  for (const source of sources) {
    if (!source) continue;
    for (const name of names) {
      const value = source[name];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
  }
  return "";
}

function parseTourContentSections(html = "") {
  const parser = new DOMParser();
  const documentValue = parser.parseFromString(sanitizePostContent(html), "text/html");
  const sections = {};
  let currentSection = "";

  [...documentValue.body.children].forEach((element) => {
    const tagName = element.tagName.toLowerCase();

    if (/^h[2-4]$/.test(tagName)) {
      const heading = stripHTML(element.innerHTML).toLowerCase();
      if (heading.includes("overview") || heading.includes("expect")) currentSection = "overview";
      else if (heading.includes("highlight")) currentSection = "highlights";
      else if (heading.includes("itinerary") || heading.includes("day")) currentSection = "itinerary";
      else if (heading.includes("include") || heading.includes("covered")) currentSection = "includes";
      else if (heading.includes("fact")) currentSection = "facts";
      else currentSection = "";
      return;
    }

    if (!currentSection) return;

    if (!sections[currentSection]) sections[currentSection] = [];

    if (tagName === "ul" || tagName === "ol") {
      sections[currentSection].push(
        ...[...element.querySelectorAll("li")].map((item) => stripHTML(item.innerHTML).trim()).filter(Boolean)
      );
      return;
    }

    const lines = element.innerHTML
      .replace(/<br\s*\/?>/gi, "\n")
      .split(/\r?\n/)
      .map((line) => stripHTML(line).trim())
      .filter(Boolean);

    sections[currentSection].push(...lines);
  });

  return sections;
}

function getLabeledContentValue(html = "", labels = []) {
  const parser = new DOMParser();
  const documentValue = parser.parseFromString(sanitizePostContent(html), "text/html");
  const labelSet = labels.map((label) => label.toLowerCase());
  const elements = [...documentValue.body.querySelectorAll("p, li")];

  for (const element of elements) {
    const text = element.innerHTML
      .replace(/<br\s*\/?>/gi, "\n")
      .split(/\r?\n/)
      .map((line) => stripHTML(line).trim())
      .filter(Boolean);

    for (const line of text) {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (!match) continue;

      const label = match[1].trim().toLowerCase();
      if (labelSet.includes(label)) {
        return match[2].trim();
      }
    }
  }

  return "";
}

function formatTourPrice(value) {
  if (!value) return "Custom quote";

  const text = String(value).trim();
  if (text.toLowerCase().includes("ksh")) return text;

  const amount = Number(text.replace(/\D/g, ""));
  if (!amount) return text;

  return `From KSh ${amount.toLocaleString()}`;
}

function normalizeTourPost(post) {
  const content = post.content?.rendered || "";
  const sections = parseTourContentSections(content);
  const title = stripHTML(post.title?.rendered);
  const featuredImage = getFeaturedImage(post);
  const duration = getField(post, ["duration", "tour_duration"]) || getLabeledContentValue(content, ["duration"]);
  const category = getField(post, ["tour_category", "category", "trip_type"]) || getLabeledContentValue(content, ["category", "type"]);
  const price = getField(post, ["price", "tour_price", "starting_price"]) || getLabeledContentValue(content, ["price", "starting price"]);
  const summary = getField(post, ["summary", "tour_summary"]) || getLabeledContentValue(content, ["summary"]) || stripHTML(post.excerpt?.rendered).substring(0, 180);
  const overview = getField(post, ["overview", "tour_overview"]) || sections.overview?.join(" ") || summary;
  const facts = toList(getField(post, ["facts", "quick_facts", "tour_facts"]) || getLabeledContentValue(content, ["facts", "quick facts"]));
  const highlights = toList(getField(post, ["highlights", "tour_highlights"]));
  const itinerary = toList(getField(post, ["itinerary", "tour_itinerary"]));
  const includes = toList(getField(post, ["includes", "included", "tour_includes"]));

  return {
    title,
    category: [duration, category].filter(Boolean).join(" · ") || category || duration || "Trip details",
    price: formatTourPrice(price),
    image: featuredImage,
    summary,
    overview,
    facts: facts.length ? facts : [duration, category].filter(Boolean),
    highlights: highlights.length ? highlights : sections.highlights || [],
    itinerary: itinerary.length ? itinerary : sections.itinerary || [],
    includes: includes.length ? includes : sections.includes || [],
    slug: post.slug
  };
}

function renderTourCards(tours) {
  const grid = document.querySelector(".tours-grid");
  if (!grid || !Array.isArray(tours) || tours.length === 0) return;

  // On the homepage's featured section, we redirect to the full tours list
  const isFeatured = !!grid.closest("#featured-tours");

  grid.innerHTML = tours
    .map((tour) => `
      <article class="tour-card reveal visible">
        <img src="${tour.image}" alt="${tour.title}">
        <div class="card-body">
          <p class="card-kicker">${tour.category}</p>
          <h2>${tour.title}</h2>
          <p>${tour.summary}</p>
          <a class="btn btn-small" href="${isFeatured ? "tours.html" : `tour-detail.html?tour=${encodeURIComponent(tour.slug)}`}">View trip details</a>
        </div>
      </article>
    `)
    .join("");
}

async function loadWordPressToursList() {
  const grid = document.querySelector(".tours-grid");

  // Guard to prevent rendering on pages without a tours grid or on post detail pages
  if (!grid || document.querySelector(".single-post-page")) return;

  // Detect if we are in the "Featured Tours" section (usually on index.html)
  const isFeaturedSection = !!grid.closest("#featured-tours");

  try {
    const response = await fetch(toursApiURL);
    if (!response.ok) {
      throw new Error(`WordPress API returned ${response.status}`);
    }

    const posts = await response.json();
    if (!Array.isArray(posts) || posts.length === 0) return;

    let tours = posts.map(normalizeTourPost);

    // If rendering for the Featured section, we can limit the count or pick specific items
    if (isFeaturedSection) {
      // Option 1: Limit to the latest 3 tours (standard "Featured" behavior)
      tours = tours.slice(0, 3);

      /* 
      Option 2: Hand-pick specific tours by slug if you want total control:
      const specificSlugs = ['classic-safari-trail', 'highland-culture-route'];
      tours = tours.filter(t => specificSlugs.includes(t.slug));
      */
    }

    renderTourCards(tours);
  } catch (error) {
    console.error("Failed to load WordPress tours:", error);
  }
}

loadWordPressToursList();

function applyTourDetail(tour, selectedSlug) {
  if (!tour) return;

  document.title = `${tour.title} | Zipton Tours`;
  document.querySelector("#tour-category").textContent = tour.category;
  document.querySelector("#tour-title").textContent = tour.title;
  document.querySelector("#tour-summary").textContent = tour.summary;
  document.querySelector("#tour-overview").textContent = tour.overview;
  document.querySelector("#tour-price").textContent = tour.price;
  document.querySelector("#booking-title").textContent = `Book ${tour.title}`;
  document.querySelector("#tour-detail-hero").style.backgroundImage = `linear-gradient(90deg, rgba(0, 0, 0, 0.82), rgba(74, 43, 31, 0.62)), url("${tour.image}")`;
  document.querySelector("#tour-detail-image").innerHTML = `<img src="${tour.image}" alt="${tour.title}">`;
  document.querySelector("#tour-quick-facts").innerHTML = tour.facts.map((fact) => `<span>${fact}</span>`).join("");
  document.querySelector("#tour-highlights").innerHTML = tour.highlights.map((item) => `<li>${item}</li>`).join("") || "<li>Custom planning with Zipton Tours</li>";
  document.querySelector("#tour-includes").innerHTML = tour.includes.map((item) => `<li>${item}</li>`).join("") || "<li>Pre-trip consultation and booking support</li>";
  document.querySelector("#tour-itinerary").innerHTML = tour.itinerary
    .map((item, index) => `
      <div class="itinerary-item">
        <span>Day ${index + 1}</span>
        <p>${item}</p>
      </div>
    `)
    .join("");
  document.querySelector("#contact-tour-link").href = `contact.html?tour=${encodeURIComponent(tour.title)}`;
  document.querySelectorAll(".payment-option").forEach((option) => {
    const method = option.dataset.paymentMethod || "payment";

    if (method === "Stripe") {
      option.href = "#";
      option.addEventListener("click", async (event) => {
        event.preventDefault();
        option.classList.add("loading");
        option.setAttribute("aria-label", "Opening Stripe Checkout");

        try {
          const response = await fetch("/.netlify/functions/create-stripe-checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ tour: selectedSlug })
          });
          const data = await response.json();

          if (!response.ok || !data.url) {
            throw new Error(data.message || "Stripe Checkout could not be opened.");
          }

          window.location.href = data.url;
        } catch (error) {
          console.error("Stripe Checkout failed:", error);
          option.classList.remove("loading");
          option.setAttribute("aria-label", "Pay with Stripe");
          alert("Stripe Checkout is not ready yet. Please contact Zipton Tours to reserve.");
        }
      });
      return;
    }

    if (method === "M-Pesa") {
      option.href = "#";
      option.addEventListener("click", (event) => {
        event.preventDefault();
        openMpesaModal(tour, selectedSlug);
      });
      return;
    }

    if (method === "PayPal") {
      option.href = "#";
      option.addEventListener("click", async (event) => {
        event.preventDefault();
        option.classList.add("loading");
        option.setAttribute("aria-label", "Opening PayPal Checkout");

        try {
          const response = await fetch("/.netlify/functions/create-paypal-order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ tour: selectedSlug })
          });
          const data = await response.json();

          if (!response.ok || !data.url) {
            throw new Error(data.message || "PayPal Checkout could not be opened.");
          }

          window.location.href = data.url;
        } catch (error) {
          console.error("PayPal Checkout failed:", error);
          option.classList.remove("loading");
          option.setAttribute("aria-label", "Pay with PayPal");
          alert("PayPal Checkout is not ready yet. Please contact Zipton Tours to reserve.");
        }
      });
      return;
    }

    if (method === "PesaPal") {
      option.href = "#";
      option.addEventListener("click", async (event) => {
        event.preventDefault();
        option.classList.add("loading");
        option.setAttribute("aria-label", "Opening PesaPal Checkout");

        try {
          const response = await fetch("/.netlify/functions/create-pesapal-order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ tour: selectedSlug })
          });
          const data = await response.json();

          if (!response.ok || !data.url) {
            throw new Error(data.message || "PesaPal Checkout could not be opened.");
          }

          window.location.href = data.url;
        } catch (error) {
          console.error("PesaPal Checkout failed:", error);
          option.classList.remove("loading");
          option.setAttribute("aria-label", "Pay with PesaPal");
          alert("PesaPal Checkout is not ready yet. Please contact Zipton Tours to reserve.");
        }
      });
      return;
    }

    const methodMessage = encodeURIComponent(`Hello Zipton Tours, I would like to reserve the ${tour.title} and pay using ${method}.`);
    option.href = `https://wa.me/254710142850?text=${methodMessage}`;
  });
}

async function renderTourDetail() {
  const page = document.querySelector(".tour-detail-page");
  if (!page) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("tour") || "classic-safari-trail";
  let tour = tourDetails[slug] || tourDetails["classic-safari-trail"];
  let selectedSlug = tourDetails[slug] ? slug : "classic-safari-trail";

  applyTourDetail(tour, selectedSlug);

  try {
    const response = await fetch(`${toursApiURL}?slug=${encodeURIComponent(slug)}`);
    if (!response.ok) {
      throw new Error(`WordPress API returned ${response.status}`);
    }

    const post = await response.json();
    if (!post) return;

    tour = normalizeTourPost(post);
    selectedSlug = tour.slug || slug;
    applyTourDetail(tour, selectedSlug);
  } catch (error) {
    console.error("Failed to load WordPress tour detail:", error);
  }
}

renderTourDetail();

function openMpesaModal(tour, tourSlug) {
  const modal = document.querySelector("#mpesa-modal");
  const form = document.querySelector("#mpesa-form");
  const status = document.querySelector("#mpesa-status");
  const title = document.querySelector("#mpesa-modal-title");
  const input = document.querySelector("#mpesa-phone");

  if (!modal || !form || !status || !title || !input) return;

  title.textContent = `Pay for ${tour.title}`;
  status.textContent = "";
  form.dataset.tour = tourSlug;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  input.focus();
}

function closeMpesaModal() {
  const modal = document.querySelector("#mpesa-modal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

document.querySelectorAll("[data-close-mpesa]").forEach((button) => {
  button.addEventListener("click", closeMpesaModal);
});

const mpesaForm = document.querySelector("#mpesa-form");
const mpesaStatus = document.querySelector("#mpesa-status");

if (mpesaForm && mpesaStatus) {
  mpesaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = mpesaForm.querySelector("button[type='submit']");
    const phone = new FormData(mpesaForm).get("phone");

    mpesaStatus.textContent = "Sending STK Push...";
    submitButton.disabled = true;

    try {
      const response = await fetch("/.netlify/functions/create-mpesa-stk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone,
          tour: mpesaForm.dataset.tour
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "M-Pesa STK Push failed.");
      }

      mpesaStatus.textContent = data.message || "STK Push sent. Check your phone.";
      mpesaForm.reset();
    } catch (error) {
      console.error("M-Pesa STK Push failed:", error);
      mpesaStatus.textContent = error.message || "M-Pesa STK Push failed. Please try again.";
    } finally {
      submitButton.disabled = false;
    }
  });
}

async function capturePayPalReturn() {
  const title = document.querySelector("#paypal-status-title");
  const copy = document.querySelector("#paypal-status-copy");
  if (!title || !copy) return;

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
    title.textContent = "PayPal payment not completed";
    copy.textContent = "We could not find a PayPal order token. Please return to the tour page and try again.";
    return;
  }

  try {
    const response = await fetch("/.netlify/functions/capture-paypal-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ orderID: token })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "PayPal capture failed.");
    }

    title.textContent = "PayPal payment received";
    copy.textContent = "Thank you. Your PayPal reservation payment has been captured successfully. Zipton Tours will confirm the trip details directly.";
    document.title = "PayPal Payment Successful | Zipton Tours";

    // Premium success UX inside paypal-return.html
    try {
      const ref = sessionStorage.getItem("ziptonBookingRef") || "";
      const dataStr = sessionStorage.getItem("ziptonBookingData");
      const data = dataStr ? JSON.parse(dataStr) : {};

      const successView = document.getElementById("paypal-success-view");
      if (successView) {
        successView.style.display = "block";
      }

      const setText = (id, val) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = val || "—";
      };

      const fmtKSh = (n) => `KSh ${Number(n || 0).toLocaleString()}`;

      setText("paypal-success-booking-ref", ref || data.bookingRef);
      setText("paypal-success-tour-name", data.tourName);
      setText("paypal-success-guests", data.reservationType === 'Donation' 
        ? 'Support contribution' 
        : (data.guests ? `${data.guests} ${data.guests === 1 ? "Guest" : "Guests"}` : "—"));
      setText("paypal-success-duration", data.durationDays ? `${data.durationDays} Days` : "—");
      setText("paypal-success-amount-today", data.amountToday != null ? fmtKSh(data.amountToday) : "—");

      const btn = document.getElementById("paypal-success-view-booking");
      if (btn) {
        const tour = data.tourSlug || "";
        btn.href = `contact.html?bookingRef=${encodeURIComponent(ref || data.bookingRef || "")}&tour=${encodeURIComponent(tour)}`;
      }

      const article = document.getElementById("paypal-status-article");
      if (article) {
        const originalTitle = document.getElementById("paypal-status-title");
        const originalCopy = document.getElementById("paypal-status-copy");
        if (originalTitle) originalTitle.style.display = "none";
        if (originalCopy) originalCopy.style.display = "none";
      }
    } catch (uiErr) {
      console.warn("PayPal success UI render failed:", uiErr);
    }
  } catch (error) {
    console.error("PayPal capture failed:", error);
    title.textContent = "PayPal payment needs attention";
    copy.textContent = error.message || "We could not confirm this PayPal payment. Please contact Zipton Tours with your PayPal receipt.";
  }
}

capturePayPalReturn();
