const page = document.querySelector("[data-unit-price-cents]");
const quantityOutput = document.querySelector("[data-quantity]");
const decreaseButton = document.querySelector("[data-quantity-decrease]");
const increaseButton = document.querySelector("[data-quantity-increase]");
const totalPrice = document.querySelector("[data-total-price]");
const checkoutButton = document.querySelector("[data-checkout-button]");
const checkoutLabel = document.querySelector("[data-checkout-label]");
const checkoutStatus = document.querySelector("[data-checkout-status]");
const productStage = document.querySelector("[data-product-stage]");

const unitPriceCents = Number(page?.dataset.unitPriceCents ?? 8900);
const checkoutEndpoint = document.body.dataset.checkoutEndpoint?.trim() ?? "";
const money = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 });

let quantity = 1;

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

const canTrackPointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const resetProductTilt = () => {
  if (!productStage) return;
  productStage.classList.remove("is-tracking");
  productStage.style.setProperty("--rotate-x", "-1.4deg");
  productStage.style.setProperty("--rotate-y", "2deg");
  productStage.style.setProperty("--move-x", "0px");
  productStage.style.setProperty("--move-y", "0px");
};

if (productStage && canTrackPointer.matches && !prefersReducedMotion.matches) {
  productStage.addEventListener("pointermove", (event) => {
    const bounds = productStage.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    productStage.classList.add("is-tracking");
    productStage.style.setProperty("--rotate-x", `${(-y * 7).toFixed(2)}deg`);
    productStage.style.setProperty("--rotate-y", `${(x * 9).toFixed(2)}deg`);
    productStage.style.setProperty("--move-x", `${(x * 14).toFixed(1)}px`);
    productStage.style.setProperty("--move-y", `${(y * 10).toFixed(1)}px`);
  });

  productStage.addEventListener("pointerleave", resetProductTilt);
}

decreaseButton?.addEventListener("click", () => changeQuantity(-1));
increaseButton?.addEventListener("click", () => changeQuantity(1));

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
