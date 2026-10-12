"use strict";

const form = document.querySelector("#order-form");
const productField = document.querySelector("#product");
const quantityField = document.querySelector("#quantity");
const addressField = document.querySelector("#address");
const addressContainer = document.querySelector("#address-field");
const addressLabel = document.querySelector("#address-label");
const addressHint = document.querySelector("#address-hint");
const summary = document.querySelector("#order-summary");
const summaryDetails = document.querySelector("#summary-details");
const money = new Intl.NumberFormat("uk-UA");

const deliveryOptions = {
  courier: { label: "Кур’єр", fee: 120 },
  locker: { label: "Поштомат", fee: 80 },
  pickup: { label: "Самовивіз", fee: 0 },
};

function formatMoney(amount) {
  return `${money.format(amount)} грн`;
}

function getSelectedDelivery() {
  return form.querySelector('input[name="delivery"]:checked')?.value ?? "";
}

function getSelectedProduct() {
  const option = productField.selectedOptions[0];
  if (!option?.dataset.price) {
    return null;
  }

  return {
    name: option.dataset.name,
    price: Number(option.dataset.price),
  };
}

function getPriceDetails() {
  const product = getSelectedProduct();
  const quantity = Number(quantityField.value);
  const quantityIsValid = Number.isInteger(quantity) && quantity >= 1 && quantity <= 10;
  const itemSubtotal = product && quantityIsValid ? product.price * quantity : 0;
  const selectedDelivery = deliveryOptions[getSelectedDelivery()];
  const deliveryFee = selectedDelivery?.fee ?? 0;
  const promoCode = document.querySelector("#promo").value.trim().toUpperCase();
  const discount = promoCode === "STUDENT" ? Math.round(itemSubtotal * 0.1) : 0;

  return {
    product,
    quantity,
    quantityIsValid,
    itemSubtotal,
    deliveryFee,
    discount,
    total: itemSubtotal + deliveryFee - discount,
  };
}

function updatePrice() {
  const price = getPriceDetails();
  const quantityCanBePriced = price.quantityIsValid;

  document.querySelector("#items-price").textContent = quantityCanBePriced
    ? formatMoney(price.itemSubtotal)
    : "—";
  document.querySelector("#delivery-price").textContent = formatMoney(price.deliveryFee);
  document.querySelector("#discount-price").textContent = `−${formatMoney(price.discount)}`;
  document.querySelector("#total-price").textContent = quantityCanBePriced
    ? formatMoney(price.total)
    : "—";
}

function updateAddressField() {
  const delivery = getSelectedDelivery();
  const needsAddress = delivery === "courier" || delivery === "locker";

  addressContainer.hidden = !needsAddress;
  addressField.required = needsAddress;
  addressField.setAttribute("aria-required", String(needsAddress));

  if (delivery === "locker") {
    addressLabel.firstChild.textContent = "Місто та номер поштомата ";
    addressField.placeholder = "Наприклад, м. Київ, поштомат № 12345";
    addressField.autocomplete = "off";
    addressHint.textContent = "Вкажіть місто та номер зручного поштомата.";
  } else if (delivery === "courier") {
    addressLabel.firstChild.textContent = "Адреса доставки ";
    addressField.placeholder = "Наприклад, м. Київ, вул. Зелена, 12, кв. 5";
    addressField.autocomplete = "street-address";
    addressHint.textContent = "Кур’єру потрібні місто, вулиця та номер будинку.";
  } else {
    addressField.value = "";
    addressField.placeholder = "";
    addressHint.textContent = "";
    addressField.removeAttribute("aria-invalid");
    document.querySelector("#address-error").textContent = "";
  }
}

function clearErrors() {
  form.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
    field.removeAttribute("aria-invalid");
  });
  form.querySelectorAll(".field-error").forEach((message) => {
    message.textContent = "";
  });
}

function showError(field, messageId, message) {
  field.setAttribute("aria-invalid", "true");
  document.querySelector(`#${messageId}`).textContent = message;
}

function validateOrder() {
  clearErrors();
  const errors = [];
  const name = document.querySelector("#customer-name").value.trim();
  const email = document.querySelector("#email").value.trim();
  const phone = document.querySelector("#phone").value.trim();
  const delivery = getSelectedDelivery();
  const promo = document.querySelector("#promo").value.trim().toUpperCase();
  const terms = document.querySelector("#terms");
  const price = getPriceDetails();

  if (!price.product) {
    errors.push({
      field: productField,
      messageId: "product-error",
      message: "Оберіть рослину або набір.",
    });
  }

  if (!price.quantityIsValid) {
    errors.push({
      field: quantityField,
      messageId: "quantity-error",
      message: "Кількість повинна бути цілим числом від 1 до 10.",
    });
  }

  if (name.length < 2 || name.length > 60) {
    errors.push({
      field: document.querySelector("#customer-name"),
      messageId: "customer-name-error",
      message: "Введіть ім’я довжиною від 2 до 60 символів.",
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({
      field: document.querySelector("#email"),
      messageId: "email-error",
      message: "Введіть електронну адресу у форматі name@example.com.",
    });
  }

  if (phone) {
    const digitCount = phone.replace(/\D/g, "").length;
    if (!/^\+?[0-9()\s-]+$/.test(phone) || digitCount < 9 || digitCount > 15) {
      errors.push({
        field: document.querySelector("#phone"),
        messageId: "phone-error",
        message: "Перевірте номер: використайте цифри та, за потреби, +, пробіли або дужки.",
      });
    }
  }

  if (!Object.hasOwn(deliveryOptions, delivery)) {
    errors.push({
      field: form.querySelector(".delivery-options"),
      messageId: "delivery-error",
      message: "Оберіть спосіб отримання замовлення.",
    });
  }

  if (delivery === "courier" || delivery === "locker") {
    const address = addressField.value.trim();
    if (address.length < 5 || address.length > 120) {
      errors.push({
        field: addressField,
        messageId: "address-error",
        message: "Вкажіть дані доставки довжиною від 5 до 120 символів.",
      });
    }
  }

  if (promo && promo !== "STUDENT") {
    errors.push({
      field: document.querySelector("#promo"),
      messageId: "promo-error",
      message: "Промокод не знайдено. Перевірте написання або залиште поле порожнім.",
    });
  }

  if (!terms.checked) {
    errors.push({
      field: terms,
      messageId: "terms-error",
      message: "Підтвердіть, що дані замовлення правильні.",
    });
  }

  errors.forEach(({ field, messageId, message }) => {
    showError(field, messageId, message);
  });

  if (errors.length > 0) {
    errors[0].field.focus();
    return false;
  }

  return true;
}

function addSummaryRow(label, value, emphasized = false) {
  const row = document.createElement("div");
  const term = document.createElement("dt");
  const detail = document.createElement("dd");

  term.textContent = label;
  detail.textContent = value;
  if (emphasized) {
    detail.classList.add("summary-total");
  }

  row.append(term, detail);
  summaryDetails.append(row);
}

function showOrderSummary() {
  const price = getPriceDetails();
  const delivery = deliveryOptions[getSelectedDelivery()];
  const customerName = document.querySelector("#customer-name").value.trim();
  const email = document.querySelector("#email").value.trim();
  const phone = document.querySelector("#phone").value.trim();
  const promo = document.querySelector("#promo").value.trim().toUpperCase();
  const comment = document.querySelector("#comment").value.trim();

  summaryDetails.replaceChildren();
  addSummaryRow("Покупець", customerName);
  addSummaryRow("Електронна пошта", email);
  if (phone) {
    addSummaryRow("Телефон", phone);
  }
  addSummaryRow("Товар", `${price.product.name} × ${price.quantity}`);
  addSummaryRow("Отримання", delivery.label);
  if (getSelectedDelivery() !== "pickup") {
    addSummaryRow(
      getSelectedDelivery() === "locker" ? "Поштомат" : "Адреса",
      addressField.value.trim(),
    );
  }
  if (comment) {
    addSummaryRow("Коментар", comment);
  }
  if (promo === "STUDENT") {
    addSummaryRow("Знижка STUDENT", `−${formatMoney(price.discount)}`);
  }
  addSummaryRow("Загальна вартість", formatMoney(price.total), true);

  summary.hidden = false;
  document.querySelector("#summary-heading").focus();
}

function updateCommentCount() {
  const comment = document.querySelector("#comment");
  document.querySelector("#comment-count").textContent = String(comment.value.length);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validateOrder()) {
    return;
  }

  updatePrice();
  showOrderSummary();
});

form.addEventListener("input", (event) => {
  summary.hidden = true;
  const field = event.target;
  if (field instanceof HTMLElement && field.getAttribute("aria-invalid") === "true") {
    field.removeAttribute("aria-invalid");
    const message = field.getAttribute("aria-describedby")
      ?.split(" ")
      .map((id) => document.getElementById(id))
      .find((element) => element?.classList.contains("field-error"));
    if (message) {
      message.textContent = "";
    }
  }

  if (field === document.querySelector("#comment")) {
    updateCommentCount();
  }
  updatePrice();
});

form.addEventListener("change", (event) => {
  summary.hidden = true;

  if (event.target instanceof HTMLInputElement && event.target.name === "delivery") {
    updateAddressField();
  }
  if (event.target === productField || event.target.name === "delivery") {
    const error = event.target.name === "delivery"
      ? document.querySelector(".delivery-options")
      : event.target;
    error.removeAttribute("aria-invalid");
    const messageId = error === productField ? "product-error" : "delivery-error";
    document.querySelector(`#${messageId}`).textContent = "";
  }
  updatePrice();
});

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    clearErrors();
    summary.hidden = true;
    updateAddressField();
    updateCommentCount();
    updatePrice();
  }, 0);
});

document.querySelector("#edit-order").addEventListener("click", () => {
  summary.hidden = true;
  document.querySelector("#customer-name").focus();
});

updateAddressField();
updatePrice();
