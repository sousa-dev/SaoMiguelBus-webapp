// Ad removal state management
let adRemovalState = {
    isActive: false,
    userEmail: null,
    subscriptionExpiresAt: null
};

// Pricing options configuration
const pricingOptions = [
    { 
        id: 'weekly', 
        period: 'week', 
        price: '€0.50', 
        value: 'week',
        stripeLink: 'https://buy.stripe.com/5kQ9AS43t1MJ4hv6YpgUM04',
        description: 'Perfect for tourists'
    },
    { 
        id: 'monthly', 
        period: 'month', 
        price: '€1.99', 
        value: 'month',
        stripeLink: 'https://buy.stripe.com/5kQ28qfMb773g0d3MdgUM03',
        description: 'Most popular',
        default: true
    },
    { 
        id: 'yearly', 
        period: 'year', 
        price: '€19.99', 
        value: 'year',
        stripeLink: 'https://buy.stripe.com/fZu7sK57xbnj01faaBgUM05',
        description: 'Save 17%',
        savings: '17%'
    }
];

// Check subscription status on app load
// This function automatically renews cookies on successful verification to reduce email prompts
async function checkSubscriptionStatus() {
    const savedEmail = getCookie('premiumEmail');
    if (!savedEmail) return false;
    
    try {
        const response = await fetch('https://api.saomiguelbus.com/api/v1/subscription/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: savedEmail })
        });
        
        const data = await response.json();
        
        if (data.hasActiveSubscription) {
            adRemovalState.isActive = true;
            adRemovalState.userEmail = savedEmail;
            adRemovalState.subscriptionExpiresAt = data.expiresAt;
            
            // Renew cookies with fresh expiration dates
            renewPremiumCookies(savedEmail, data.expiresAt);
            
            return true;
        } else {
            // Subscription expired or invalid
            clearPremiumCookies();
            return false;
        }
    } catch (error) {
        console.error('Error checking subscription:', error);
        return false;
    }
}

// Clear premium cookies
function clearPremiumCookies() {
    deleteCookie('premiumEmail');
    deleteCookie('premiumExpiresAt');
    deleteCookie('premiumLastVerified');
    adRemovalState.isActive = false;
    adRemovalState.userEmail = null;
    adRemovalState.subscriptionExpiresAt = null;
}

// Smart cookie renewal - sets cookies to expire in 30 days or when subscription expires, whichever is sooner
function renewPremiumCookies(email, subscriptionExpiresAt) {
    const subscriptionExpiry = new Date(subscriptionExpiresAt);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const cookieExpiryDays = subscriptionExpiry < thirtyDaysFromNow ? 
        Math.ceil((subscriptionExpiry - new Date()) / (1000 * 60 * 60 * 24)) : 30;
    
    setCookie('premiumEmail', email, Math.max(1, cookieExpiryDays));
    setCookie('premiumExpiresAt', subscriptionExpiresAt, Math.max(1, cookieExpiryDays));
    
    // Store timestamp of last successful verification
    setCookie('premiumLastVerified', new Date().toISOString(), Math.max(1, cookieExpiryDays));
}

// Initialize ad removal on app load
async function initializeAdRemoval() {
    const hasActiveSubscription = await checkSubscriptionStatus();
    if (hasActiveSubscription) {
        hideAllAds();
    }
    
    // Update premium status display after checking subscription
    updatePremiumStatusDisplay();
    
    // Set up event listeners for modal close buttons
    setupModalEventListeners();
}

// Set up event listeners for modals
function setupModalEventListeners() {
    // Pricing modal close button
    const closePricingModal = document.getElementById('closePricingModal');
    if (closePricingModal) {
        closePricingModal.addEventListener('click', hidePricingModal);
    }
    
    // Email verification modal close button
    const closeEmailVerificationModal = document.getElementById('closeEmailVerificationModal');
    if (closeEmailVerificationModal) {
        closeEmailVerificationModal.addEventListener('click', hideEmailVerificationModal);
    }
    
    // Close modals when clicking outside
    document.getElementById('pricingModal')?.addEventListener('click', function(e) {
        if (e.target === this) hidePricingModal();
    });
    
    document.getElementById('emailVerificationModal')?.addEventListener('click', function(e) {
        if (e.target === this) hideEmailVerificationModal();
    });
}

// Hide all ads in the application
function hideAllAds() {
    // Hide main ad banner
    const adPlaceholder = document.getElementById('placeHolderForAd');
    if (adPlaceholder) {
        adPlaceholder.style.display = 'none';
    }
    
    // Hide specific ad banners on search forms
    const homeAdBanner = document.getElementById('homeAdBanner');
    const routesAdBanner = document.getElementById('routesAdBanner');
    
    if (homeAdBanner) {
        homeAdBanner.style.display = 'none';
    }
    if (routesAdBanner) {
        routesAdBanner.style.display = 'none';
    }
    
    // Hide any other ad banners
    const adBanners = document.querySelectorAll('.ad-banner');
    adBanners.forEach(banner => {
        banner.style.display = 'none';
    });
}

// Show premium indicator on ads tab
function addPremiumIndicator() {
    // Find the ads tab link
    const adsTabLink = document.querySelector('[data-target="advert"]');
    if (adsTabLink && !document.getElementById('premiumIndicator')) {
        const indicator = document.createElement('div');
        indicator.id = 'premiumIndicator';
        indicator.className = 'absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center';
        indicator.innerHTML = '👑';
        indicator.style.fontSize = '8px';
        
        // Make the ads tab link relative positioned to contain the absolute indicator
        adsTabLink.style.position = 'relative';
        adsTabLink.appendChild(indicator);
    }
}

// Remove premium indicator
function removePremiumIndicator() {
    const indicator = document.getElementById('premiumIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Show pricing selection modal
function showPricingModal() {
    document.getElementById('pricingModal').classList.remove('hidden');
    // Set monthly as default selected
    selectPricingOption('monthly');
}

// Hide pricing modal
function hidePricingModal() {
    document.getElementById('pricingModal').classList.add('hidden');
}

// Select pricing option
function selectPricingOption(optionId) {
    // Remove all selected states
    document.querySelectorAll('.pricing-option').forEach(option => {
        option.classList.remove('border-green-500', 'bg-green-50');
        option.classList.add('border-gray-200', 'bg-white');
        const radio = option.querySelector('.w-4.h-4');
        if (radio) {
            radio.classList.remove('bg-green-500', 'border-green-500');
            radio.classList.add('border-gray-300');
        }
    });
    
    // Add selected state to chosen option
    const selectedOption = document.getElementById(`pricing-option-${optionId}`);
    if (selectedOption) {
        selectedOption.classList.remove('border-gray-200', 'bg-white');
        selectedOption.classList.add('border-green-500', 'bg-green-50');
        const radio = selectedOption.querySelector('.w-4.h-4');
        if (radio) {
            radio.classList.remove('border-gray-300');
            radio.classList.add('bg-green-500', 'border-green-500');
        }
    }
    
    // Update selected option in state
    window.selectedPricingOption = optionId;
}

// Subscribe to selected plan
function subscribeToSelectedPlan() {
    const selectedOption = pricingOptions.find(option => option.id === window.selectedPricingOption);
    if (selectedOption) {
        window.open(selectedOption.stripeLink, '_blank');
        hidePricingModal();
    }
}

// Show email verification modal
function showEmailVerificationModal() {
    hidePricingModal();
    document.getElementById('emailVerificationModal').classList.remove('hidden');
}

// Hide email verification modal
function hideEmailVerificationModal() {
    document.getElementById('emailVerificationModal').classList.add('hidden');
}

// Verify existing subscription
async function verifyExistingSubscription() {
    const email = document.getElementById('verificationEmail').value.trim();
    
    if (!email) {
        showVerificationError(t('emailRequired', 'Please enter your email address'));
        return;
    }
    
    if (!isValidEmail(email)) {
        showVerificationError(t('invalidEmail', 'Please enter a valid email address'));
        return;
    }
    
    // Show loading state
    const verifyBtn = document.querySelector('[data-umami-event="verify-subscription"]');
    const originalText = verifyBtn.innerHTML;
    verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>' + t('verifying', 'Verifying...');
    verifyBtn.disabled = true;
    
    try {
        const response = await fetch('https://api.saomiguelbus.com/api/v1/subscription/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        
        const data = await response.json();
        
        if (data.hasActiveSubscription) {
            // Success - activate premium
            adRemovalState.isActive = true;
            adRemovalState.userEmail = email;
            adRemovalState.subscriptionExpiresAt = data.expiresAt;
            
            // Renew cookies with smart expiration
            renewPremiumCookies(email, data.expiresAt);
            
            hideAllAds();
            hideEmailVerificationModal();
            
            // Show success message
            showNotification(t('premiumActivated', 'Premium activated successfully!'), 'success');
            
            // Update UI
            updatePremiumStatusDisplay();
        } else {
            // No active subscription
            showVerificationError(t('noSubscription', 'No active subscription found for this email. Please subscribe first.'));
        }
    } catch (error) {
        console.error('Error verifying subscription:', error);
        showVerificationError(t('verificationError', 'Error verifying subscription. Please try again.'));
    } finally {
        // Reset button state
        verifyBtn.innerHTML = originalText;
        verifyBtn.disabled = false;
    }
}

// Show verification error
function showVerificationError(message) {
    const errorElement = document.getElementById('verificationError');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}

// Clear verification error
function clearVerificationError() {
    const errorElement = document.getElementById('verificationError');
    errorElement.classList.add('hidden');
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Update advert page content based on premium status
function updateAdvertPageContent() {
    const premiumSubscriptionContent = document.getElementById('premiumSubscriptionContent');
    const premiumThankYouContent = document.getElementById('premiumThankYouContent');
    const premiumExpiryDatePage = document.getElementById('premiumExpiryDatePage');
    
    if (adRemovalState.isActive) {
        // User has premium - show thank you content
        if (premiumSubscriptionContent) {
            premiumSubscriptionContent.classList.add('hidden');
        }
        if (premiumThankYouContent) {
            premiumThankYouContent.classList.remove('hidden');
        }
        
        // Update expiry date
        if (premiumExpiryDatePage && adRemovalState.subscriptionExpiresAt) {
            const expiryDate = new Date(adRemovalState.subscriptionExpiresAt);
            premiumExpiryDatePage.textContent = expiryDate.toLocaleDateString();
        }
    } else {
        // User doesn't have premium - show subscription content
        if (premiumSubscriptionContent) {
            premiumSubscriptionContent.classList.remove('hidden');
        }
        if (premiumThankYouContent) {
            premiumThankYouContent.classList.add('hidden');
        }
        
        // Set monthly as default selected
        selectPricingOptionPage('monthly');
    }
}

// Select pricing option for advert page
function selectPricingOptionPage(optionId) {
    // Remove all selected states
    document.querySelectorAll('.pricing-option').forEach(option => {
        option.classList.remove('border-green-500', 'bg-green-50');
        option.classList.add('border-gray-200', 'bg-white');
        const radio = option.querySelector('.w-4.h-4');
        if (radio) {
            radio.classList.remove('bg-green-500', 'border-green-500');
            radio.classList.add('border-gray-300');
        }
    });
    
    // Add selected state to chosen option
    const selectedOption = document.getElementById(`premium-page-${optionId}`);
    if (selectedOption) {
        selectedOption.classList.remove('border-gray-200', 'bg-white');
        selectedOption.classList.add('border-green-500', 'bg-green-50');
        const radio = selectedOption.querySelector('.w-4.h-4');
        if (radio) {
            radio.classList.remove('border-gray-300');
            radio.classList.add('bg-green-500', 'border-green-500');
        }
    }
    
    // Update selected option in state
    window.selectedPricingOptionPage = optionId;
}

// Subscribe to selected plan from advert page
function subscribeToSelectedPlanPage() {
    const selectedOption = pricingOptions.find(option => option.id === window.selectedPricingOptionPage);
    if (selectedOption) {
        window.open(selectedOption.stripeLink, '_blank');
    }
}

// Update premium status display
function updatePremiumStatusDisplay() {
    const premiumStatusCard = document.getElementById('premiumStatusCard');
    const cancelSubscriptionCard = document.getElementById('cancelSubscriptionCard');
    const premiumButton = document.getElementById('premiumButton');
    const manageSubscriptionButton = document.getElementById('manageSubscriptionButton');
    const premiumExpiryDate = document.getElementById('premiumExpiryDate');
    
    if (adRemovalState.isActive) {
        // Show premium status elements
        if (premiumStatusCard) {
            premiumStatusCard.classList.remove('hidden');
        }
        
        if (cancelSubscriptionCard) {
            cancelSubscriptionCard.classList.remove('hidden');
        }
        
        // Hide premium button and show manage subscription button
        if (premiumButton) {
            premiumButton.classList.add('hidden');
        }
        if (manageSubscriptionButton) {
            manageSubscriptionButton.classList.remove('hidden');
        }
        
        // Show premium indicator on ads tab
        addPremiumIndicator();
        
        if (premiumExpiryDate && adRemovalState.subscriptionExpiresAt) {
            const expiryDate = new Date(adRemovalState.subscriptionExpiresAt);
            premiumExpiryDate.textContent = expiryDate.toLocaleDateString();
        }
    } else {
        // Hide premium status elements
        if (premiumStatusCard) {
            premiumStatusCard.classList.add('hidden');
        }
        
        if (cancelSubscriptionCard) {
            cancelSubscriptionCard.classList.add('hidden');
        }
        
        // Show premium button and hide manage subscription button
        if (premiumButton) {
            premiumButton.classList.remove('hidden');
        }
        if (manageSubscriptionButton) {
            manageSubscriptionButton.classList.add('hidden');
        }
        
        // Remove premium indicator
        removePremiumIndicator();
    }
    
    // Update advert page content
    updateAdvertPageContent();
}

// Deactivate premium
function deactivatePremium() {
    if (confirm(t('deactivatePremium', 'Are you sure you want to deactivate premium?'))) {
        clearPremiumCookies();
        location.reload(); // Reload to show ads again
    }
}

// Debug function to test premium status (for development)
function debugActivatePremium() {
    adRemovalState.isActive = true;
    adRemovalState.userEmail = 'test@example.com';
    adRemovalState.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now
    hideAllAds();
    updatePremiumStatusDisplay();
    console.log('Premium activated for testing');
}

// Debug function to test non-premium status (for development)
function debugDeactivatePremium() {
    clearPremiumCookies();
    updatePremiumStatusDisplay();
    console.log('Premium deactivated for testing');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Close pricing modal
    document.getElementById('closePricingModal')?.addEventListener('click', hidePricingModal);
    
    // Close email verification modal
    document.getElementById('closeEmailVerificationModal')?.addEventListener('click', hideEmailVerificationModal);
    
    // Close modals when clicking outside
    document.getElementById('pricingModal')?.addEventListener('click', function(e) {
        if (e.target === this) {
            hidePricingModal();
        }
    });
    
    document.getElementById('emailVerificationModal')?.addEventListener('click', function(e) {
        if (e.target === this) {
            hideEmailVerificationModal();
        }
    });
}); 