(function() {
  const GATEWAY_URL = window.location.origin;

  const QrisPay = {
    // Stores merchant script parameters from attributes
    merchantId: 'mer-001',
    env: 'sandbox',

    // Local dummy transaction store for simulation when API is unavailable
    _dummyTransactions: {},

    init: function() {
      // Find script tag to extract parameters
      const scripts = document.getElementsByTagName('script');
      let targetScript = null;
      for (let i = 0; i < scripts.length; i++) {
        const s = scripts[i];
        if (s.src && (s.src.includes('/qris.js') || s.src.includes('/c-qris.js'))) {
          this.merchantId = s.getAttribute('data-merchant-id') || 'mer-001';
          this.env = s.getAttribute('data-env') || 'sandbox';
          targetScript = s;
          break;
        }
      }

      // Automatically render the payment widget where the script is located
      // unless data-auto-render="false" is explicitly set.
      if (targetScript && targetScript.getAttribute('data-auto-render') !== 'false') {
        this.renderWidget(targetScript);
      }
    },

    // Generate a unique transaction ID for dummy mode
    _generateId: function() {
      return 'tx-' + Math.floor(Math.random() * 90000 + 10000);
    },

    // Generate a realistic QRIS-style reference ID
    _generateQrisRef: function(amount) {
      var ts = Date.now().toString(36).toUpperCase();
      var rand = Math.random().toString(36).substring(2, 10).toUpperCase();
      return 'QRIS-' + this.merchantId.toUpperCase() + '-' + ts + rand + '-AMT' + (amount || 0);
    },

    // Create a dummy transaction object for simulation
    _createDummyTransaction: function(config) {
      var txId = this._generateId();
      var refId = config.referenceId || this._generateQrisRef(config.amount);
      var nowStr = new Date().toISOString();

      var dummyTx = {
        id: txId,
        referenceId: refId,
        amount: Number(config.amount) || 10000,
        currency: 'IDR',
        status: 'AWAITING_PAYMENT',
        merchantId: this.merchantId,
        merchantName: config.merchantName || 'Demo Merchant (Dummy SDK)',
        paymentMethod: 'QRIS',
        customerName: config.customerName || 'SDK Customer',
        customerEmail: config.customerEmail || 'sdk@customer.io',
        createdAt: nowStr,
        updatedAt: nowStr,
        errorMessage: null,
        retryCount: 0,
        maxRetries: 3,
        history: [{ status: 'AWAITING_PAYMENT', timestamp: nowStr, message: 'Dummy transaction created via SDK fallback' }],
        logs: [{ timestamp: nowStr, severity: 'info', message: 'Transaction created in dummy mode (no API)', component: 'QRIS_SDK', traceId: 'tr-' + txId.substring(3) }]
      };

      // Store locally so we can retrieve it later
      this._dummyTransactions[txId] = dummyTx;
      console.info('[QrisPay SDK] Dummy transaction created:', txId, '| Amount:', dummyTx.amount, '| Ref:', refId);
      return dummyTx;
    },

    createPayment: function(config) {
      var self = this;
      return new Promise(function(resolve, reject) {
        fetch(GATEWAY_URL + '/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: config.amount,
            referenceId: config.referenceId,
            customerName: config.customerName || 'SDK Customer',
            customerEmail: config.customerEmail || 'sdk@customer.io',
            merchantId: self.merchantId
          })
        })
        .then(function(response) {
          if (!response.ok) {
            throw new Error('Failed to create payment session from orchestrator gateway');
          }
          return response.json();
        })
        .then(function(data) {
          // Resolve with payment object where qrCodeData points to transaction ID
          resolve({
            id: data.id,
            qrCodeData: data.id, // For compatibility with user integration script
            amount: data.amount,
            referenceId: data.referenceId
          });
        })
        .catch(function(err) {
          console.warn('[QrisPay SDK] API unavailable, falling back to dummy transaction mode.', err.message);
          // Fallback: generate a dummy transaction locally for simulation
          var dummy = self._createDummyTransaction(config);
          resolve({
            id: dummy.id,
            qrCodeData: dummy.id,
            amount: dummy.amount,
            referenceId: dummy.referenceId,
            _isDummy: true // flag so integrators can detect dummy mode
          });
        });
      });
    },

    showPaymentUI: function(txId) {
      if (!txId) {
        console.error('[QrisPay SDK] showPaymentUI requires a valid transaction ID');
        return;
      }

      // Check if modal already exists
      if (document.getElementById('qris-payment-modal-root')) {
        return;
      }

      // 1. Create Modal Backdrop Container
      const rootDiv = document.createElement('div');
      rootDiv.id = 'qris-payment-modal-root';
      rootDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(9, 9, 11, 0.65);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        opacity: 0;
        transition: opacity 0.25s ease;
      `;

      // 2. Create Modal Window
      const modalWindow = document.createElement('div');
      modalWindow.style.cssText = `
        width: 100%;
        max-width: 390px;
        height: 550px;
        background-color: #09090b;
        border-radius: 20px;
        border: 1px solid #27272a;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: translateY(20px);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      `;

      // 3. Create Modal Contents Flexbox
      const flexContainer = document.createElement('div');
      flexContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
      `;

      // 4. Create Top Nav Header
      const header = document.createElement('div');
      header.style.cssText = `
        height: 40px;
        background-color: #18181b;
        border-bottom: 1px solid #27272a;
        padding: 0 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: #a1a1aa;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      `;

      const titleSpan = document.createElement('span');
      titleSpan.innerText = 'Secure QRIS Payment';

      const closeButton = document.createElement('button');
      closeButton.innerHTML = '&#x2715;'; // Close X
      closeButton.style.cssText = `
        background: transparent;
        border: none;
        color: #a1a1aa;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        padding: 4px 8px;
        line-height: 1;
        transition: color 0.15s ease;
      `;
      closeButton.onmouseover = () => closeButton.style.color = '#ffffff';
      closeButton.onmouseout = () => closeButton.style.color = '#a1a1aa';
      closeButton.onclick = () => this.closePaymentUI();

      header.appendChild(titleSpan);
      header.appendChild(closeButton);

      // 5. Create Iframe Wrapper
      const iframe = document.createElement('iframe');
      iframe.src = `${GATEWAY_URL}/pay/${txId}`;
      iframe.style.cssText = `
        flex: 1;
        width: 100%;
        height: 100%;
        border: none;
        background-color: #09090b;
      `;
      iframe.allow = 'payment';

      // Assemble Modal
      flexContainer.appendChild(header);
      flexContainer.appendChild(iframe);
      modalWindow.appendChild(flexContainer);
      rootDiv.appendChild(modalWindow);
      document.body.appendChild(rootDiv);

      // Trigger animation frame
      requestAnimationFrame(() => {
        rootDiv.style.opacity = '1';
        modalWindow.style.transform = 'translateY(0)';
      });

      // 6. Listen for success events inside the iframe
      const messageListener = (event) => {
        if (event.origin !== GATEWAY_URL) return;

        if (event.data && event.data.type === 'QRIS_PAYMENT_SUCCESS') {
          console.log('[QrisPay SDK] Payment successful callback received!');
          // Delay closing the modal slightly so the user sees the completed checkmark
          setTimeout(() => {
            this.closePaymentUI();
          }, 1500);
        }
      };

      // Store listener reference so we can cleanly unsubscribe
      this._listener = messageListener;
      window.addEventListener('message', messageListener);
    },

    closePaymentUI: function() {
      const rootDiv = document.getElementById('qris-payment-modal-root');
      if (!rootDiv) return;

      // Clean up event listener
      if (this._listener) {
        window.removeEventListener('message', this._listener);
        this._listener = null;
      }

      rootDiv.style.opacity = '0';
      if (rootDiv.firstChild) {
        rootDiv.firstChild.style.transform = 'translateY(20px)';
      }

      setTimeout(() => {
        if (rootDiv.parentNode) {
          rootDiv.parentNode.removeChild(rootDiv);
        }
      }, 250);
    },

    renderWidget: function(targetScript) {
      if (!targetScript) return;

      // Create a container div — uses inherit to adapt to host site theme
      const container = document.createElement('div');
      container.id = 'qris-payment-widget-container';
      container.style.cssText = `
        width: 100%;
        max-width: 400px;
        background-color: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 20px;
        font-family: inherit;
        color: #111827;
        margin: 16px auto;
        box-sizing: border-box;
        box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      `;

      // Insert container after script tag
      targetScript.parentNode.insertBefore(container, targetScript.nextSibling);

      // Render the form — simple, clean, theme-adaptive
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Header -->
          <div style="display: flex; align-items: center; gap: 10px; margin-top: 20px;">
            <span style="font-size: 14px; font-weight: 700;">QRIS Payment</span>
          </div>

          <!-- Error Alert (Hidden by default) -->
          <div id="qris-widget-error" style="display: none; border: 1px solid #ef4444; border-radius: 8px; padding: 8px 12px; font-size: 12px; color: #ef4444; font-weight: 600; align-items: center; gap: 6px;">
            <span id="qris-widget-error-text"></span>
          </div>

          <!-- Name -->
          <div style="display: flex; gap: 4px;">
            <input type="text" id="qris-widget-name" required placeholder="username" style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #d1d5db; background: #f9fafb; color: #111827; font-size: 14px; font-family: inherit; box-sizing: border-box; outline: none;" />
          </div>

          <!-- Amount -->
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="position: relative;">
              <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 14px; font-weight: 600; opacity: 0.5;">Rp</span>
              <input type="text" id="qris-widget-amount" required placeholder="150.000" style="width: 100%; padding: 10px 12px 10px 36px; border-radius: 8px; border: 1px solid #d1d5db; background: #f9fafb; color: #111827; font-size: 14px; font-weight: 600; font-family: inherit; box-sizing: border-box; outline: none;" />
            </div>
            <label style="font-size: 10px; font-weight: 600; opacity: 0.6; text-align: left;">Nominal (Rp 20.000 – 9.999.999)</label>
          </div>

          <!-- Preset amounts -->
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            <button type="button" class="qris-preset-btn" data-val="50000" style="padding: 5px 10px; border-radius: 6px; border: 1px solid #d1d5db; background: #f3f4f6; color: #374151; font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit;">50rb</button>
            <button type="button" class="qris-preset-btn" data-val="100000" style="padding: 5px 10px; border-radius: 6px; border: 1px solid #d1d5db; background: #f3f4f6; color: #374151; font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit;">100rb</button>
            <button type="button" class="qris-preset-btn" data-val="250000" style="padding: 5px 10px; border-radius: 6px; border: 1px solid #d1d5db; background: #f3f4f6; color: #374151; font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit;">250rb</button>
            <button type="button" class="qris-preset-btn" data-val="500000" style="padding: 5px 10px; border-radius: 6px; border: 1px solid #d1d5db; background: #f3f4f6; color: #374151; font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit;">500rb</button>
            <button type="button" class="qris-preset-btn" data-val="1000000" style="padding: 5px 10px; border-radius: 6px; border: 1px solid #d1d5db; background: #f3f4f6; color: #374151; font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit;">1jt</button>
          </div>

          <!-- Generate Button -->
          <button type="button" id="qris-widget-submit" style="width: 100%; padding: 12px; border-radius: 8px; border: none; background-color: #4f46e5; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: inherit; transition: opacity 0.2s;">
            Generate QRIS
          </button>

          <!-- Footer -->
          <div style="text-align: center; font-size: 10px; opacity: 0.35; font-weight: 600;">Secured by Cashin Orchestrator</div>
        </div>
      `;

      // Get elements
      const nameInput = document.getElementById('qris-widget-name');
      const amountInput = document.getElementById('qris-widget-amount');
      const submitBtn = document.getElementById('qris-widget-submit');
      const errorBanner = document.getElementById('qris-widget-error');
      const errorText = document.getElementById('qris-widget-error-text');

      // Amount Input Formatting as Rupiah
      amountInput.oninput = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value) {
          e.target.value = new Intl.NumberFormat('id-ID').format(value);
        } else {
          e.target.value = '';
        }
      };

      const presetBtns = container.querySelectorAll('.qris-preset-btn');
      presetBtns.forEach(btn => {
        btn.onclick = () => {
          const val = btn.getAttribute('data-val');
          amountInput.value = new Intl.NumberFormat('id-ID').format(val);
          presetBtns.forEach(b => { b.style.background = '#f3f4f6'; b.style.borderColor = '#d1d5db'; b.style.color = '#374151'; });
          btn.style.background = '#ede9fe';
          btn.style.borderColor = '#4f46e5';
          btn.style.color = '#4f46e5';
        };
      });

      // Submit handler
      submitBtn.onclick = () => {
        const nameVal = nameInput.value.trim();
        const rawAmount = amountInput.value.replace(/\D/g, '');
        const amountVal = Number(rawAmount);

        errorBanner.style.display = 'none';

        if (!nameVal) { showError('Nama wajib diisi'); return; }
        if (!amountVal) { showError('Nominal wajib diisi'); return; }
        if (amountVal < 20000 || amountVal > 9999999) { showError('Nominal harus antara Rp 20.000 - Rp 9.999.999'); return; }

        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.textContent = 'Memproses...';

        this.createPayment({
          amount: amountVal,
          referenceId: 'REF-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000),
          customerName: nameVal,
          customerEmail: 'customer@qris.pay'
        })
        .then(payment => {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
          submitBtn.textContent = 'Generate QRIS';
          this.showPaymentUI(payment.qrCodeData);
        })
        .catch(err => {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
          submitBtn.textContent = 'Generate QRIS';
          showError('Gagal membuat pembayaran: ' + err.message);
        });
      };

      function showError(msg) {
        errorBanner.style.display = 'flex';
        errorText.innerText = msg;
      }

      // Keyframes for loading animation
      if (!document.getElementById('qris-widget-keyframes')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'qris-widget-keyframes';
        styleEl.innerHTML = `
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .qris-preset-btn:hover { background: #ede9fe !important; border-color: #4f46e5 !important; color: #4f46e5 !important; }
          #qris-widget-submit:hover { opacity: 0.85; }
        `;
        document.head.appendChild(styleEl);
      }
    }
  };

  // Auto init
  QrisPay.init();
  window.QrisPay = QrisPay;
})();
