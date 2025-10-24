// Cloudflare Worker: /r?u=<encodeURIComponent(https://...)>
// - 受け取った u を decodeURIComponent して URL に変換
// - スキームとホストを検証して YouTube 系のみ許可
// - 302 リダイレクトを返す

addEventListener('fetch', event => {
  event.respondWith(handle(event.request));
});

function isAllowedHost(hostname) {
  if (!hostname) return false;
  const host = hostname.toLowerCase();
  return host === 'youtu.be' ||
         host === 'youtube.com' ||
         host.endsWith('.youtube.com') ||
         host === 'youtube-nocookie.com' ||
         host.endsWith('.youtube-nocookie.com');
}

async function handle(request) {
  const url = new URL(request.url);
  if (url.pathname !== '/r') {
    return new Response('Not Found', { status: 404 });
  }

  const u = url.searchParams.get('u');
  if (!u) return new Response('Missing u parameter', { status: 400 });

  let dest;
  try {
    dest = decodeURIComponent(u);
  } catch (e) {
    return new Response('Invalid encoding', { status: 400 });
  }

  try {
    const destUrl = new URL(dest);
    if (!/^https?:$/i.test(destUrl.protocol)) {
      return new Response('Invalid protocol', { status: 400 });
    }
    if (!isAllowedHost(destUrl.hostname)) {
      return new Response('Destination host not allowed', { status: 400 });
    }
    // 302 redirect
    return Response.redirect(destUrl.toString(), 302);
  } catch (e) {
    return new Response('Invalid destination URL', { status: 400 });
  }
}
