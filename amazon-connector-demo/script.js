// script.js

// --- Global Variables (for demonstration only) ---
// In a REAL application, these would be securely stored on your backend
// and never exposed in frontend code.
const AMAZON_LWA_CLIENT_ID = 'amzn1.application-oa2-client.amzn1.application-oa2-client.d6f55e61873b4b7aba9f22bd8b2bd731'; // TODO: Replace with your actual Amazon LWA Client ID
const YOUR_APP_REDIRECT_URI = 'http://localhost:8080/amazon-callback.html'; // TODO: Replace with your actual backend's redirect_uri (or a temporary local one for pure frontend testing if Amazon allows, but unlikely for real data)
const AMAZON_AUTH_URL = 'https://sellercentral.amazon.in/apps/authorize/consent'; // Base URL for IN marketplace

// --- DOM Elements ---
const connectButton = document.getElementById('connect-button');
const statusMessage = document.getElementById('status-message');
const shopDetailsContainer = document.getElementById('shop-details-container');
const shopNameElem = document.getElementById('shop-name');
const sellerIdElem = document.getElementById('seller-id');
const marketplacesElem = document.getElementById('marketplaces');
const connectionDateElem = document.getElementById('connection-date');

// --- Helper Functions ---

// Function to simulate a backend call
async function simulateBackendCall(action, payload = {}) {
    console.log(`[SIMULATED BACKEND] Performing action: ${action} with payload:`, payload);

    return new Promise(resolve => {
        setTimeout(() => { // Simulate network delay
            if (action === 'exchange_code_and_fetch_details') {
                // In a REAL backend, this would:
                // 1. Use the 'code' to make a secure POST request to Amazon's LWA token endpoint
                //    (e.g., https://api.amazon.com/auth/o2/token) using client_id and client_secret.
                // 2. Receive access_token and refresh_token.
                // 3. Use access_token to call Amazon SP-API endpoints (e.g., /sellingpartnerapi/marketplaceparticipations/v1/participations)
                //    to get real shop data.
                // 4. Securely store the refresh_token in your database associated with the user.
                // 5. Return the relevant shop details to the frontend.

                // For this DEMO, we return dummy data.
                const dummyShopDetails = {
                    shopName: 'Opsell Demo Store',
                    sellerId: 'A1B2C3D4E5F6G7',
                    marketplaces: ['Amazon.in', 'Amazon.com'],
                    connectionDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                };
                resolve({ success: true, data: dummyShopDetails });
            } else {
                resolve({ success: false, message: 'unknown action' });
            }
        }, 1500); // 1.5 second delay
    });
}

// Function to update UI with connected shop details
function displayShopDetails(details) {
    statusMessage.textContent = 'your amazon shop has been successfully connected!';
    statusMessage.style.color = 'var(--color-opsell-black)'; // Set color for connected status

    connectButton.textContent = 'Shop Connected';
    connectButton.disabled = true;

    shopNameElem.textContent = details.shopName;
    sellerIdElem.textContent = details.sellerId;
    marketplacesElem.textContent = details.marketplaces.join(', ');
    connectionDateElem.textContent = details.connectionDate;

    shopDetailsContainer.classList.remove('hidden');
}

// Function to check connection status on page load
async function checkConnectionStatus() {
    const connectedShop = sessionStorage.getItem('opsell_amazon_shop');
    if (connectedShop) {
        displayShopDetails(JSON.parse(connectedShop));
    } else {
        // Handle Amazon's redirect callback
        const urlParams = new URLSearchParams(window.location.search);
        const authorizationCode = urlParams.get('selling_partner_id'); // Amazon often uses 'selling_partner_id' or 'code' for the auth code
        const state = urlParams.get('state'); // State parameter for security (CSRF protection)

        if (authorizationCode) {
            console.log(`[FRONTEND] Received authorization code: ${authorizationCode}`);
            console.log(`[FRONTEND] Received state: ${state}`);

            statusMessage.textContent = 'connecting your shop... please wait.';
            connectButton.disabled = true;

            // --- SIMULATE BACKEND INTERACTION ---
            const backendResponse = await simulateBackendCall('exchange_code_and_fetch_details', {
                code: authorizationCode,
                state: state,
                // In REAL scenario, redirect_uri used here must match what was sent initially
                redirect_uri: YOUR_APP_REDIRECT_URI
            });

            if (backendResponse.success) {
                sessionStorage.setItem('opsell_amazon_shop', JSON.stringify(backendResponse.data));
                displayShopDetails(backendResponse.data);
                // Clean URL after successful connection
                history.replaceState({}, document.title, window.location.pathname);
            } else {
                statusMessage.textContent = `connection failed: ${backendResponse.message}`;
                statusMessage.style.color = '#dc2626'; // Tailwind red-600
                connectButton.disabled = false;
            }
        }
    }
}

// --- Event Listener for Connect Button ---
connectButton.addEventListener('click', () => {
    // In a REAL application, this state parameter should be unique per request
    // and securely validated on the backend to prevent CSRF attacks.
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('opsell_amazon_auth_state', state); // Store state to verify on callback

    // Construct the Amazon authorization URL
    // TODO: Ensure this matches the exact marketplace you are targeting (.in, .com, etc.)
    const authUrl = `${AMAZON_AUTH_URL}?` +
                    `client_id=${AMAZON_LWA_CLIENT_ID}&` +
                    `redirect_uri=${encodeURIComponent(YOUR_APP_REDIRECT_URI)}&` +
                    `response_type=code&` +
                    `state=${state}&` +
                    `scope=sellingpartnerapi::notifications%20sellingpartnerapi::data_kpis%20sellingpartnerapi::listings_items`; // Example scopes, adjust as needed

    console.log(`[FRONTEND] Redirecting to Amazon for authorization: ${authUrl}`);
    window.location.href = authUrl; // Redirect the user
});

// --- Initial Check on Page Load ---
document.addEventListener('DOMContentLoaded', checkConnectionStatus);