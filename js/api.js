// Change this URL after deploying your Google Apps Script Web App
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbykCIrS-zJwkz14i5jD01jJDF9UO14j73dYZXOqoZNO4B0GV1vEQHOaRzbVvZYMpfw/exec';

/**
 * Submits the worksheet payload to Google Apps Script backend
 * @param {Object} payload 
 * @returns {Promise<Object>}
 */
async function sendWorksheetToGoogleSheets(payload) {
    if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
        // Development fallback mock response
        console.warn('API URL not configured. Simulating response.');
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return { status: 'success' };
    }

    const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Bypasses CORS restriction for simple Google Apps Script triggers
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
    });

    return { status: 'success' };
}