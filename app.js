(() => {
  "use strict";
  const cfg = window.MONKEY_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, c =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const discordId = String(cfg.discordId || "").trim();

  setText("about", cfg.about || "");
  setText("displayName", cfg.displayName || "Monkey");
  const discordLink = $("discordLink");
  if (discordLink) discordLink.href = discordId ? `https://discord.com/users/${encodeURIComponent(discordId)}` : "https://discord.com";
  const connections = $("connections");
  if (connections) {
    connections.innerHTML = (Array.isArray(cfg.connections) ? cfg.connections : []).map(c =>
      `<a href="${escapeHTML(c.url)}" target="_blank" rel="noopener noreferrer"><span class="con-icon ${escapeHTML(c.kind)}">${escapeHTML(c.icon)}</span><span><b>${escapeHTML(c.label)}</b><small>${escapeHTML(c.detail)}</small></span><i>↗</i></a>`
    ).join("");
  }

  function enter() {
    $("entry")?.classList.add("gone");
    $("app")?.classList.remove("hidden");
  }
  $("enter")?.addEventListener("click", enter);
  $("entry")?.addEventListener("click", (event) => {
    if (event.target === $("entry")) enter();
  });

  const card = $("card"), scene = $("scene");
  if (card && scene) {
    scene.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch" || matchMedia("(pointer:coarse)").matches) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      card.style.transform = `rotateY(${x * 9}deg) rotateX(${-y * 7}deg) translateZ(6px)`;
    });
    scene.addEventListener("pointerleave", () => {
      card.style.transform = "rotateY(0deg) rotateX(0deg) translateZ(0)";
    });
  }

  document.querySelectorAll(".look").forEach((button) => {
    button.addEventListener("click", () => {
      document.body.classList.remove("theme-framed", "theme-risky");
      const theme = button.dataset.theme;
      if (theme && theme !== "default") document.body.classList.add(`theme-${theme}`);
      document.querySelectorAll(".look").forEach((item) => {
        item.classList.toggle("active", item === button);
        const label = item.querySelector("em");
        if (label) label.textContent = item === button ? "ACTIVE" : "SELECT";
      });
      const count = document.querySelector(".look-count");
      if (count) count.textContent = `3 THEMES / 0${[...document.querySelectorAll(".look")].indexOf(button) + 1} ACTIVE`;
    });
  });

  const statusName = (status) => ["online", "idle", "dnd", "offline"].includes(status) ? status : "offline";
  function applyPresence(data) {
    if (!data) return;
    const user = data.discord_user || {};
    if (user.global_name || user.username) setText("displayName", user.global_name || user.username);
    if (user.username) setText("username", `@${user.username} ✦`);
    if (user.avatar && user.id && $("avatar")) {
      const ext = user.avatar.startsWith("a_") ? "gif" : "png";
      $("avatar").src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
    }
    if (user.banner && user.id && $("discordBanner")) {
      const ext = user.banner.startsWith("a_") ? "gif" : "png";
      $("discordBanner").src = `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${ext}?size=1024`;
      $("discordBanner").classList.remove("hidden");
      $("banner")?.classList.add("hidden");
    } else if (user.banner_color && $("banner")) {
      $("banner").style.background = `linear-gradient(115deg,${user.banner_color},#101820)`;
    }

    const status = statusName(data.discord_status);
    if ($("statusDot")) $("statusDot").className = `status-dot ${status}`;
    if ($("navDot")) $("navDot").className = status;
    setText("navStatus", status.toUpperCase());
    setText("connectionState", "LANYARD / CONNECTED");

    const activities = Array.isArray(data.activities) ? data.activities : [];
    const game = activities.find((activity) => activity.type !== 4 && activity.name);
    if (game) {
      setText("activityName", game.name);
      setText("activityDetail", game.details || game.state || "Currently active");
      setText("activityState", game.assets?.large_text || "What I'm currently doing");
      setText("activityArt", (game.name || "M").slice(0, 1).toUpperCase());
    } else {
      setText("activityName", "");
      setText("activityDetail", "");
      setText("activityState", "");
      setText("activityArt", "M");
    }

    const spotify = data.spotify;
    if (spotify && $("spotify")) {
      $("spotify").classList.remove("hidden");
      setText("spotifySong", spotify.song || "Listening");
      setText("spotifyArtist", spotify.artist || "Spotify");
      if (spotify.album_art_url && $("spotifyArt")) $("spotifyArt").src = spotify.album_art_url;
    } else $("spotify")?.classList.add("hidden");

    const flags = Number(user.public_flags || 0), badges = [];
    if (flags & 1) badges.push(["✦", "Discord Staff"]);
    if (flags & 2) badges.push(["◇", "Partner"]);
    if (flags & 4) badges.push(["⌁", "HypeSquad Events"]);
    if (flags & 8) badges.push(["◈", "Bug Hunter"]);
    if (flags & 64) badges.push(["◆", "Bravery"]);
    if (flags & 128) badges.push(["◆", "Brilliance"]);
    if (flags & 256) badges.push(["◆", "Balance"]);
    if (flags & 512) badges.push(["⌘", "Early Supporter"]);
    if (flags & 16384) badges.push(["✧", "Verified Bot Developer"]);
    if (badges.length && $("badges")) {
      $("badges").innerHTML = badges.slice(0, 5).map(([icon, title]) =>
        `<span title="${escapeHTML(title)}">${icon}</span>`).join("");
    }
  }

  let socket = null, retryTimer = null, stopped = false;
  function connect() {
    if (!discordId || stopped) {
      setText("connectionState", "LANYARD / NOT CONFIGURED");
      return;
    }
    try {
      socket = new WebSocket("wss://api.lanyard.rest/socket");
      socket.addEventListener("open", () => setText("connectionState", "LANYARD / CONNECTING"));
      socket.addEventListener("message", (event) => {
        let packet;
        try { packet = JSON.parse(event.data); } catch { return; }
        if (packet.op === 1 && socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: discordId } }));
        }
        if (packet.op === 0 && (packet.t === "INIT_STATE" || packet.t === "PRESENCE_UPDATE")) applyPresence(packet.d);
      });
      socket.addEventListener("close", () => {
        setText("connectionState", "LANYARD / RECONNECTING");
        setText("navStatus", "RECONNECTING");
        clearTimeout(retryTimer);
        retryTimer = setTimeout(connect, 5000);
      });
      socket.addEventListener("error", () => socket?.close());
    } catch {
      setText("connectionState", "LANYARD / UNAVAILABLE");
      retryTimer = setTimeout(connect, 8000);
    }
  }
  window.addEventListener("beforeunload", () => {
    stopped = true;
    clearTimeout(retryTimer);
    socket?.close();
  });
  connect();
})();
