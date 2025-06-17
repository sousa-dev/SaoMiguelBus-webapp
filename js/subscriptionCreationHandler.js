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
    fetch('https://api.saomiguelbus.com/api/v1/subscriptions/verify/', {
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
            
            // Set premium status in localStorage for immediate activation
            if (typeof setAdRemovalStatus === 'function') {
                setAdRemovalStatus(email, true);
            } else {
                // Fallback if adRemovalHandler is not loaded
                localStorage.setItem('adRemovalState', JSON.stringify({
                    isActive: true,
                    email: email,
                    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    lastChecked: new Date().toISOString()
                }));
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