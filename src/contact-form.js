(function () {
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('contact-submit');
  const feedback = document.getElementById('contact-feedback');
  if (!form || !submitBtn || !feedback) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const turnstileResponse = document.querySelector('[name="cf-turnstile-response"]');
    const token = turnstileResponse ? turnstileResponse.value : '';
    if (!token) {
      feedback.className = 'form-feedback error';
      feedback.textContent = 'Complete a verificação de segurança antes de enviar.';
      return;
    }
    const message = (document.getElementById('contact-message') || {}).value || '';
    if (message.trim().length < 10) {
      feedback.className = 'form-feedback error';
      feedback.textContent = 'A mensagem deve ter pelo menos 10 caracteres.';
      return;
    }

    submitBtn.disabled = true;
    feedback.className = 'form-feedback';
    feedback.textContent = '';

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message.trim(),
        name: (document.getElementById('contact-name') || {}).value.trim(),
        email: (document.getElementById('contact-email') || {}).value.trim(),
        website: (document.getElementById('website') || {}).value,
        'cf-turnstile-response': token,
      }),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error(data.error || 'Falha ao enviar');
          return data;
        });
      })
      .then(function () {
        feedback.className = 'form-feedback success';
        feedback.textContent = 'Mensagem enviada! Obrigado pelo retorno.';
        form.reset();
        if (typeof turnstile !== 'undefined' && document.getElementById('turnstile-widget')) {
          try {
            turnstile.reset();
          } catch (err) {}
        }
      })
      .catch(function (err) {
        feedback.className = 'form-feedback error';
        feedback.textContent = err.message || 'Erro ao enviar. Tente novamente.';
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });
})();
