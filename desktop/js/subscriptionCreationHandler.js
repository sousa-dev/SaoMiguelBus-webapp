// Hardcoded verification code (64 characters) - must match API
const CREATION_VERIFICATION_CODE = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6";

function clearVerificationError() {
    document.getElementById('verificationError').classList.add('hidden');
    document.getElementById('verificationSuccess').classList.add('hidden');
}

function verifyExistingSubscription() {
    const email = document.getElementById('verificationEmail').value.trim();
    
    if (!email) {
        showVerificationError('Please enter your email address');
        return;
    }
    
    if (!isValidEmail(email)) {
        showVerificationError('Please enter a valid email address');
        return;
    }
    
    // Show loading state
    const button = document.getElementById('verifyButton');
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verifying...';
    button.disabled = true;
    
    // Clear any previous messages
    clearVerificationError();
    
    // Make API call with creation code
    fetch('https://api.saomiguelbus.com/api/v1/subscription/verify/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: email,
            create_subscription: CREATION_VERIFICATION_CODE
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.hasActiveSubscription) {
            // Success - show success message and redirect after delay
            showVerificationSuccess('Subscription verified successfully! Redirecting to app...');
            
            // Follow the EXACT same pattern as adRemovalHandler.js
            
            // 1. Set the global adRemovalState object (in-memory state) - if available
            if (typeof adRemovalState !== 'undefined') {
                adRemovalState.isActive = true;
                adRemovalState.userEmail = email;
                adRemovalState.subscriptionExpiresAt = data.expiresAt;
            }
            
            // 2. ALWAYS set cookies manually to ensure they're set correctly
            // Use the exact same logic as renewPremiumCookies function
            const subscriptionExpiry = new Date(data.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            
            const cookieExpiryDays = subscriptionExpiry < thirtyDaysFromNow ? 
                Math.ceil((subscriptionExpiry - new Date()) / (1000 * 60 * 60 * 24)) : 30;
            
            // Set the premium cookies that the main app looks for
            setCookie('premiumEmail', email, Math.max(1, cookieExpiryDays));
            setCookie('premiumExpiresAt', data.expiresAt || subscriptionExpiry.toISOString(), Math.max(1, cookieExpiryDays));
            setCookie('premiumLastVerified', new Date().toISOString(), Math.max(1, cookieExpiryDays));
            
            // Also try to call renewPremiumCookies if available (but we already set them manually)
            if (typeof renewPremiumCookies === 'function' && data.expiresAt) {
                renewPremiumCookies(email, data.expiresAt);
            }
            
            // 3. Hide all ads immediately
            if (typeof hideAllAds === 'function') {
                hideAllAds();
            }
            
            // 4. Update premium status display
            if (typeof updatePremiumStatusDisplay === 'function') {
                updatePremiumStatusDisplay();
            }
            
            console.log('Premium status activated for:', email);
            console.log('Using expiresAt from API:', data.expiresAt);
            
            // Debug: Check if cookies were set correctly
            console.log('Cookies after setting:');
            console.log('premiumEmail:', getCookie('premiumEmail'));
            console.log('premiumExpiresAt:', getCookie('premiumExpiresAt'));
            console.log('premiumLastVerified:', getCookie('premiumLastVerified'));
            
            // Debug: Check adRemovalState
            if (typeof adRemovalState !== 'undefined') {
                console.log('adRemovalState after setting:', adRemovalState);
            } else {
                console.log('adRemovalState is undefined - this might be the issue');
            }
            
            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = '/index.html?premium=activated';
            }, 2000);
        } else {
            showVerificationError(data.message || 'No active subscription found for this email');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showVerificationError('An error occurred while verifying your subscription. Please try again.');
    })
    .finally(() => {
        // Restore button state
        button.innerHTML = originalText;
        button.disabled = false;
    });
}

function showVerificationError(message) {
    const errorDiv = document.getElementById('verificationError');
    const successDiv = document.getElementById('verificationSuccess');
    
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    successDiv.classList.add('hidden');
}

function showVerificationSuccess(message) {
    const errorDiv = document.getElementById('verificationError');
    const successDiv = document.getElementById('verificationSuccess');
    
    successDiv.textContent = message;
    successDiv.classList.remove('hidden');
    errorDiv.classList.add('hidden');
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Set up language support
    if (typeof updatePageContent === 'function') {
        updatePageContent();
    }
    
    // Clear error on input
    const emailInput = document.getElementById('verificationEmail');
    if (emailInput) {
        emailInput.addEventListener('input', clearVerificationError);
        
        // Allow Enter key to trigger verification
        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verifyExistingSubscription();
            }
        });
    }
    
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const premiumParam = urlParams.get('premium');
    
    if (premiumParam === 'activated') {
        showVerificationSuccess('Premium features have been activated successfully!');
    }
});

// Make functions globally accessible for debugging
window.verifyExistingSubscription = verifyExistingSubscription;
window.clearVerificationError = clearVerificationError; 