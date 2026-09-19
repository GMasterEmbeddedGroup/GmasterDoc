/* CAF 登录态与内容门禁
 *
 * 由 mkdocs.yml 的 extra_javascript 引入，公开站与私有站共用同一份。
 * 两个职责：
 *   1. 在顶栏显示「登录 / 已登录：xxx 退出」；
 *   2. 处理页面里 <div data-caf-gate data-src="..."> 的登录后才显示内容。
 *
 * 注意：这里只是「界面上的开关」。真正的拦截在服务器（/_private/ 由 caf-wiki-gate
 * 校验会话与 CAF 权限节点），所以即使有人改了前端，也拿不到未授权的内容。
 */
(function () {
  "use strict";

  var CAF_BASE = "/_caf/";
  var state = { ready: false, authenticated: false, user: null, nodes: [] };

  function loginUrl(redirect) {
    return CAF_BASE + "login?rd=" + encodeURIComponent(redirect || (location.pathname + location.search));
  }

  function logoutUrl() {
    return CAF_BASE + "logout?rd=" + encodeURIComponent("/");
  }

  function currentRedirect() {
    return location.pathname + location.search;
  }

  function nodeCovers(required) {
    if (!required) { return true; }
    if (state.nodes.indexOf("*") !== -1) { return true; }
    return required.split(",").some(function (raw) {
      var need = raw.trim();
      if (!need) { return true; }
      return state.nodes.some(function (node) {
        return node === need || node.indexOf(need + ".") === 0;
      });
    });
  }

  /* ---------------------------------------------------------------- 顶栏登录态 */

  function buildChip() {
    var chip = document.createElement("div");
    chip.className = "caf-chip";

    if (state.authenticated) {
      var user = state.user || {};
      if (user.avatar) {
        var img = document.createElement("img");
        img.className = "caf-chip__avatar";
        img.src = user.avatar;
        img.alt = "";
        chip.appendChild(img);
      }
      var name = document.createElement("span");
      name.className = "caf-chip__name";
      name.textContent = user.display_name || user.username || "已登录";
      name.title = (user.username || "") + (user.email ? "（" + user.email + "）" : "");
      chip.appendChild(name);

      var out = document.createElement("a");
      out.className = "caf-chip__link";
      out.href = logoutUrl();
      out.textContent = "退出";
      chip.appendChild(out);
    } else {
      var login = document.createElement("a");
      login.className = "caf-chip__link caf-chip__link--login";
      login.href = loginUrl(currentRedirect());
      login.textContent = "登录";
      chip.appendChild(login);
    }
    return chip;
  }

  function mountChip() {
    var header = document.querySelector(".md-header__inner") || document.querySelector(".md-header");
    if (!header) { return; }
    var existing = header.querySelector(".caf-chip");
    if (existing) { existing.parentNode.removeChild(existing); }
    header.appendChild(buildChip());
  }

  /* ---------------------------------------------------------------- 内容门禁 */

  function placeholder(node, hint) {
    var login = loginUrl(currentRedirect());
    node.classList.add("caf-gate");
    node.innerHTML =
      '<p class="caf-gate__hint">' + hint + "</p>" +
      '<p><a class="caf-gate__btn" href="' + login + '">登录后查看</a></p>';
  }

  function forbidden(node, required) {
    node.classList.add("caf-gate");
    node.innerHTML =
      '<p class="caf-gate__hint">这段内容需要权限节点 <code>' + required + "</code>，" +
      "你当前没有该权限。请联系管理组在官网后台授权。</p>";
  }

  function loadGate(node) {
    var src = node.getAttribute("data-src");
    if (!src || node.getAttribute("data-caf-state") === "done") { return; }

    if (!state.authenticated) {
      placeholder(node, "这段内容仅对已登录成员可见。");
      return;
    }

    var required = node.getAttribute("data-caf-require") || "";
    if (required && !nodeCovers(required)) {
      forbidden(node, required);
      return;
    }

    fetch(src, { credentials: "same-origin", headers: { Accept: "text/html" } })
      .then(function (res) {
        if (res.status === 401) { placeholder(node, "登录状态已过期，请重新登录。"); return null; }
        if (res.status === 403) { forbidden(node, required || "（未声明）"); return null; }
        if (!res.ok) { throw new Error("HTTP " + res.status); }
        return res.text();
      })
      .then(function (html) {
        if (html === null) { return; }
        node.innerHTML = html;
        node.setAttribute("data-caf-state", "done");
      })
      .catch(function (err) {
        node.innerHTML = '<p class="caf-gate__hint">内容加载失败：' + err.message + "</p>";
      });
  }

  function mountGates() {
    var nodes = document.querySelectorAll("[data-caf-gate]");
    for (var i = 0; i < nodes.length; i++) { loadGate(nodes[i]); }
  }

  /* ---------------------------------------------------------------- 启动 */

  function refresh() {
    return fetch(CAF_BASE + "me", { credentials: "same-origin", headers: { Accept: "application/json" } })
      .then(function (res) { return res.ok ? res.json() : { authenticated: false }; })
      .catch(function () { return { authenticated: false }; })
      .then(function (data) {
        state.ready = true;
        state.authenticated = !!data.authenticated;
        state.user = data.user || null;
        state.nodes = data.nodes || [];
        mountChip();
        mountGates();
        return state;
      });
  }

  function start() {
    refresh();
    if (window.document$) {
      window.document$.subscribe(function () { mountChip(); mountGates(); });
    }
  }

  // 供其它脚本/控制台使用
  window.cafWiki = { state: state, refresh: refresh, loginUrl: loginUrl, logoutUrl: logoutUrl };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
