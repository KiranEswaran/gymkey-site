const form = document.querySelector("[data-waitlist-form]");
const input = form?.querySelector("input[type='email']");
const status = document.querySelector("[data-waitlist-status]");

const setStatus = (message, state = "") => {
  if (!status) return;
  status.textContent = message;
  status.className = `form-status${state ? ` is-${state}` : ""}`;
};

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!input?.validity.valid) {
    input?.focus();
    setStatus("Enter a valid email address.", "error");
    return;
  }

  setStatus("The waitlist connection is being switched on.");
});
