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
const reviewFilters = [...document.querySelectorAll("[data-review-filter]")];
const reviews = [...document.querySelectorAll("[data-review]")];
const reviewStatus = document.querySelector("[data-review-status]");
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

reviewFilters.forEach((filterButton) => {
  filterButton.addEventListener("click", () => {
    const topic = filterButton.dataset.reviewFilter ?? "all";
    let visibleCount = 0;

    reviewFilters.forEach((button) => {
      button.setAttribute("aria-pressed", button === filterButton ? "true" : "false");
    });

    reviews.forEach((review) => {
      const isVisible = topic === "all" || review.dataset.topic === topic;
      review.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    if (reviewStatus) {
      reviewStatus.textContent = `Showing ${visibleCount} sample review${visibleCount === 1 ? "" : "s"}`;
    }
  });
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
