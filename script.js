const page = document.querySelector("[data-single-price-cents]");
const bundleOptions = [...document.querySelectorAll("[data-bundle]")];
const quantityOutput = document.querySelector("[data-quantity]");
const quantityField = document.querySelector("[data-quantity-field]");
const decreaseButton = document.querySelector("[data-quantity-decrease]");
const increaseButton = document.querySelector("[data-quantity-increase]");
const totalPrice = document.querySelector("[data-total-price]");
const priceNote = document.querySelector("[data-price-note]");
const checkoutButton = document.querySelector("[data-checkout-button]");
const checkoutLabel = document.querySelector("[data-checkout-label]");
const checkoutStatus = document.querySelector("[data-checkout-status]");
const reviewTrack = document.querySelector("[data-review-track]");
const reviewPrevious = document.querySelector("[data-review-prev]");
const reviewNext = document.querySelector("[data-review-next]");
const faqItems = [...document.querySelectorAll(".faq-list details")];

const singlePriceCents = Number(page?.dataset.singlePriceCents ?? 8900);
const multiPriceCents = Number(page?.dataset.multiPriceCents ?? 6900);
const checkoutEndpoint = document.body.dataset.checkoutEndpoint?.trim() ?? "";
const money = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 });

let quantity = 1;
let bundle = "single";

const setStatus = (message, isError = false) => {
  if (!checkoutStatus) return;
  checkoutStatus.textContent = message;
  checkoutStatus.classList.toggle("is-error", isError);
};

const renderQuantity = () => {
  const isMulti = bundle === "multi";
  const unitPriceCents = isMulti ? multiPriceCents : singlePriceCents;
  if (quantityOutput) quantityOutput.value = String(quantity);
  if (totalPrice) totalPrice.textContent = `A$${money.format((unitPriceCents * quantity) / 100)}`;
  if (priceNote) priceNote.textContent = isMulti ? "A$69 each · provisional · incl. GST" : "Provisional · incl. GST";
  if (quantityField) quantityField.hidden = !isMulti;
  if (decreaseButton) decreaseButton.disabled = quantity === (isMulti ? 2 : 1);
  if (increaseButton) increaseButton.disabled = quantity === 10;
};

const changeQuantity = (amount) => {
  const minimum = bundle === "multi" ? 2 : 1;
  quantity = Math.min(10, Math.max(minimum, quantity + amount));
  renderQuantity();
};

decreaseButton?.addEventListener("click", () => changeQuantity(-1));
increaseButton?.addEventListener("click", () => changeQuantity(1));

bundleOptions.forEach((option) => {
  option.addEventListener("change", () => {
    if (!option.checked) return;
    bundle = option.value;
    quantity = bundle === "multi" ? Math.max(2, quantity) : 1;
    renderQuantity();
  });
});

const reviewStep = () => {
  const firstReview = reviewTrack?.querySelector(".review-item");
  return firstReview ? firstReview.getBoundingClientRect().width : 0;
};

const updateReviewControls = () => {
  if (!reviewTrack || !reviewPrevious || !reviewNext) return;
  const maximum = reviewTrack.scrollWidth - reviewTrack.clientWidth;
  reviewPrevious.disabled = reviewTrack.scrollLeft <= 1;
  reviewNext.disabled = reviewTrack.scrollLeft >= maximum - 1;
};

const moveReviews = (direction) => {
  reviewTrack?.scrollBy({ left: reviewStep() * direction, behavior: "smooth" });
};

reviewPrevious?.addEventListener("click", () => moveReviews(-1));
reviewNext?.addEventListener("click", () => moveReviews(1));
reviewTrack?.addEventListener("scroll", updateReviewControls, { passive: true });
reviewTrack?.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  moveReviews(event.key === "ArrowLeft" ? -1 : 1);
});
window.addEventListener("resize", updateReviewControls);

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
updateReviewControls();
