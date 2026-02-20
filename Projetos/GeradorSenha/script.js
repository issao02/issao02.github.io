const DEFAULTS = {
  numeral: '0123456789',
  maiuscula: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  minuscula: 'abcdefghijklmnopqrstuvwxyz',
  especial: '!@#$%^&*()_+-=[]{}|;:,./?~'
};

const passwordOutput = document.getElementById('passwordOutput');
const btnCopy = document.getElementById('btnCopy');
const btnGenerate = document.getElementById('btnGenerate');
const toast = document.getElementById('toast');

const checkboxes = {
  numeral: document.getElementById('useNumeral'),
  maiuscula: document.getElementById('useMaiuscula'),
  minuscula: document.getElementById('useMinuscula'),
  especial: document.getElementById('useEspecial')
};

const customInputs = {
  numeral: document.getElementById('customNumeral'),
  maiuscula: document.getElementById('customMaiuscula'),
  minuscula: document.getElementById('customMinuscula'),
  especial: document.getElementById('customEspecial')
};

const qtyInputs = {
  numeral: document.getElementById('qtyNumeral'),
  maiuscula: document.getElementById('qtyMaiuscula'),
  minuscula: document.getElementById('qtyMinuscula'),
  especial: document.getElementById('qtyEspecial')
};

// Expandir/colapsar personalização
document.querySelectorAll('.btn-expand').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const target = document.getElementById(targetId);
    const isExpanded = target.classList.toggle('show');
    btn.setAttribute('aria-expanded', isExpanded);
  });
});

// Validação por tipo de campo
const VALIDATORS = {
  numeral: /[^0-9]/g,
  maiuscula: /[^A-ZÀ-Ú]/g,
  minuscula: /[^a-zà-ú]/g,
  especial: /[a-zA-Z0-9à-úÀ-Ú\s]/g
};

function validateAndFilterInput(input) {
  const type = input.dataset.type;
  const validator = VALIDATORS[type];
  if (!validator) return;

  const start = input.selectionStart;
  const oldValue = input.value;
  const newValue = oldValue.replace(validator, '');
  const removedCount = oldValue.length - newValue.length;

  if (oldValue !== newValue) {
    input.value = newValue;
    const newPos = Math.max(0, start - removedCount);
    input.setSelectionRange(newPos, newPos);
  }
}

Object.values(customInputs).forEach(input => {
  input.addEventListener('input', () => validateAndFilterInput(input));
  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const type = input.dataset.type;
    const validator = VALIDATORS[type];
    const filtered = pasted.replace(validator, '');
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value;
    input.value = value.slice(0, start) + filtered + value.slice(end);
    input.setSelectionRange(start + filtered.length, start + filtered.length);
  });
});

function getCharsForType(type) {
  const isChecked = checkboxes[type].checked;
  const custom = (customInputs[type].value || '').replace(/\s/g, '');
  const chars = custom || DEFAULTS[type];
  return isChecked ? chars : '';
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generatePassword() {
  const quantities = {
    numeral: parseInt(qtyInputs.numeral.value, 10) || 0,
    maiuscula: parseInt(qtyInputs.maiuscula.value, 10) || 0,
    minuscula: parseInt(qtyInputs.minuscula.value, 10) || 0,
    especial: parseInt(qtyInputs.especial.value, 10) || 0
  };

  const chars = {
    numeral: getCharsForType('numeral'),
    maiuscula: getCharsForType('maiuscula'),
    minuscula: getCharsForType('minuscula'),
    especial: getCharsForType('especial')
  };

  const allChars = chars.numeral + chars.maiuscula + chars.minuscula + chars.especial;
  if (!allChars) {
    passwordOutput.value = '';
    passwordOutput.placeholder = 'Marque ao menos um tipo de caractere!';
    return;
  }

  const total = quantities.numeral + quantities.maiuscula + quantities.minuscula + quantities.especial;
  if (total === 0) {
    passwordOutput.value = '';
    passwordOutput.placeholder = 'Informe a quantidade em ao menos um tipo.';
    return;
  }

  passwordOutput.placeholder = 'Sua senha aparecerá aqui';

  const parts = [];
  if (quantities.numeral > 0 && chars.numeral) {
    for (let i = 0; i < quantities.numeral; i++) {
      parts.push(chars.numeral[Math.floor(Math.random() * chars.numeral.length)]);
    }
  }
  if (quantities.maiuscula > 0 && chars.maiuscula) {
    for (let i = 0; i < quantities.maiuscula; i++) {
      parts.push(chars.maiuscula[Math.floor(Math.random() * chars.maiuscula.length)]);
    }
  }
  if (quantities.minuscula > 0 && chars.minuscula) {
    for (let i = 0; i < quantities.minuscula; i++) {
      parts.push(chars.minuscula[Math.floor(Math.random() * chars.minuscula.length)]);
    }
  }
  if (quantities.especial > 0 && chars.especial) {
    for (let i = 0; i < quantities.especial; i++) {
      parts.push(chars.especial[Math.floor(Math.random() * chars.especial.length)]);
    }
  }

  passwordOutput.value = shuffleArray(parts).join('');
}

function copyToClipboard() {
  const text = passwordOutput.value;
  if (!text) return;

  navigator.clipboard.writeText(text).then(() => {
    toast.textContent = 'Copiado!';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1500);
  }).catch(() => {
    toast.textContent = 'Erro ao copiar';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1500);
  });
}

btnGenerate.addEventListener('click', generatePassword);
btnCopy.addEventListener('click', copyToClipboard);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    e.preventDefault();
    generatePassword();
  }
});

// Inicialização
generatePassword();
