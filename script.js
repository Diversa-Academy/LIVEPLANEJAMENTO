(() => {
  const config = window.LIVE_CONFIG || {};
  const form = document.querySelector('#registration-form');
  const button = document.querySelector('#submit-button');
  const note = document.querySelector('#form-note');
  const feedback = document.querySelector('#form-feedback');
  const watchLink = document.querySelector('#watch-link');
  const headerWatchLink = document.querySelector('#header-watch-link');
  const closingWatchLink = document.querySelector('#closing-watch-link');
  const mobileCta = document.querySelector('#mobile-cta');
  const arrowIcon = '<svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19 19 5M9 5h10v10"/></svg>';
  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  const countdown = document.querySelector('#countdown');
  const countdownHeading = document.querySelector('#countdown-heading');
  const countdownValues = document.querySelector('#countdown-values');
  const countdownStatus = document.querySelector('#countdown-status');
  const eventStartsAt = Date.parse(config.eventStartsAt || '2026-10-22T18:30:00-03:00');
  let countdownInterval = null;
  const twoDigits = (value) => String(value).padStart(2, '0');
  const renderCountdown = () => {
    if (!Number.isFinite(eventStartsAt)) {
      countdown.hidden = true;
      return;
    }
    const remaining = eventStartsAt - Date.now();
    if (remaining <= 0) {
      countdownValues.hidden = true;
      countdownStatus.hidden = true;
      countdownHeading.textContent = Date.now() - eventStartsAt < 6 * 60 * 60 * 1000
        ? 'A live já começou'
        : 'A data desta live já passou';
      countdown.setAttribute('aria-label', countdownHeading.textContent);
      if (countdownInterval) window.clearInterval(countdownInterval);
      return;
    }
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    document.querySelector('#countdown-days').textContent = twoDigits(days);
    document.querySelector('#countdown-hours').textContent = twoDigits(hours);
    document.querySelector('#countdown-minutes').textContent = twoDigits(minutes);
    document.querySelector('#countdown-seconds').textContent = twoDigits(seconds);
    countdown.setAttribute('aria-label', `Faltam ${days} dias, ${hours} horas, ${minutes} minutos e ${seconds} segundos para a live`);
  };
  renderCountdown();
  if (Number.isFinite(eventStartsAt) && eventStartsAt > Date.now()) {
    countdownInterval = window.setInterval(renderCountdown, 1000);
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) renderCountdown();
  });

  let youtubeUrl = null;
  try {
    const candidate = new URL(config.youtubeUrl || '');
    if (candidate.protocol === 'https:' && /^(?:www\.|m\.)?(?:youtube\.com|youtu\.be)$/.test(candidate.hostname)) {
      youtubeUrl = candidate.href;
    }
  } catch (_) {
    // Keep the pending state until the transmission URL is supplied.
  }
  if (youtubeUrl) {
    watchLink.href = youtubeUrl;
    watchLink.target = '_blank';
    watchLink.rel = 'noopener noreferrer';
    watchLink.removeAttribute('aria-disabled');
    watchLink.removeAttribute('tabindex');
    watchLink.classList.add('is-ready');
    watchLink.innerHTML = `Acessar a live ${arrowIcon}`;
    for (const link of [headerWatchLink, closingWatchLink]) link.href = youtubeUrl;
  }

  let registrationUrl = null;
  try {
    const candidate = new URL(config.registrationEndpoint || '');
    if (candidate.protocol === 'https:' && candidate.hostname === 'script.google.com' && /^\/macros\/s\/[^/]+\/exec$/.test(candidate.pathname)) {
      registrationUrl = candidate.href;
    }
  } catch (_) {
    // Keep registration unavailable until a valid destination is configured.
  }
  const ready = Boolean(registrationUrl);
  if (ready) {
    form.action = registrationUrl;
    for (const selector of ['#full-name', '#email', '#whatsapp']) {
      document.querySelector(selector).disabled = false;
    }
    button.disabled = false;
    button.innerHTML = `Quero ser avisado ${arrowIcon}`;
    note.hidden = true;
  }
  if (ready || youtubeUrl) {
    document.body.classList.add('has-mobile-cta');
    if (!ready) {
      mobileCta.href = youtubeUrl;
      mobileCta.target = '_blank';
      mobileCta.rel = 'noopener noreferrer';
      mobileCta.innerHTML = `Assistir no YouTube ${arrowIcon}`;
    }
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => {
        mobileCta.hidden = entry.isIntersecting;
      }, {threshold: 0.1});
      observer.observe(document.querySelector(ready ? '#inscricao' : '#transmissao'));
    } else {
      mobileCta.hidden = false;
    }
  }

  const fields = [
    {id:'full-name',error:'name-error',message:'Informe seu nome.'},
    {id:'email',error:'email-error',message:'Informe um e-mail válido.'},
    {id:'whatsapp',error:'whatsapp-error',message:'Informe um WhatsApp com DDD.'}
  ];
  const setError = (field, message) => {
    const input = document.getElementById(field.id);
    const error = document.getElementById(field.error);
    input.setAttribute('aria-invalid', String(Boolean(message)));
    input.setAttribute('aria-describedby', message ? field.error : '');
    error.textContent = message;
  };
  const validate = () => {
    let valid = true;
    for (const field of fields) {
      const input = document.getElementById(field.id);
      const value = input.value.trim();
      const okay = field.id === 'email'
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        : field.id === 'whatsapp'
          ? value.replace(/\D/g, '').length >= 10 && value.replace(/\D/g, '').length <= 13
          : value.length >= 2;
      setError(field, okay ? '' : field.message);
      if (!okay) valid = false;
    }
    return valid;
  };

  let submitting = false;
  form.addEventListener('submit', (event) => {
    if (!ready) {
      event.preventDefault();
      return;
    }
    if (submitting) {
      event.preventDefault();
      return;
    }
    feedback.textContent = '';
    feedback.dataset.state = '';
    if (!validate()) {
      event.preventDefault();
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      firstInvalid?.focus();
      return;
    }
    document.querySelector('#full-name').value = document.querySelector('#full-name').value.trim();
    document.querySelector('#email').value = document.querySelector('#email').value.trim();
    document.querySelector('#whatsapp').value = document.querySelector('#whatsapp').value.replace(/\D/g, '');
    submitting = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Abrindo confirmação…';
  });
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('pageshow', () => {
      if (ready) {
        submitting = false;
        button.removeAttribute('aria-busy');
        button.innerHTML = `Quero ser avisado ${arrowIcon}`;
      }
    });
  }
})();
