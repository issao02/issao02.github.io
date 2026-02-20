(function () {
  'use strict';

  const COLOR_PRESETS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
    '#6366f1', '#0ea5e9', '#a855f7', '#f43f5e', '#84cc16',
    '#78716c', '#1e293b', '#0f172a', '#f8fafc', '#f1f5f9'
  ];

  const els = {
    colorPalette: document.getElementById('colorPalette'),
    btnAddColor: document.getElementById('btnAddColor'),
    colorPickerPopover: document.getElementById('colorPickerPopover'),
    colorPresets: document.getElementById('colorPresets'),
    colorPickerInput: document.getElementById('colorPickerInput'),
    colorHexInput: document.getElementById('colorHexInput'),
    btnConfirmColor: document.getElementById('btnConfirmColor'),
    siteForm: document.getElementById('siteForm'),
    galleryTypesArea: document.getElementById('galleryTypesArea'),
    galleryTypesCount: document.getElementById('galleryTypesCount'),
    galleryTypesList: document.getElementById('galleryTypesList'),
    socialInputs: document.getElementById('socialInputs'),
    btnAddSocial: document.getElementById('btnAddSocial'),
    promptOutput: document.getElementById('promptOutput'),
    htmlInput: document.getElementById('htmlInput'),
    btnPreview: document.getElementById('btnPreview'),
    viewerPlaceholder: document.getElementById('viewerPlaceholder'),
    viewerWrapper: document.getElementById('viewerWrapper'),
    siteViewer: document.getElementById('siteViewer'),
    htmlEditor: document.getElementById('htmlEditor'),
    viewModeScreen: document.getElementById('viewModeScreen'),
    viewModeCode: document.getElementById('viewModeCode'),
    btnViewScreen: document.getElementById('btnViewScreen'),
    btnViewCode: document.getElementById('btnViewCode'),
    btnEditCode: document.getElementById('btnEditCode'),
    btnApplyCode: document.getElementById('btnApplyCode'),
    manualFallback: document.getElementById('manualFallback'),
    manualFallbackMsg: document.getElementById('manualFallbackMsg'),
    previewContainer: document.getElementById('previewContainer'),
    viewBtns: document.querySelectorAll('.view-btn'),
    viewModeLabel: document.getElementById('viewModeLabel'),
    btnGenerate: document.getElementById('btnGenerate'),
    toast: document.getElementById('toast')
  };

  // ========== Paleta de cores ==========
  function addColorSlot(hex = '#6366f1') {
    const div = document.createElement('div');
    div.className = 'color-slot';
    div.innerHTML = `
      <input type="color" value="${hex}" class="color-picker">
      <span class="color-hex">${hex}</span>
      <button type="button" class="remove-color" aria-label="Remover cor">×</button>
    `;
    const picker = div.querySelector('.color-picker');
    const hexSpan = div.querySelector('.color-hex');
    const removeBtn = div.querySelector('.remove-color');

    picker.addEventListener('input', () => { hexSpan.textContent = picker.value; });
    removeBtn.addEventListener('click', () => {
      if (els.colorPalette.children.length > 1) div.remove();
    });

    els.colorPalette.appendChild(div);
    els.colorPickerPopover.hidden = true;
  }

  function renderColorPresets() {
    els.colorPresets.innerHTML = '';
    COLOR_PRESETS.forEach(hex => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-preset-btn';
      btn.style.background = hex;
      btn.title = hex + ' (duplo clique para adicionar)';
      btn.addEventListener('click', () => {
        els.colorPickerInput.value = hex;
        els.colorHexInput.value = hex;
      });
      btn.addEventListener('dblclick', () => {
        addColorSlot(hex);
        els.colorPickerPopover.hidden = true;
      });
      els.colorPresets.appendChild(btn);
    });
  }

  els.btnAddColor.addEventListener('click', () => {
    const isHidden = els.colorPickerPopover.hidden;
    els.colorPickerPopover.hidden = !isHidden;
    if (!isHidden) return;
    els.colorPickerInput.value = '#6366f1';
    els.colorHexInput.value = '#6366f1';
  });

  els.colorPickerInput.addEventListener('input', () => { els.colorHexInput.value = els.colorPickerInput.value; });
  els.colorHexInput.addEventListener('input', (e) => {
    const val = e.target.value;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) els.colorPickerInput.value = val;
  });

  els.btnConfirmColor.addEventListener('click', () => {
    let hex = els.colorHexInput.value.trim();
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      addColorSlot(hex);
      els.colorPickerPopover.hidden = true;
    } else {
      showToast('Digite uma cor hex válida (ex: #6366f1)');
    }
  });

  renderColorPresets();

  // ========== Galeria ==========
  function getGalleryColors() {
    return Array.from(els.colorPalette.querySelectorAll('.color-slot'))
      .map(s => s.querySelector('.color-picker')?.value || '#6366f1');
  }

  function updateGalleryTypesUI() {
    const n = parseInt(els.galleryTypesCount.value, 10) || 1;
    els.galleryTypesList.innerHTML = '';
    const labels = ['Portfólio', 'Serviços', 'Produtos', 'Galeria', 'Trabalhos'];
    for (let i = 0; i < n; i++) {
      const row = document.createElement('div');
      row.className = 'gallery-type-row';
      row.innerHTML = `
        <div class="gallery-type-field" style="flex:1;min-width:120px">
          <label>Tipo ${i + 1} (nome)</label>
          <input type="text" class="gallery-type-name" placeholder="${labels[i] || 'Tipo ' + (i + 1)}">
        </div>
        <div class="gallery-type-field" style="width:90px">
          <label>Qtd imagens</label>
          <input type="number" class="gallery-type-qty" min="1" max="20" value="4">
        </div>
      `;
      els.galleryTypesList.appendChild(row);
    }
  }

  function toggleGalleryConfig() {
    const galeriaChecked = document.querySelector('input[name="section"][value="galeria"]')?.checked;
    const configSection = document.getElementById('galleryConfigSection');
    if (configSection) {
      configSection.hidden = !galeriaChecked;
      if (galeriaChecked) updateGalleryTypesUI();
    }
  }

  document.querySelectorAll('input[name="section"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.value === 'galeria') toggleGalleryConfig();
    });
  });
  els.galleryTypesCount.addEventListener('change', updateGalleryTypesUI);

  toggleGalleryConfig();

  // ========== Redes sociais ==========
  function addSocialRow() {
    const row = document.createElement('div');
    row.className = 'social-row';
    row.innerHTML = `
      <select class="social-select">
        <option value="">Selecione</option>
        <option value="instagram">Instagram</option>
        <option value="facebook">Facebook</option>
        <option value="twitter">X (Twitter)</option>
        <option value="linkedin">LinkedIn</option>
        <option value="youtube">YouTube</option>
        <option value="tiktok">TikTok</option>
      </select>
      <input type="url" class="social-url" placeholder="URL">
    `;
    els.socialInputs.appendChild(row);
  }
  els.btnAddSocial.addEventListener('click', addSocialRow);

  // ========== Build prompt ==========
  function buildPrompt() {
    const colors = getGalleryColors();
    const title = document.getElementById('siteTitle').value.trim() || 'Meu Site';
    const description = document.getElementById('siteDescription').value.trim() || '';
    const contactType = document.querySelector('input[name="contactType"]:checked')?.value || 'email';
    const contactValue = document.getElementById('contactValue').value.trim();
    const wantGallery = document.querySelector('input[name="section"][value="galeria"]')?.checked;

    const sectionLabels = {
      hero: 'Hero Section', sobre: 'Sobre', servicos: 'Serviços', galeria: 'Galeria',
      depoimentos: 'Depoimentos', faq: 'FAQ', blog: 'Blog', contato: 'Contato',
      whatsapp: 'Integração WhatsApp', calendar: 'Integração Google Calendar',
      mapa: 'Localização', footer: 'Footer'
    };
    const checkedSections = Array.from(document.querySelectorAll('input[name="section"]:checked'))
      .map(cb => sectionLabels[cb.value] || cb.value);
    const wantWhatsApp = document.getElementById('wantWhatsAppBtn').checked;
    const whatsNumber = document.getElementById('whatsAppNumber').value.trim();
    const socialRows = els.socialInputs.querySelectorAll('.social-row');
    const socials = [];
    socialRows.forEach(r => {
      const sel = r.querySelector('.social-select');
      const url = r.querySelector('.social-url')?.value?.trim();
      if (sel?.value && url) socials.push({ name: sel.value, url });
    });
    const layout = document.getElementById('layoutSelect').value;
    const style = document.getElementById('styleSelect').value;
    const observations = document.getElementById('observations').value.trim();

    const styleNames = {
      classic: 'Clássico', modern: 'Moderno', minimalist: 'Minimalista',
      brutalist: 'Brutalista', elegant: 'Elegante', bold: 'Bold / Impactante',
      glassmorphism: 'Glassmorphism', retro: 'Retrô', corporate: 'Corporativo', creative: 'Criativo / Artístico'
    };

    let p = `Crie um site HTML completo, em uma única página, com CSS inline ou em <style> no <head>.

**IMPORTANTE - Imagens:** Use APENAS imagens da internet. Busque URLs reais de imagens royalty-free em Unsplash (https://images.unsplash.com), Pexels (https://images.pexels.com) ou Pixabay. Cole a URL completa no src das tags <img>. Exemplo: <img src="https://images.unsplash.com/photo-xxx" alt="descrição">. NUNCA use placeholders como placehold.co ou lorem.pics - use imagens reais que tornem o site visualmente atraente.\n\n`;
    p += `**Título:** ${title}\n`;
    if (description) p += `**Descrição/conteúdo:** ${description}\n`;
    p += `**Seções obrigatórias (inclua APENAS estas):** ${checkedSections.join(', ')}\n`;
    p += `**Paleta de cores (use como base):** ${colors.join(', ')}\n`;
    p += `**Estilo visual:** ${styleNames[style] || style}\n`;

    if (contactType === 'email' && contactValue) p += `**Contato:** Inclua formulário ou link de email: ${contactValue}\n`;
    if (contactType === 'whatsapp' && contactValue) p += `**Contato:** Link/botão para WhatsApp: ${contactValue}\n`;
    if (wantWhatsApp && whatsNumber) p += `**Botão WhatsApp fixo:** Canto inferior direito, link para https://wa.me/${whatsNumber.replace(/\D/g, '')}\n`;

    if (checkedSections.includes('Galeria') && wantGallery) {
      const rows = els.galleryTypesList.querySelectorAll('.gallery-type-row');
      const types = [];
      rows.forEach((r, i) => {
        const name = r.querySelector('.gallery-type-name')?.value?.trim() || `Tipo ${i + 1}`;
        const qty = parseInt(r.querySelector('.gallery-type-qty')?.value, 10) || 4;
        types.push({ name, qty });
      });
      p += `**Galeria (detalhes):** USE URLs REAIS de imagens. Exemplos: https://images.unsplash.com/photo-1557683316-973673baf926?w=600 (Unsplash), https://images.pexels.com/photos/xxx (Pexels). ${rows.length} tipo(s):\n`;
      types.forEach(t => p += `- "${t.name}": ${t.qty} imagens\n`);
      p += `Miniaturas com botões < > e lightbox ao clicar.\n`;
    }

    if (socials.length > 0) p += `**Redes sociais:** ${socials.map(s => `${s.name}: ${s.url}`).join(' | ')}\n`;
    if (checkedSections.includes('Localização')) {
      p += `**Localização (OBRIGATÓRIO):** Inclua uma seção de localização com mapa interativo. Use Google Maps (iframe embed) ou OpenStreetMap. O mapa DEVE ser exibido - incorpore o iframe do mapa com endereço de exemplo ou coordenadas. NÃO omita o mapa.\n`;
    }
    p += `**Layout:** ${layout === 'scroll' ? 'Uma página com scroll suave' : 'Páginas/seções separadas'}\n`;
    if (observations) p += `**Observações:** ${observations}\n`;
    p += `\nRetorne APENAS o código HTML completo, sem explicações, sem markdown (\`\`\`html). Comece com <!DOCTYPE html>.`;
    return p;
  }

  // ========== Extrair HTML da resposta da IA ==========
  function extractHtml(text) {
    if (!text || typeof text !== 'string') return '';
    let html = text.trim();
    const mdMatch = html.match(/```(?:html)?\s*([\s\S]*?)```/);
    if (mdMatch) html = mdMatch[1].trim();
    if (!html.startsWith('<')) {
      const start = html.search(/<!DOCTYPE|<html/i);
      if (start >= 0) html = html.slice(start);
    }
    return html;
  }

  // ========== Chamar APIs de IA ==========
  async function callOpenAI(apiKey, prompt) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || res.statusText || 'Erro na API OpenAI');
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async function callGemini(apiKey, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192
        }
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || res.statusText || 'Erro na API Gemini');
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || '';
  }

  async function callClaude(apiKey, prompt) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || res.statusText || 'Erro na API Claude');
    }
    const data = await res.json();
    const block = data.content?.find(c => c.type === 'text');
    return block?.text || '';
  }

  let currentSiteHtml = '';

  // ========== Carregar HTML no visualizador ==========
  function loadHtmlInViewer(html) {
    currentSiteHtml = html;
    const doc = els.siteViewer.contentDocument || els.siteViewer.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    els.htmlEditor.value = html;
    els.viewerPlaceholder.hidden = true;
    els.manualFallback.hidden = true;
    els.viewerWrapper.hidden = false;
    const editBtns = document.querySelector('.edit-mode-btns');
    if (editBtns) editBtns.style.visibility = 'visible';
  }

  function applyCodeToScreen() {
    const html = els.htmlEditor.value.trim();
    if (html) {
      currentSiteHtml = html;
      const doc = els.siteViewer.contentDocument || els.siteViewer.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();
      switchEditMode('screen');
      showToast('Alterações aplicadas!');
    }
  }

  function switchEditMode(mode) {
    const isCode = mode === 'code';
    if (!isCode && els.viewModeCode && !els.viewModeCode.hidden) {
      const edited = els.htmlEditor?.value?.trim();
      if (edited) {
        currentSiteHtml = edited;
        const doc = els.siteViewer.contentDocument || els.siteViewer.contentWindow.document;
        doc.open();
        doc.write(edited);
        doc.close();
      }
    }
    els.viewModeScreen.hidden = isCode;
    els.viewModeCode.hidden = !isCode;
    els.btnViewScreen.classList.toggle('active', !isCode);
    els.btnViewCode.classList.toggle('active', isCode);
    if (isCode) {
      els.htmlEditor.value = currentSiteHtml;
      els.htmlEditor.focus();
    }
  }

  els.btnViewScreen.addEventListener('click', () => switchEditMode('screen'));
  els.btnViewCode.addEventListener('click', () => switchEditMode('code'));
  els.btnEditCode?.addEventListener('click', () => switchEditMode('code'));
  els.btnApplyCode.addEventListener('click', applyCodeToScreen);

  // ========== Submit - Gerar site ==========
  els.siteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const apiKey = document.getElementById('apiKey').value.trim();
    const aiSelect = document.getElementById('aiSelect').value;

    const prompt = buildPrompt();
    els.btnGenerate.disabled = true;
    showToast('Gerando site...');

    const tryApi = async () => {
      if (aiSelect === 'openai') return callOpenAI(apiKey, prompt);
      if (aiSelect === 'gemini') return callGemini(apiKey, prompt);
      if (aiSelect === 'claude') return callClaude(apiKey, prompt);
      throw new Error('IA não suportada');
    };

    try {
      if (!apiKey) {
        throw new Error('Informe a API Key da IA selecionada');
      }
      const raw = await tryApi();
      const html = extractHtml(raw);
      if (!html) throw new Error('Resposta vazia ou inválida da IA');
      loadHtmlInViewer(html);
      showToast('Site gerado!');
    } catch (err) {
      showToast(err.message || 'Erro ao gerar. Tente o modo manual.');
      els.manualFallback.hidden = false;
      els.manualFallbackMsg.textContent = err.message || 'Use o modo manual abaixo.';
      els.promptOutput.value = prompt;
      els.htmlInput.value = '';
    } finally {
      els.btnGenerate.disabled = false;
    }
  });

  // ========== Modo manual ==========
  els.btnPreview.addEventListener('click', () => {
    const html = els.htmlInput.value.trim();
    if (!html) {
      showToast('Cole o HTML no campo acima.');
      return;
    }
    loadHtmlInViewer(html);
  });

  // ========== Modos de visualização ==========
  const viewLabels = { mobile: 'Celular', tablet: 'Tablet', full: 'Full' };
  els.viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      els.viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      els.previewContainer.className = 'preview-container preview-' + mode;
      els.viewModeLabel.textContent = viewLabels[mode];
    });
  });

  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    setTimeout(() => els.toast.classList.remove('show'), 3000);
  }
})();
