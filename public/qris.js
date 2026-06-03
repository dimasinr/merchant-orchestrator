(function (window, document) {
  "use strict";

  var ROOT_ID = "cashin-qris-root";

  var config = {
    clientId: "",
    secretKey: "",
    env: "production",

    min: 20000,
    max: 999999999,

    key: "",
    rnd: "",
    sq: "",
  };

  var member = {
    id: "guest",
    username: "guest",
    token: "",
    full: {},
  };

  var CSS =
    "#cashin-qris-root{" +
    "width:100%;" +
    "margin-bottom:24px;" +
    "font-family:Arial,sans-serif;" +
    "}" +

    "#cashin-qris-root *{" +
    "box-sizing:border-box;" +
    "}" +

    "#cashin-qris-root .cashin-card{" +
    "width:100%;" +
    "background:#ffffff24;" +
    "border-radius:18px;" +
    "padding:20px;" +
    "box-shadow:0 2px 15px rgba(0,0,0,.08);" +
    "overflow:hidden;" +
    "transition:all .3s ease;" +
    "}" +

    "#cashin-qris-root .cashin-title{" +
    "font-size:22px;" +
    "font-weight:700;" +
    "font-color:#fff" +
    "color:#111;" +
    "margin-bottom:18px;" +
    "}" +

    "#cashin-qris-root .cashin-field{" +
    "margin-bottom:16px;" +
    "position:relative;" +
    "z-index:2;" +
    "}" +

    "#cashin-qris-root .cashin-label{" +
    "display:block;" +
    "font-size:13px;" +
    "font-weight:600;" +
    "margin-bottom:8px;" +
    "color:#555;" +
    "}" +

   "#cashin-qris-root .cashin-input{" +
  "width:100%!important;" +
  "height:52px!important;" +
  "padding:0 16px!important;" +
  "border:1px solid #dcdcdc!important;" +
  "border-radius:12px!important;" +
  "font-size:16px!important;" +
  "font-weight:600!important;" +
  "outline:none!important;" +
  "background:#fff!important;" +
  "transition:.2s!important;" +
  "color:#111!important;" +
  "-webkit-text-fill-color:#111!important;" +
  "caret-color:#111!important;" +
  "text-shadow:none!important;" +
  "opacity:1!important;" +
  "pointer-events:auto!important;" +
  "position:relative!important;" +
  "z-index:9999!important;" +
  "}" +

    "#cashin-qris-root .cashin-input:focus{" +
    "border-color:#2563eb!important;" +
    "}" +

  "#cashin-qris-root .cashin-input:disabled{" +
  "background:#f3f4f6!important;" +
  "color:#666!important;" +
  "-webkit-text-fill-color:#666!important;" +
  "cursor:not-allowed!important;" +
  "}" +

    "#cashin-qris-root .cashin-button{" +
    "width:100%;" +
    "height:54px;" +
    "border:none;" +
    "border-radius:12px;" +
    "background:#88643e;" +
    "color:#fff;" +
    "font-size:16px;" +
    "font-weight:700;" +
    "cursor:pointer;" +
    "transition:.2s;" +
    "margin-top:4px;" +
    "}" +

    "#cashin-qris-root .cashin-button:hover{" +
    "opacity:.92;" +
    "}" +

    "#cashin-qris-root .cashin-button:disabled{" +
    "opacity:.5;" +
    "cursor:not-allowed;" +
    "}" +

    "#cashin-qris-root .cashin-msg{" +
    "margin-top:14px;" +
    "font-size:13px;" +
    "font-weight:600;" +
    "}" +

    "#cashin-qris-root .cashin-msg.ok{" +
    "color:#059669;" +
    "}" +

    "#cashin-qris-root .cashin-msg.err{" +
    "color:#dc2626;" +
    "}" +

    "#cashin-qris-target{" +
    "margin-top:20px;" +
    "width:100%;" +
    "display:block;" +
    "overflow:hidden;" +
    "border-radius:14px;" +
    "background:#fff;" +
    "}" +

    "#cashin-qris-target.active{" +
    "min-height:720px;" +
    "}" +

    "#cashin-qris-target iframe{" +
    "width:100%!important;" +
    "height:720px!important;" +
    "min-height:720px!important;" +
    "border:none!important;" +
    "display:block!important;" +
    "background:#fff!important;" +
    "}" +

    "#cashin-qris-target img{" +
    "width:100%!important;" +
    "max-width:100%!important;" +
    "height:auto!important;" +
    "display:block!important;" +
    "object-fit:contain!important;" +
    "}" +

    "@media(max-width:768px){" +

    "#cashin-qris-root .cashin-card{" +
    "padding:16px;" +
    "border-radius:14px;" +
    "}" +

    "#cashin-qris-root .cashin-title{" +
    "font-size:18px;" +
    "}" +

    "#cashin-qris-root .cashin-input{" +
    "height:48px!important;" +
    "font-size:15px!important;" +
    "}" +

    "#cashin-qris-root .cashin-button{" +
    "height:50px;" +
    "font-size:15px;" +
    "}" +

    "#cashin-qris-target.active{" +
    "min-height:620px;" +
    "}" +

    "#cashin-qris-target iframe{" +
    "height:620px!important;" +
    "min-height:620px!important;" +
    "}" +

    "}";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        fn
      );
    } else {
      fn();
    }
  }

  function getLoaderScript() {
    if (document.currentScript) {
      return document.currentScript;
    }

    var scripts =
      document.getElementsByTagName(
        "script"
      );

    for (
      var i = scripts.length - 1;
      i >= 0;
      i--
    ) {
      var src = scripts[i].src || "";

      if (/qris\.js/i.test(src)) {
        return scripts[i];
      }
    }

    return null;
  }

  function getQueryParams() {
    var script = getLoaderScript();

    if (!script || !script.src) {
      return {};
    }

    try {
      var url = new URL(script.src);

      var params = {};

      url.searchParams.forEach(
        function (value, key) {
          params[key] = value;
        }
      );

      return params;
    } catch (e) {
      console.error(e);
      return {};
    }
  }

  function readOptions() {
    var q = getQueryParams();

    config.clientId =
      q.clientid ||
      config.clientId;

    config.secretKey =
      q.key ||
      config.secretKey;

    config.key =
      q.key ||
      config.key;

    config.min =
      Number(q.min) ||
      config.min;

    config.max =
      Number(q.max) ||
      config.max;

    config.env =
      q.env ||
      config.env;

    config.rnd =
      q.rnd ||
      config.rnd;

    config.sq =
      q.sq ||
      config.sq;
  }

  function loadMember() {
    try {
      var persistRaw =
        localStorage.getItem(
          "persist:client"
        );

      if (!persistRaw) {
        return;
      }

      var persist =
        JSON.parse(persistRaw);

      var user = JSON.parse(
        persist.user || "{}"
      );

      var auth = JSON.parse(
        persist.auth || "{}"
      );

      member.id =
        user.member_account_id ||
        user.id ||
        user.username ||
        "guest";

      member.username =
        user.username ||
        user.full_username ||
        "guest";

      member.token =
        auth.token || "";

      member.full = user;

      member.id = String(
        member.id
      ).toLowerCase();
    } catch (e) {
      console.error(e);
    }
  }

  function injectCss() {
    if (
      document.getElementById(
        "cashin-qris-css"
      )
    ) {
      return;
    }

    var style =
      document.createElement("style");

    style.id = "cashin-qris-css";

    style.textContent = CSS;

    document.head.appendChild(style);
  }

  function buildUi(callback) {
    var tries = 0;

    function findForm() {
      var forms =
        document.querySelectorAll(
          "form[novalidate]"
        );

      var targetForm = null;

      for (
        var i = 0;
        i < forms.length;
        i++
      ) {
        var form = forms[i];

        var hasLabel =
          form.querySelector(
            'div div[class*="inputLabel__label"]'
          );

        if (hasLabel) {
          targetForm = form;
          break;
        }
      }

      if (!targetForm) {
        tries++;

        if (tries < 50) {
          setTimeout(findForm, 500);
        }

        return;
      }

      try {
        var old =
          document.getElementById(
            ROOT_ID
          );

        if (old) {
          old.remove();
        }

        var wrapper =
          document.createElement("div");

        var firstDiv =
          targetForm.querySelector("div");

        wrapper.className =
          firstDiv &&
          firstDiv.className
            ? firstDiv.className
            : "";

        var root =
          document.createElement("div");

        root.id = ROOT_ID;

        wrapper.appendChild(root);

        targetForm.insertBefore(
          wrapper,
          targetForm.firstChild
        );

        root.innerHTML =
          '<div class="cashin-card">' +

          '<div class="cashin-title">' +
          "Instant QRIS" +
          "</div>" +

          '<div class="cashin-field">' +
          '<label class="cashin-label">' +
          "Username" +
          "</label>" +
          '<input class="cashin-input" ' +
          'type="text" ' +
          'disabled ' +
          'value="' +
          member.username +
          '">' +
          "</div>" +

          '<div class="cashin-field">' +
          '<label class="cashin-label">' +
          "Nominal Deposit" +
          "</label>" +
          '<input class="cashin-input" ' +
          'type="text" ' +
          'id="cashin-qris-amount" ' +
          'autocomplete="off" ' +
          'inputmode="numeric">' +
          "</div>" +

          '<button class="cashin-button" ' +
          'type="button" ' +
          'id="cashin-qris-btn">' +
          "Buat Sekarang" +
          "</button>" +

          '<div class="cashin-msg" ' +
          'id="cashin-qris-msg"></div>' +

          '<div id="cashin-qris-target"></div>' +

          "</div>";

        callback(root);
      } catch (e) {
        console.error(e);

        setTimeout(findForm, 500);
      }
    }

    findForm();
  }

  function msg(root, text, type) {
    var el =
      root.querySelector(
        "#cashin-qris-msg"
      );

    if (!el) return;

    el.textContent = text;

    el.className =
      "cashin-msg" +
      (type ? " " + type : "");
  }

  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r =
          (Math.random() * 16) | 0;

        var v =
          c === "x"
            ? r
            : (r & 0x3) | 0x8;

        return v.toString(16);
      }
    );
  }

  function formatRupiah(value) {
    value = String(value || "")
      .replace(/[^\d]/g, "");

    if (!value) {
      return "";
    }

    return Number(value)
      .toLocaleString("id-ID");
  }

  async function loadSdk(done, fail) {
    try {
      if (window.__cashinPaySdk) {
        done(window.__cashinPaySdk);
        return;
      }

      const mod = await import(
        "https://unpkg.com/cashin-pay@0.0.7/dist/index.es.mjs"
      );

      const sdk =
        mod.default || mod;

      if (!sdk) {
        throw new Error(
          "SDK kosong"
        );
      }

      window.__cashinPaySdk =
        sdk;

      done(sdk);
    } catch (e) {
      console.error(e);
      fail(e);
    }
  }

  function wire(root, sdk) {
    var btn =
      root.querySelector(
        "#cashin-qris-btn"
      );

    var input =
      root.querySelector(
        "#cashin-qris-amount"
      );

    var target =
      root.querySelector(
        "#cashin-qris-target"
      );

    input.value =
      formatRupiah(config.min);

    input.addEventListener(
      "input",
      function () {
        var raw =
          this.value.replace(
            /[^\d]/g,
            ""
          );

        this.value =
          formatRupiah(raw);
      }
    );

    sdk.init({
      clientId:
        config.clientId,

      secretKey:
        config.secretKey,

      env: config.env,
    });

    btn.onclick = function () {
      var amount = Number(
        input.value.replace(
          /[^\d]/g,
          ""
        )
      );

      if (
        !amount ||
        amount < config.min
      ) {
        msg(
          root,
          "Minimal Rp " +
            config.min.toLocaleString(
              "id-ID"
            ),
          "err"
        );

        return;
      }

      if (
        amount > config.max
      ) {
        msg(
          root,
          "Maksimal Rp " +
            config.max.toLocaleString(
              "id-ID"
            ),
          "err"
        );

        return;
      }

      btn.disabled = true;

      var trx = uuid();

      try {
        target.innerHTML = "";
        target.classList.remove(
          "active"
        );

        sdk.pay({
          type: "embed",

          targetId:
            "cashin-qris-target",

          payload: {
            amount: amount,

            trxNo: trx,

            duration: 900,

            paymentChannel:
              "QRIS",

            memberId:
              member.id,

            username:
              member.username,

            token:
              member.token,

            key:
              config.key,

            rnd:
              config.rnd,

            sq:
              config.sq,
          },
        });

        setTimeout(function () {
          target.classList.add(
            "active"
          );

          var iframe =
            target.querySelector(
              "iframe"
            );

          if (iframe) {
            iframe.style.width =
              "100%";

            iframe.style.height =
              window.innerWidth <= 768
                ? "620px"
                : "720px";
          }

          var img =
            target.querySelector(
              "img"
            );

          if (img) {
            img.style.width =
              "100%";

            img.style.maxWidth =
              "100%";
          }
        }, 1500);

        msg(
          root,
          "QRIS berhasil dibuat",
          "ok"
        );
      } catch (e) {
        console.error(e);

        msg(
          root,
          e.message ||
            "Gagal membuat QRIS",
          "err"
        );
      }

      btn.disabled = false;
    };
  }

  function main() {
    readOptions();

    loadMember();

    injectCss();

    buildUi(function (root) {
      loadSdk(
        function (sdk) {
          wire(root, sdk);
        },

        function (err) {
          console.error(err);

          msg(
            root,
            err.message ||
              "SDK gagal dimuat",
            "err"
          );
        }
      );
    });
  }

  ready(main);
})(window, document);