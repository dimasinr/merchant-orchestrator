(function() {
  const GATEWAY_URL = window.location.origin;

  const QrisPay = {
    // Stores merchant script parameters from attributes
    merchantId: 'mer-001',
    env: 'sandbox',

    init: function() {
      // Find script tag to extract parameters
      const scripts = document.getElementsByTagName('script');
      for (let i = 0; i < scripts.length; i++) {
        const s = scripts[i];
        if (s.src && s.src.includes('/qris.js')) {
          this.merchantId = s.getAttribute('data-merchant-id') || 'mer-001';
          this.env = s.getAttribute('data-env') || 'sandbox';
          break;
        }
      }
    },

    createPayment: function(config) {
      return new Promise((resolve, reject) => {
        fetch(`${GATEWAY_URL}/api/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: config.amount,
            referenceId: config.referenceId,
            customerName: config.customerName || 'SDK Customer',
            customerEmail: config.customerEmail || 'sdk@customer.io',
            merchantId: this.merchantId
          })
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to create payment session from orchestrator gateway');
          }
          return response.json();
        })
        .then(data => {
          // Resolve with payment object where qrCodeData points to transaction ID
          resolve({
            id: data.id,
            qrCodeData: data.id, // For compatibility with user integration script
            amount: data.amount,
            referenceId: data.referenceId
          });
        })
        .catch(err => {
          console.error('[QrisPay SDK] payment initialization failed', err);
          reject(err);
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
        flex-direction: col;
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
    }
  };

  // Auto init
  QrisPay.init();
  window.QrisPay = QrisPay;
})();
