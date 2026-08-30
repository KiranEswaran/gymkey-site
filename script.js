const page = document.querySelector("[data-unit-price-cents]");
const quantityOutput = document.querySelector("[data-quantity]");
const decreaseButton = document.querySelector("[data-quantity-decrease]");
const increaseButton = document.querySelector("[data-quantity-increase]");
const totalPrice = document.querySelector("[data-total-price]");
const checkoutButton = document.querySelector("[data-checkout-button]");
const checkoutLabel = document.querySelector("[data-checkout-label]");
const checkoutStatus = document.querySelector("[data-checkout-status]");

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
