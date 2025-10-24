// Production-ready frontend script
const urlInput = document.getElementById('url');
const openBtn = document.getElementById('open');
const normalizeBtn = document.getElementById('normalize');
const msg = document.getElementById('message');
const openNewCheckbox = document.getElementById('open-new');
const noreferrerCheckbox = document.getElementById('noreferrer');
const useProxyCheckbox = document.getElementById('use-proxy');

const ALLOWED_HOSTS = [
  /(^|\.)youtube\.com$/i,
  /(^|\.)youtu\.be$/i,
  /(^|\.)youtube-nocookie\.com$/i
];

function showMessage(text, isError = true) {
  msg.textContent = text;
  msg.style.color = isError ? '#b91c1c' : '#065f46';
}

function isAllowedHost(host) {
  if (!host) return false;
  return ALLOWED_HOSTS.some(rx => rx.test(host));
}

function normalizeYouTubeUrl(input) {
  if (!input) return null;
  input = input.trim();
  try {
    const u = new URL(input);
    const hostname = u.hostname.toLowerCase();
    if (hostname === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      if (!id) return null;
      return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
    }
    if (hostname.endsWith('youtube.com') || hostname.endsWith('youtube-nocookie.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/watch?v=${encodeURIComponent(v)}`;
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        if (parts[0] === 'embed' && parts[1]) return `https://www.youtube.com/watch?v=${encodeURIComponent(parts[1])}`;
        if (parts[0] === 'v' && parts[1]) return `https://www.youtube.com/watch?v=${encodeURIComponent(parts[1])}`;
      }
      return `https://${hostname}${u.pathname}${u.search}`;
    }
    return null;
  } catch (e) {
    return null;
  }
}

openBtn.addEventListener('click', () => {
  msg.textContent = '';
  const normalized = normalizeYouTubeUrl(urlInput.value);
  if (!normalized) {
    showMessage('有効な YouTube URL を入力してください。例: https://youtu.be/XXXX または https://www.youtube.com/watch?v=XXXX');
    return;
  }

  const targetNew = openNewCheckbox.checked;
  const useNoreferrer = noreferrerCheckbox.checked;
  const useProxy = useProxyCheckbox.checked;

  // 中継を使う場合は /r?u=<encoded> を叩く（サーバー側で検証済みであること前提）
  if (useProxy) {
    const proxied = `/r?u=${encodeURIComponent(normalized)}`;
    if (targetNew) {
      const a = document.createElement('a');
      a.href = proxied;
      a.target = '_blank';
      if (useNoreferrer) a.rel = 'noreferrer noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      window.location.href = proxied;
    }
    return;
  }

  if (targetNew) {
    const a = document.createElement('a');
    a.href = normalized;
    a.target = '_blank';
    if (useNoreferrer) a.rel = 'noreferrer noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    window.location.href = normalized;
  }
});

normalizeBtn.addEventListener('click', () => {
  const normalized = normalizeYouTubeUrl(urlInput.value);
  if (!normalized) {
    showMessage('実行できませんでした。YouTube の URL を確認してください。');
  } else {
    showMessage('実行URL: ' + normalized, false);
  }
});
