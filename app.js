(() => {
  const cfg = window.MONKEY_CONFIG;
  const $ = (id) => document.getElementById(id);
  const escapeHTML = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  $("about").textContent = cfg.about;
  $("discordLink").href = `https://discord.com/users/${cfg.discordId}`;
  $("connections").innerHTML = cfg.connections.map(c => `<a href="${escapeHTML(c.url)}" target="_blank" rel="noreferrer"><span class="con-icon ${escapeHTML(c.kind)}">${escapeHTML(c.icon)}</span><span><b>${escapeHTML(c.label)}</b><small>${escapeHTML(c.detail)}</small></span><i>↗</i></a>`).join("");

  $("enter").addEventListener("click", enter);
  $("entry").addEventListener("click", e => { if (e.target === $("entry")) enter(); });
  function enter() {
    $("entry").classList.add("gone");
    $("app").classList.remove("hidden");
  }

  const card = $("card"), scene = $("scene");
  scene.addEventListener("mousemove", e => {
    if (matchMedia("(pointer:coarse)").matches) return;
    const r = card.getBoundingClientRect(), x = (e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
    card.style.transform = `rotateY(${x*11}deg) rotateX(${-y*9}deg) translateZ(8px)`;
  });
  scene.addEventListener("mouseleave", () => card.style.transform = "rotateY(0) rotateX(0) translateZ(0)");

  document.querySelectorAll(".look").forEach(button => button.addEventListener("click", () => {
    const theme = button.dataset.theme;
    document.body.classList.remove("theme-framed","theme-risky");
    if (theme !== "default") document.body.classList.add(`theme-${theme}`);
    document.querySelectorAll(".look").forEach(b => {
      b.classList.toggle("active", b === button);
      b.querySelector("em").textContent = b === button ? "ACTIVE" : "SELECT";
    });
    document.querySelector(".look-count").textContent = `3 THEMES / 0${[...document.querySelectorAll(".look")].indexOf(button)+1} ACTIVE`;
  }));

  function statusName(status) { return ["online","idle","dnd","offline"].includes(status) ? status : "offline"; }
  function applyPresence(data) {
    if (!data) return;
    const user = data.discord_user || {};
    if (user.global_name || user.username) $("displayName").textContent = user.global_name || user.username;
    if (user.username) $("username").innerHTML = `@${escapeHTML(user.username)} <span>✦</span>`;
    if (user.avatar && user.id) {
      const ext = user.avatar.startsWith("a_") ? "gif" : "png";
      $("avatar").src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
    }
    if (user.banner && user.id) {
      const ext = user.banner.startsWith("a_") ? "gif" : "png";
      $("discordBanner").src = `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${ext}?size=1024`;
      $("discordBanner").classList.remove("hidden");
      $("banner").classList.add("hidden");
    } else if (user.banner_color) {
      $("banner").style.background = `linear-gradient(115deg,${user.banner_color},#101820)`;
    }
    const status = statusName(data.discord_status);
    $("statusDot").className = `status-dot ${status}`;
    $("navDot").className = status;
    $("navStatus").textContent = `${status.toUpperCase()}`;
    setText("connectionState", status.toUpperCase());
    const activities = data.activities || [];
    const game = activities.find(a => a.type !== 4 && a.name);
    if (game) {
      $("activityName").textContent = game.name;
      $("activityDetail").textContent = game.details || game.state || "Currently active";
      $("activityState").textContent = game.assets?.large_text || "What i am currently doing...";
      $("activityArt").textContent = (game.name || "M").slice(0,1).toUpperCase();
    } else {
      $("activityName").textContent = status === "offline" ? "Currently offline" : "Available on Discord";
      $("activityDetail").textContent = status === "offline" ? "No active presence" : "No game activity detected";
      $("activityState").textContent = "Hop off";
      $("activityArt").textContent = "M";
    }
    const spotify = data.spotify;
    if (spotify) {
      $("spotify").classList.remove("hidden");
      $("spotifySong").textContent = spotify.song || "Listening";
      $("spotifyArtist").textContent = spotify.artist || "Spotify";
      if (spotify.album_art_url) $("spotifyArt").src = spotify.album_art_url;
    } else $("spotify").classList.add("hidden");

    const flag = Number(user.public_flags || 0), badgeData = [];
    if (flag & 1) badgeData.push(["✦","Discord Staff"]);
    if (flag & 2) badgeData.push(["◇","Partner"]);
    if (flag & 4) badgeData.push(["⌁","HypeSquad Events"]);
    if (flag & 8) badgeData.push(["◈","Bug Hunter"]);
    if (flag & 64) badgeData.push(["◆","Bravery"]);
    if (flag & 128) badgeData.push(["◆","Brilliance"]);
    if (flag & 256) badgeData.push(["◆","Balance"]);
    if (flag & 512) badgeData.push(["⌘","Early Supporter"]);
    if (flag & 16384) badgeData.push(["✧","Verified Bot Developer"]);
    if (badgeData.length) $("badges").innerHTML = badgeData.slice(0,5).map(([icon,title])=>`<span title="${title}">${icon}</span>`).join("");
  }
const setText = (id, value) => {
    const element = $(id);
    if (element) element.textContent = value;
}
  let socket, retry;
  function connect() {
    socket = new WebSocket("wss://api.lanyard.rest/socket");
    socket.addEventListener("message", event => {
      let packet;
      try { packet = JSON.parse(event.data); } catch { return; }
      if (packet.op === 1) socket.send(JSON.stringify({op:2,d:{subscribe_to_id:cfg.discordId}}));
      if (packet.op === 0 && (packet.t === "INIT_STATE" || packet.t === "PRESENCE_UPDATE")) applyPresence(packet.d);
    });
    socket.addEventListener("close", () => { $("connectionState").textContent="LANYARD / RECONNECTING"; clearTimeout(retry); retry=setTimeout(connect,5000); });
    socket.addEventListener("error", () => socket.close());
  }
  connect();
})();
