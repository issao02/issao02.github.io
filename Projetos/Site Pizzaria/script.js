// ============================================
// CONFIGURAÇÃO - Altere o número para o WhatsApp da sua pizzaria
// Formato: código do país + DDD + número (pode usar espaços, traços ou parênteses)
// Exemplo: 55 11 98765-4321 ou 5511987654321
// Se não funcionar, no index.html mude script.js?v=1 para script.js?v=2 (força o navegador a recarregar)
// ============================================
const WHATSAPP_NUMBER = '5511985024525';

function getWhatsAppNumber() {
  const digits = WHATSAPP_NUMBER.replace(/\D/g, '');
  return digits.startsWith('55') ? digits : '55' + digits;
}

// Endereço da pizzaria (para o botão "Ir" no Google Maps)
const ENDERECO_PIZZARIA = 'Av. Paulista, São Paulo - SP';

const cart = [];
const cartItemsEl = document.getElementById('cartItems');
const cartCountEl = document.getElementById('cartCount');
const cartTotalEl = document.getElementById('cartTotal');
const cartEmptyEl = document.getElementById('cartEmpty');
const cartSidebarEl = document.getElementById('cartSidebar');
const cartOverlayEl = document.getElementById('cartOverlay');
const cartToggleEl = document.getElementById('cartToggle');
const cartCloseEl = document.getElementById('cartClose');
const btnWhatsAppEl = document.getElementById('btnWhatsApp');

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-menu a').forEach(a => {
    a.classList.toggle('active', a.dataset.screen === screenId);
  });
}

document.querySelectorAll('[data-screen]').forEach(el => {
  if (el.tagName === 'A') {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      showScreen(el.dataset.screen);
    });
  }
});

const whatsappFloat = document.getElementById('whatsappFloat');
if (whatsappFloat) {
  whatsappFloat.href = `https://wa.me/${getWhatsAppNumber()}`;
}

const btnIrRota = document.getElementById('btnIrRota');
const mapaEmbed = document.getElementById('mapaEmbed');
if (btnIrRota) {
  btnIrRota.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ENDERECO_PIZZARIA)}`;
}
if (mapaEmbed) {
  mapaEmbed.src = `https://maps.google.com/maps?q=${encodeURIComponent(ENDERECO_PIZZARIA)}&z=15&output=embed`;
}

function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function getCartTotal() {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function getCartCount() {
  return cart.reduce((count, item) => count + item.quantity, 0);
}

function findCartItem(id, size) {
  return cart.find(item => item.id === id && item.size === size);
}

function getPriceBySize(basePrice, size) {
  if (size === 'inteira') return basePrice;
  if (size === 'meia') return basePrice / 2;
  if (size === '1/4') return basePrice / 4;
  return basePrice;
}

function getSizeLabel(size) {
  if (size === 'inteira') return 'Pizza inteira';
  if (size === 'meia') return 'Meia pizza';
  if (size === '1/4') return '¼ da pizza';
  return size;
}

function getTotalPizzas() {
  let total = 0;
  cart.forEach(item => {
    if (item.size === 'inteira') total += item.quantity * 1;
    else if (item.size === 'meia') total += item.quantity * 0.5;
    else if (item.size === '1/4') total += item.quantity * 0.25;
  });
  return total;
}

function pedidoValido() {
  const total = getTotalPizzas();
  if (total < 1) return false;
  const ehNumeroInteiro = (n) => Math.abs(n - Math.round(n)) < 0.001;
  return ehNumeroInteiro(total);
}

function addToCart(id, name, basePrice, size) {
  const price = getPriceBySize(basePrice, size);
  const existing = findCartItem(id, size);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id, name, price, basePrice, size, quantity: 1 });
  }
  updateCartUI();
  openCart();
}

function removeFromCart(id, size) {
  const index = cart.findIndex(item => item.id === id && item.size === size);
  if (index !== -1) {
    cart.splice(index, 1);
    updateCartUI();
  }
}

function updateQuantity(id, size, delta) {
  const item = findCartItem(id, size);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(id, size);
  } else {
    updateCartUI();
  }
}

function updateCartUI() {
  cartCountEl.textContent = getCartCount();
  cartTotalEl.textContent = formatPrice(getCartTotal());

  if (cart.length === 0) {
    cartEmptyEl.style.display = 'block';
    cartItemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());
    btnWhatsAppEl.classList.add('disabled');
    btnWhatsAppEl.disabled = true;
    return;
  }

  cartEmptyEl.style.display = 'none';
  btnWhatsAppEl.classList.remove('disabled');
  btnWhatsAppEl.disabled = false;

  const existingItems = cartItemsEl.querySelectorAll('.cart-item');
  existingItems.forEach(el => el.remove());

  cart.forEach(item => {
    const sizeLabel = item.size !== 'inteira' ? ` (${getSizeLabel(item.size)})` : '';
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}${sizeLabel}</div>
        <div class="cart-item-price">${formatPrice(item.price)} × ${item.quantity}</div>
      </div>
      <div class="cart-item-qty">
        <button type="button" data-action="decrease" data-id="${item.id}" data-size="${item.size}">−</button>
        <span>${item.quantity}</span>
        <button type="button" data-action="increase" data-id="${item.id}" data-size="${item.size}">+</button>
      </div>
      <button type="button" class="cart-item-remove" data-id="${item.id}" data-size="${item.size}" aria-label="Remover">🗑️</button>
    `;
    cartItemsEl.appendChild(div);
  });

  bindCartEvents();
}

function bindCartEvents() {
  cartItemsEl.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const size = btn.dataset.size;
      const action = btn.dataset.action;
      if (action === 'increase') updateQuantity(id, size, 1);
      if (action === 'decrease') updateQuantity(id, size, -1);
    });
  });

  cartItemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCart(parseInt(btn.dataset.id), btn.dataset.size);
    });
  });
}

function openCart() {
  cartSidebarEl.classList.add('open');
  cartOverlayEl.classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartSidebarEl.classList.remove('open');
  cartOverlayEl.classList.remove('visible');
  document.body.style.overflow = '';
}

function generateWhatsAppMessage() {
  const name = document.getElementById('customerName').value.trim();
  const address = document.getElementById('customerAddress').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const entregaRetirar = document.getElementById('entregaRetirar').value;
  const pagamento = document.getElementById('pagamento').value;

  let msg = `🍕 *NOVO PEDIDO - Bella Napoli*\n\n`;
  msg += `Cliente: ${name}\n`;
  msg += `Entrega ou Retirar: ${entregaRetirar}\n`;
  msg += `Forma de pagamento: ${pagamento}\n`;
  if (entregaRetirar === 'Entrega') msg += `Endereço: ${address}\n`;
  msg += `Telefone: ${phone}\n\n`;
  msg += `Itens do pedido:\n`;

  cart.forEach(item => {
    const sizeSuffix = item.size !== 'inteira' ? ` (${getSizeLabel(item.size)})` : '';
    msg += `• ${item.name}${sizeSuffix} x${item.quantity} - ${formatPrice(item.price * item.quantity)}\n`;
  });

  msg += `\n*Total: ${formatPrice(getCartTotal())}*`;

  return encodeURIComponent(msg);
}

function toggleAddressField() {
  const entregaRetirar = document.getElementById('entregaRetirar');
  const addressField = document.getElementById('addressField');
  const addressInput = document.getElementById('customerAddress');
  if (entregaRetirar.value === 'Retirar no local') {
    addressField.style.display = 'none';
    addressInput.removeAttribute('required');
    addressInput.value = '';
  } else {
    addressField.style.display = 'block';
    addressInput.setAttribute('required', '');
  }
}

function openWhatsAppModal() {
  if (cart.length === 0) return;
  if (!pedidoValido()) {
    alert('O pedido está pizza incompleto');
    return;
  }
  document.getElementById('whatsappModal').classList.add('visible');
  toggleAddressField();
  document.getElementById('customerName').focus();
}

function closeWhatsAppModal() {
  document.getElementById('whatsappModal').classList.remove('visible');
}

function validarTelefone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits[2] === '9') return true;
  if (digits.length === 10 && digits[2] !== '9') return true;
  return false;
}

function sendToWhatsApp(e) {
  e.preventDefault();
  if (!pedidoValido()) {
    alert('O pedido precisa completar pizzas inteiras (sem fração).');
    return;
  }
  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const entregaRetirar = document.getElementById('entregaRetirar').value;
  const address = document.getElementById('customerAddress').value.trim();

  if (!name) {
    alert('Por favor, preencha seu nome.');
    document.getElementById('customerName').focus();
    return;
  }
  if (name.length < 2) {
    alert('O nome deve ter pelo menos 2 caracteres.');
    document.getElementById('customerName').focus();
    return;
  }
  if (!phone) {
    alert('Por favor, preencha seu telefone.');
    document.getElementById('customerPhone').focus();
    return;
  }
  if (!validarTelefone(phone)) {
    alert('Telefone inválido. Use o formato (11) 99999-9999 ou 11999999999.');
    document.getElementById('customerPhone').focus();
    return;
  }
  if (entregaRetirar === 'Entrega' && !address) {
    alert('Por favor, preencha o endereço para entrega.');
    document.getElementById('customerAddress').focus();
    return;
  }

  const message = generateWhatsAppMessage();
  const url = `https://wa.me/${getWhatsAppNumber()}?text=${message}`;
  window.open(url, '_blank');
  closeWhatsAppModal();
}

const pizzaSizeModal = document.getElementById('pizzaSizeModal');
const modalPizzaName = document.getElementById('modalPizzaName');
const modalPriceInteira = document.getElementById('modalPriceInteira');
const modalPriceMeia = document.getElementById('modalPriceMeia');
const modalPriceQuarto = document.getElementById('modalPriceQuarto');
const modalClose = document.getElementById('modalClose');

let selectedPizza = null;

function openPizzaSizeModal(id, name, basePrice) {
  selectedPizza = { id, name, basePrice };
  modalPizzaName.textContent = name;
  modalPriceInteira.textContent = formatPrice(basePrice);
  modalPriceMeia.textContent = formatPrice(basePrice / 2);
  modalPriceQuarto.textContent = formatPrice(basePrice / 4);
  pizzaSizeModal.classList.add('visible');
}

function closePizzaSizeModal() {
  pizzaSizeModal.classList.remove('visible');
  selectedPizza = null;
}

document.querySelectorAll('.size-option').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!selectedPizza) return;
    const size = btn.dataset.size;
    addToCart(selectedPizza.id, selectedPizza.name, selectedPizza.basePrice, size);
    closePizzaSizeModal();
  });
});

// Filtros rápidos do cardápio
const filterBtns = document.querySelectorAll('.filter-btn');
const pizzaCards = document.querySelectorAll('.pizza-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;

    pizzaCards.forEach(card => {
      const tags = (card.dataset.tags || '').split(' ');
      const matches = filter === 'todas' || tags.includes(filter);
      card.classList.toggle('hidden', !matches);
    });
  });
});

document.querySelectorAll('.btn-add').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.pizza-card');
    const id = parseInt(card.dataset.id);
    const name = card.dataset.name;
    const basePrice = parseFloat(card.dataset.price);
    openPizzaSizeModal(id, name, basePrice);
  });
});

modalClose.addEventListener('click', closePizzaSizeModal);
pizzaSizeModal.addEventListener('click', (e) => {
  if (e.target === pizzaSizeModal) closePizzaSizeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && pizzaSizeModal.classList.contains('visible')) {
    closePizzaSizeModal();
  }
});

cartToggleEl.addEventListener('click', openCart);
cartCloseEl.addEventListener('click', closeCart);
cartOverlayEl.addEventListener('click', closeCart);

btnWhatsAppEl.addEventListener('click', openWhatsAppModal);

document.getElementById('entregaRetirar').addEventListener('change', toggleAddressField);
document.getElementById('whatsappForm').addEventListener('submit', sendToWhatsApp);
document.getElementById('whatsappModalClose').addEventListener('click', closeWhatsAppModal);
document.getElementById('whatsappModal').addEventListener('click', (e) => {
  if (e.target.id === 'whatsappModal') closeWhatsAppModal();
});

updateCartUI();
