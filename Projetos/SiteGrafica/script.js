// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  if (currentScroll > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  lastScroll = currentScroll;
});

// ===== MENU MOBILE =====
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

navToggle?.addEventListener('click', () => {
  navMenu?.classList.toggle('active');
  navToggle.classList.toggle('active');
});

// Fechar menu ao clicar em link
document.querySelectorAll('.nav-menu a').forEach(link => {
  link.addEventListener('click', () => {
    navMenu?.classList.remove('active');
    navToggle?.classList.remove('active');
  });
});

// ===== REVEAL ON SCROLL =====
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach((el) => revealObserver.observe(el));

// ===== CONTADORES ANIMADOS =====
const counters = document.querySelectorAll('.numero-count');
let countersAnimated = false;

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting && !countersAnimated) {
      countersAnimated = true;
      counters.forEach((counter) => {
        const target = parseInt(counter.getAttribute('data-target'), 10);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
          current += step;
          if (current < target) {
            counter.textContent = Math.floor(current).toLocaleString('pt-BR');
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target.toLocaleString('pt-BR');
          }
        };
        updateCounter();
      });
    }
  });
}, { threshold: 0.5 });

counters.forEach((c) => counterObserver.observe(c));

// ===== SMOOTH SCROLL PARA LINKS =====
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ===== SEGMENTO - IMAGENS POR CATEGORIA =====
const segmentoImagens = {
  alimentos: {
    titulo: 'Materiais para Alimentos',
    imagens: [
      { url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&h=350&fit=crop', alt: 'Embalagens para alimentos' },
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=350&fit=crop', alt: 'Rótulos alimentícios' },
      { url: 'https://images.unsplash.com/photo-1602874801006-4e6e9c60b32d?w=500&h=350&fit=crop', alt: 'Caixas personalizadas' },
      { url: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=500&h=350&fit=crop', alt: 'Etiquetas para produtos' }
    ]
  },
  clinicas: {
    titulo: 'Materiais para Clínicas e Saúde',
    imagens: [
      { url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&h=350&fit=crop', alt: 'Materiais médicos' },
      { url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&h=350&fit=crop', alt: 'Etiquetas para medicamentos' },
      { url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&h=350&fit=crop', alt: 'Identificação hospitalar' },
      { url: 'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=500&h=350&fit=crop', alt: 'Materiais para farmácias' }
    ]
  },
  comercio: {
    titulo: 'Materiais para Comércio e Varejo',
    imagens: [
      { url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&h=350&fit=crop', alt: 'Sacos e embalagens' },
      { url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&h=350&fit=crop', alt: 'Catálogos e folders' },
      { url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&h=350&fit=crop', alt: 'Materiais promocionais' },
      { url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&h=350&fit=crop', alt: 'Embalagens para varejo' }
    ]
  },
  eventos: {
    titulo: 'Materiais para Eventos',
    imagens: [
      { url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&h=350&fit=crop', alt: 'Banners e placas' },
      { url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=500&h=350&fit=crop', alt: 'Convites e credenciais' },
      { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=350&fit=crop', alt: 'Sinalização de eventos' },
      { url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=500&h=350&fit=crop', alt: 'Materiais promocionais' }
    ]
  },
  industrias: {
    titulo: 'Materiais para Indústrias',
    imagens: [
      { url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=350&fit=crop', alt: 'Etiquetas industriais' },
      { url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=500&h=350&fit=crop', alt: 'Identificação de produtos' },
      { url: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=500&h=350&fit=crop', alt: 'Embalagens industriais' },
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=350&fit=crop', alt: 'Rótulos de segurança' }
    ]
  },
  construcao: {
    titulo: 'Materiais para Construção Civil',
    imagens: [
      { url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&h=350&fit=crop', alt: 'Placas de obra' },
      { url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500&h=350&fit=crop', alt: 'Sinalização de canteiro' },
      { url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&h=350&fit=crop', alt: 'Materiais imobiliários' },
      { url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&h=350&fit=crop', alt: 'Banners e faixas' }
    ]
  }
};

document.querySelectorAll('.categoria-item').forEach((item) => {
  item.addEventListener('click', function () {
    const segmento = this.getAttribute('data-segmento');
    const dados = segmentoImagens[segmento];
    if (!dados) return;

    document.querySelectorAll('.categoria-item').forEach((i) => i.classList.remove('active'));
    this.classList.add('active');

    const tituloEl = document.getElementById('segmentoTitulo');
    const galeriaEl = document.getElementById('segmentoImagens');
    if (tituloEl) tituloEl.textContent = dados.titulo;
    if (galeriaEl) {
      galeriaEl.classList.add('fade-out');
      setTimeout(() => {
        galeriaEl.innerHTML = dados.imagens.map((img) =>
          `<div class="galeria-item"><img src="${img.url}" alt="${img.alt}"></div>`
        ).join('');
        galeriaEl.classList.remove('fade-out');
      }, 200);
    }
  });
});
