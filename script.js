const page = document.querySelector("[data-unit-price-cents]");
const quantityOutput = document.querySelector("[data-quantity]");
const decreaseButton = document.querySelector("[data-quantity-decrease]");
const increaseButton = document.querySelector("[data-quantity-increase]");
const totalPrice = document.querySelector("[data-total-price]");
const checkoutButton = document.querySelector("[data-checkout-button]");
const checkoutLabel = document.querySelector("[data-checkout-label]");
const checkoutStatus = document.querySelector("[data-checkout-status]");
const carouselTrack = document.querySelector("[data-carousel-track]");
const carouselViewport = document.querySelector("[data-carousel-viewport]");
const carouselSlides = [...document.querySelectorAll("[data-carousel-slide]")];
const carouselDots = [...document.querySelectorAll("[data-carousel-dot]")];
const carouselPrevious = document.querySelector("[data-carousel-previous]");
const carouselNext = document.querySelector("[data-carousel-next]");
const carouselCurrent = document.querySelector("[data-carousel-current]");
const carouselStatus = document.querySelector("[data-carousel-status]");
const faqItems = [...document.querySelectorAll(".faq-list details")];

const unitPriceCents = Number(page?.dataset.unitPriceCents ?? 8900);
const checkoutEndpoint = document.body.dataset.checkoutEndpoint?.trim() ?? "";
const money = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 });

let quantity = 1;
let carouselIndex = 0;
let carouselPointerStart = null;

const setStatus = (message, isError = false) => {
  if (!checkoutStatus) return;
  checkoutStatus.textContent = message;
  checkoutStatus.classList.toggle("is-error", isError);
};

const renderQuantity = () => {
  if (quantityOutput) quantityOutput.value = String(quantity);
  if (totalPrice) totalPrice.textContent = `A$${money.format((unitPriceCents * quantity) / 100)}`;
  if (decreaseButton) decreaseButton.disabled = quantity === 1;
  if (increaseButton) increaseButton.disabled = quantity === 10;
};

const changeQuantity = (amount) => {
  quantity = Math.min(10, Math.max(1, quantity + amount));
  renderQuantity();
};

const renderCarousel = (nextIndex, announce = true) => {
  if (!carouselTrack || carouselSlides.length === 0) return;

  carouselIndex = (nextIndex + carouselSlides.length) % carouselSlides.length;
  carouselTrack.style.transform = `translate3d(-${carouselIndex * 100}%, 0, 0)`;

  carouselSlides.forEach((slide, index) => {
    slide.setAttribute("aria-hidden", index === carouselIndex ? "false" : "true");
  });

  carouselDots.forEach((dot, index) => {
    if (index === carouselIndex) dot.setAttribute("aria-current", "true");
    else dot.removeAttribute("aria-current");
  });

  if (carouselCurrent) carouselCurrent.textContent = String(carouselIndex + 1).padStart(2, "0");
  if (carouselStatus && announce) {
    carouselStatus.textContent = `Tester note ${carouselIndex + 1} of ${carouselSlides.length}`;
  }
};

decreaseButton?.addEventListener("click", () => changeQuantity(-1));
increaseButton?.addEventListener("click", () => changeQuantity(1));

carouselPrevious?.addEventListener("click", () => renderCarousel(carouselIndex - 1));
carouselNext?.addEventListener("click", () => renderCarousel(carouselIndex + 1));
carouselDots.forEach((dot, index) => dot.addEventListener("click", () => renderCarousel(index)));

carouselViewport?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    renderCarousel(carouselIndex - 1);
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    renderCarousel(carouselIndex + 1);
  }
});

carouselViewport?.addEventListener("pointerdown", (event) => {
  carouselPointerStart = event.clientX;
});

carouselViewport?.addEventListener("pointerup", (event) => {
  if (carouselPointerStart === null) return;
  const distance = event.clientX - carouselPointerStart;
  carouselPointerStart = null;
  if (Math.abs(distance) < 45) return;
  renderCarousel(carouselIndex + (distance < 0 ? 1 : -1));
});

carouselViewport?.addEventListener("pointercancel", () => {
  carouselPointerStart = null;
});

faqItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;
    faqItems.forEach((otherItem) => {
      if (otherItem !== item) otherItem.open = false;
    });
  });
});

if (checkoutEndpoint && checkoutButton && checkoutLabel) {
  checkoutButton.disabled = false;
  checkoutLabel.textContent = "Continue to secure checkout";
  setStatus("Quantity and total will be confirmed in Stripe before payment.");

  checkoutButton.addEventListener("click", async () => {
    checkoutButton.disabled = true;
    checkoutLabel.textContent = "Opening checkout…";
    setStatus("Creating a secure checkout session.");

    try {
      const response = await fetch(checkoutEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: "gymkey", quantity }),
      });
      const payload = await response.json();

      if (!response.ok || typeof payload.url !== "string") {
        throw new Error("Checkout session was not created.");
      }

      window.location.assign(payload.url);
    } catch {
      checkoutButton.disabled = false;
      checkoutLabel.textContent = "Try secure checkout again";
      setStatus("Checkout is temporarily unavailable. No payment was taken.", true);
    }
  });
}

renderQuantity();
renderCarousel(0, false);
