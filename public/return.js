var bot = new URLSearchParams(location.search).get('bot');
if (bot && /^[A-Za-z0-9_]{3,64}$/.test(bot)) document.getElementById('go').href = 'https://t.me/' + bot;
