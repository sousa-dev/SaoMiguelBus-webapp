# Ad Removal Feature Implementation Plan

## Overview
Implement a premium ad removal feature that allows users to subscribe via Stripe and remove all advertisements from the São Miguel Bus application. Users will input their email associated with the subscription, and the app will verify their subscription status to hide ads.

## Current Architecture Analysis

### Existing Components
- **Ad System**: `loadAdBanner()` function in `js/apiHandler.js` (lines 855-932)
- **Ad Container**: `placeHolderForAd` div in `index.html` (line 309)
- **Cookie Management**: Already implemented in `index.html` (lines 1373-1399)
- **Internationalization**: Multi-language support with locale files
- **Subscription System**: Already exists (referenced in advert section with Stripe links)

### Current Ad Display Logic
```javascript
function loadAdBanner(on) {
    // Fetches ad from API: https://api.saomiguelbus.com/api/v1/ad?on=${on}&platform=web
    // Inserts ad HTML into placeHolderForAd div
    // Handles ad clicks and tracking
}
```

## Implementation Plan

### Phase 1: Backend API Enhancement

#### 1.1 Subscription Verification Endpoint
**New API Endpoint**: `https://api.saomiguelbus.com/api/v1/subscription/verify`

**Request**:
```javascript
POST /api/v1/subscription/verify
Content-Type: application/json

{
    "email": "user@example.com"
}
```

**Response**:
```javascript
{
    "hasActiveSubscription": true/false,
    "subscriptionType": "premium" | "basic",
    "expiresAt": "2024-12-31T23:59:59Z",
    "features": ["ad_removal", "priority_support"]
}
```

#### 1.2 Stripe Integration
- Use existing Stripe setup from advert section
- Create new subscription products:
  - **Weekly**: €0.50/week
  - **Monthly**: €1.99/month  
  - **Yearly**: €19.99/year (save 17%)
- Features: Ad removal, priority support
- **Subscription Management Portal**: https://billing.stripe.com/p/login/3cIaEW8jJ3UR4hvbeFgUM00
- **Stripe Subscription Links**:
  - Weekly: https://buy.stripe.com/5kQ9AS43t1MJ4hv6YpgUM04
  - Monthly: https://buy.stripe.com/5kQ28qfMb773g0d3MdgUM03
  - Yearly: https://buy.stripe.com/fZu7sK57xbnj01faaBgUM05

### Phase 2: Frontend Implementation

#### 2.1 New JavaScript Module: `js/adRemovalHandler.js`

```javascript
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
        price: '€0.49', 
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
            setCookie('premiumEmail', savedEmail, 365);
            setCookie('premiumExpiresAt', data.expiresAt, 365);
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
    adRemovalState.isActive = false;
    adRemovalState.userEmail = null;
    adRemovalState.subscriptionExpiresAt = null;
}

// Initialize ad removal on app load
async function initializeAdRemoval() {
    const hasActiveSubscription = await checkSubscriptionStatus();
    if (hasActiveSubscription) {
        hideAllAds();
    }
}

// Hide all ads in the application
function hideAllAds() {
    // Hide main ad banner
    const adPlaceholder = document.getElementById('placeHolderForAd');
    if (adPlaceholder) {
        adPlaceholder.style.display = 'none';
    }
    
    // Hide ad banners in different sections
    const adBanners = document.querySelectorAll('[data-umami-event*="ad-banner"]');
    adBanners.forEach(banner => {
        banner.style.display = 'none';
    });
    
    // Add premium indicator
    addPremiumIndicator();
}

// Show premium indicator
function addPremiumIndicator() {
    const navBar = document.querySelector('.bottom-0');
    if (navBar && !document.getElementById('premiumIndicator')) {
        const indicator = document.createElement('div');
        indicator.id = 'premiumIndicator';
        indicator.className = 'absolute -top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full';
        indicator.innerHTML = '⭐ Premium';
        navBar.appendChild(indicator);
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
    });
    
    // Add selected state to chosen option
    const selectedOption = document.getElementById(`pricing-option-${optionId}`);
    if (selectedOption) {
        selectedOption.classList.remove('border-gray-200', 'bg-white');
        selectedOption.classList.add('border-green-500', 'bg-green-50');
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
            
            setCookie('premiumEmail', email, 365);
            setCookie('premiumExpiresAt', data.expiresAt, 365);
            
            hideAllAds();
            hideEmailVerificationModal();
            
            // Show success message
            showNotification(t('premiumActivated', 'Premium activated successfully!'), 'success');
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
    });
    
    // Add selected state to chosen option
    const selectedOption = document.getElementById(`premium-page-${optionId}`);
    if (selectedOption) {
        selectedOption.classList.remove('border-gray-200', 'bg-white');
        selectedOption.classList.add('border-green-500', 'bg-green-50');
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
```

#### 2.2 Modified `loadAdBanner()` Function

```javascript
// Modified loadAdBanner function in js/apiHandler.js
function loadAdBanner(on) {
    // Check if user has active premium subscription
    if (adRemovalState.isActive) {
        console.log('Ads hidden for premium user');
        return;
    }
    
    // Existing ad loading logic...
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return;
    }
    
    const apiUrl = `https://api.saomiguelbus.com/api/v1/ad?on=${on}&platform=web`;
    // ... rest of existing function
}
```

#### 2.3 Pricing Selection Modal

**Add to `index.html`** (after existing modals):

```html
<!-- Pricing Selection Modal -->
<div id="pricingModal" class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center hidden">
    <div class="bg-white rounded-lg p-6 w-96 relative max-w-md mx-auto">
        <button id="closePricingModal" class="text-gray-600 w-full text-right hover:text-gray-800 transition duration-300 ease-in-out mb-2">
            <i class="fas fa-times text-xl text-right"></i>
        </button>
        
        <div class="text-center mb-6">
            <i class="fas fa-crown text-4xl text-yellow-500 mb-4"></i>
            <h3 class="text-xl font-semibold text-green-600 mb-2" data-i18n="removeAdsTitle">Remove Ads</h3>
            <p class="text-gray-700 mb-4" data-i18n="pricingDescription">
                Choose your plan to remove all advertisements and enjoy an ad-free experience.
            </p>
            <p class="text-sm text-green-600 font-medium" data-i18n="supportDeveloper">
                Bonus: Support an Azorean Solo Developer. (Yes, this app is not developed by any company, it is just one guy)
            </p>
        </div>
        
        <!-- Pricing Options -->
        <div class="space-y-3 mb-6">
            <div id="pricing-option-weekly" class="pricing-option border-2 border-gray-200 bg-white rounded-lg p-4 cursor-pointer hover:border-green-300 transition-colors" onclick="selectPricingOption('weekly')">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="w-4 h-4 border-2 border-gray-300 rounded-full mr-3"></div>
                        <div>
                            <div class="font-semibold text-lg">€0.50<span class="text-sm text-gray-500">/week</span></div>
                            <div class="text-sm text-gray-600" data-i18n="weeklyDescription">Perfect for tourists</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="pricing-option-monthly" class="pricing-option border-2 border-gray-200 bg-white rounded-lg p-4 cursor-pointer hover:border-green-300 transition-colors" onclick="selectPricingOption('monthly')">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="w-4 h-4 border-2 border-gray-300 rounded-full mr-3"></div>
                        <div>
                            <div class="font-semibold text-lg">€1.99<span class="text-sm text-gray-500">/month</span></div>
                            <div class="text-sm text-gray-600" data-i18n="monthlyDescription">Most popular</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="pricing-option-yearly" class="pricing-option border-2 border-gray-200 bg-white rounded-lg p-4 cursor-pointer hover:border-green-300 transition-colors" onclick="selectPricingOption('yearly')">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="w-4 h-4 border-2 border-gray-300 rounded-full mr-3"></div>
                        <div>
                            <div class="font-semibold text-lg">€19.99<span class="text-sm text-gray-500">/year</span></div>
                            <div class="text-sm text-gray-600" data-i18n="yearlyDescription">Save 17%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Subscribe Button -->
        <button onclick="subscribeToSelectedPlan()" 
                class="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition duration-300 mb-4"
                data-umami-event="subscribe-premium">
            <i class="fas fa-crown mr-2"></i>
            <span data-i18n="removeAdsButton">Remove Ads</span>
        </button>
        
        <!-- Already Subscribed Link -->
        <div class="text-center">
            <button onclick="showEmailVerificationModal()" 
                    class="text-blue-500 hover:text-blue-700 text-sm underline"
                    data-umami-event="already-subscribed-link">
                <span data-i18n="alreadySubscribed">I already have a subscription enabled</span>
            </button>
        </div>
        
        <p class="text-xs text-gray-500 text-center mt-4" data-i18n="premiumTerms">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
        </p>
    </div>
</div>
```

#### 2.4 Email Verification Modal

**Add to `index.html`** (after pricing modal):

```html
<!-- Email Verification Modal -->
<div id="emailVerificationModal" class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center hidden">
    <div class="bg-white rounded-lg p-6 w-80 relative max-w-md mx-auto">
        <button id="closeEmailVerificationModal" class="text-gray-600 w-full text-right hover:text-gray-800 transition duration-300 ease-in-out mb-2">
            <i class="fas fa-times text-xl text-right"></i>
        </button>
        
        <div class="text-center mb-6">
            <i class="fas fa-envelope text-4xl text-blue-500 mb-4"></i>
            <h3 class="text-xl font-semibold text-green-600 mb-2" data-i18n="verifySubscriptionTitle">Verify Subscription</h3>
            <p class="text-gray-700 mb-4" data-i18n="verifySubscriptionDescription">
                Enter the email address associated with your subscription to activate premium features.
            </p>
        </div>
        
        <div class="space-y-4">
            <div>
                <input type="email" id="verificationEmail" 
                       placeholder="Enter your subscription email" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                       data-i18n-placeholder="emailPlaceholder"
                       oninput="clearVerificationError()">
            </div>
            
            <!-- Error Message -->
            <div id="verificationError" class="hidden bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm"></div>
            
            <button onclick="verifyExistingSubscription()" 
                    class="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                    data-umami-event="verify-subscription">
                <span data-i18n="verifyButton">Verify Subscription</span>
            </button>
            
            <div class="text-center">
                <p class="text-sm text-gray-600 mb-2" data-i18n="verificationHelp">Think this is a mistake?</p>
                <a href="mailto:info@saomiguelbus.com" 
                   class="text-blue-500 hover:text-blue-700 text-sm underline"
                   data-umami-event="contact-support">
                    <span data-i18n="contactSupport">Contact us at info@saomiguelbus.com</span>
                </a>
            </div>
        </div>
    </div>
</div>
```

### Phase 3: UI Integration

#### 3.1 Add Premium Button to Info Page

**Modify `index.html`** (in the info section):

```html
<!-- Add after existing info cards -->
<a href="#" class="block bg-white border border-gray-200 rounded-lg p-4 mb-4 flex items-center justify-between hover:bg-gray-50" 
   onclick="showPricingModal();" data-umami-event="view-premium-modal">
    <div class="flex items-center">
        <i class="fas fa-crown text-3xl mr-4 text-yellow-500"></i>
        <h3 class="font-semibold" data-i18n="removeAdsTitle">Remove Ads</h3>
    </div>
    <span class="iconify" data-icon="mdi:chevron-right"></span>
</a>
```

#### 3.2 Completely Redesign Advert Page

**Replace the entire advert section in `index.html`**:

```html
<!-- Advert Page - Now Premium Subscription Page -->
<section id="advert" class="page hidden bg-white flex flex-col items-center p-4" data-umami-event="view-premium-page">
    <!-- Content for users WITHOUT premium (ads active) -->
    <div id="premiumSubscriptionContent" class="w-full max-w-md mx-auto">
        <div class="text-center mb-6">
            <i class="fas fa-crown text-5xl text-yellow-500 mb-4"></i>
            <h2 class="text-2xl font-bold mb-2" data-i18n="removeAdsTitle">Remove Ads</h2>
            <p class="text-gray-700 mb-4" data-i18n="premiumPageDescription">
                Enjoy an ad-free experience and support the development of São Miguel Bus.
            </p>
            <p class="text-sm text-green-600 font-medium" data-i18n="supportDeveloper">
                Bonus: Support an Azorean Solo Developer. (Yes, this app is not developed by any company, it is just one guy)
            </p>
        </div>
        
        <!-- Pricing Options -->
        <div class="space-y-3 mb-6">
            <div id="premium-page-weekly" class="pricing-option border-2 border-gray-200 bg-white rounded-lg p-4 cursor-pointer hover:border-green-300 transition-colors" onclick="selectPricingOptionPage('weekly')">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="w-4 h-4 border-2 border-gray-300 rounded-full mr-3"></div>
                        <div>
                            <div class="font-semibold text-lg">€0.50<span class="text-sm text-gray-500">/week</span></div>
                            <div class="text-sm text-gray-600" data-i18n="weeklyDescription">Perfect for tourists</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="premium-page-monthly" class="pricing-option border-2 border-gray-200 bg-white rounded-lg p-4 cursor-pointer hover:border-green-300 transition-colors" onclick="selectPricingOptionPage('monthly')">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="w-4 h-4 border-2 border-gray-300 rounded-full mr-3"></div>
                        <div>
                            <div class="font-semibold text-lg">€1.99<span class="text-sm text-gray-500">/month</span></div>
                            <div class="text-sm text-gray-600" data-i18n="monthlyDescription">Most popular</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="premium-page-yearly" class="pricing-option border-2 border-gray-200 bg-white rounded-lg p-4 cursor-pointer hover:border-green-300 transition-colors" onclick="selectPricingOptionPage('yearly')">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="w-4 h-4 border-2 border-gray-300 rounded-full mr-3"></div>
                        <div>
                            <div class="font-semibold text-lg">€19.99<span class="text-sm text-gray-500">/year</span></div>
                            <div class="text-sm text-gray-600" data-i18n="yearlyDescription">Save 17%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Subscribe Button -->
        <button onclick="subscribeToSelectedPlanPage()" 
                class="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition duration-300 mb-4"
                data-umami-event="subscribe-premium-page">
            <i class="fas fa-crown mr-2"></i>
            <span data-i18n="removeAdsButton">Remove Ads</span>
        </button>
        
        <!-- Already Subscribed Link -->
        <div class="text-center mb-6">
            <button onclick="showEmailVerificationModal()" 
                    class="text-blue-500 hover:text-blue-700 text-sm underline"
                    data-umami-event="already-subscribed-page">
                <span data-i18n="alreadySubscribed">I already have a subscription enabled</span>
            </button>
        </div>
        
        <!-- Premium Features -->
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h4 class="font-semibold text-green-800 mb-3" data-i18n="premiumFeaturesTitle">Premium Features:</h4>
            <ul class="text-sm text-green-700 space-y-2">
                <li><i class="fas fa-check text-green-500 mr-2"></i><span data-i18n="premiumFeature1">No advertisements</span></li>
                <li><i class="fas fa-check text-green-500 mr-2"></i><span data-i18n="premiumFeature2">Priority support</span></li>
                <li><i class="fas fa-check text-green-500 mr-2"></i><span data-i18n="premiumFeature3">Early access to new features</span></li>
            </ul>
        </div>
        
        <p class="text-xs text-gray-500 text-center" data-i18n="premiumTerms">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
        </p>
    </div>
    
    <!-- Content for users WITH premium (ads removed) -->
    <div id="premiumThankYouContent" class="w-full max-w-md mx-auto hidden">
        <div class="text-center mb-6">
            <i class="fas fa-heart text-5xl text-red-500 mb-4"></i>
            <h2 class="text-2xl font-bold mb-2" data-i18n="thankYouTitle">Thank You!</h2>
            <p class="text-gray-700 mb-4" data-i18n="thankYouDescription">
                You're enjoying an ad-free experience and supporting the development of São Miguel Bus.
            </p>
        </div>
        
        <!-- Premium Status Card -->
        <div class="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-crown text-2xl mr-3"></i>
                    <div>
                        <h3 class="font-semibold" data-i18n="premiumActive">Premium Active</h3>
                        <p class="text-sm opacity-90" data-i18n="premiumExpires">Expires: <span id="premiumExpiryDatePage"></span></p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Cancel Subscription Card -->
        <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-credit-card text-2xl mr-3 text-red-500"></i>
                    <div>
                        <h3 class="font-semibold text-gray-800" data-i18n="cancelSubscriptionTitle">Cancel Subscription</h3>
                        <p class="text-sm text-gray-600" data-i18n="cancelSubscriptionDescription">Manage or cancel your premium subscription</p>
                    </div>
                </div>
                <a href="https://billing.stripe.com/p/login/3cIaEW8jJ3UR4hvbeFgUM00" target="_blank" 
                   class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300 text-sm"
                   data-umami-event="cancel-subscription-page">
                    <span data-i18n="cancelSubscriptionButton">Cancel</span>
                </a>
            </div>
        </div>
        
        <!-- Support Message -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 class="font-semibold text-blue-800 mb-2" data-i18n="supportMessageTitle">Your Support Matters</h4>
            <p class="text-sm text-blue-700" data-i18n="supportMessageDescription">
                Thank you for supporting an independent developer. Your subscription helps keep São Miguel Bus free for everyone and enables continuous improvements.
            </p>
        </div>
    </div>
</section>
```

#### 3.3 Add Premium Status Card (if user has premium)

```html
<!-- Add to info section when premium is active -->
<div id="premiumStatusCard" class="hidden bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg p-4 mb-4">
    <div class="flex items-center justify-between">
        <div class="flex items-center">
            <i class="fas fa-crown text-2xl mr-3"></i>
            <div>
                <h3 class="font-semibold" data-i18n="premiumActive">Premium Active</h3>
                <p class="text-sm opacity-90" data-i18n="premiumExpires">Expires: <span id="premiumExpiryDate"></span></p>
            </div>
        </div>
        <div class="flex items-center space-x-2">
            <a href="https://billing.stripe.com/p/login/3cIaEW8jJ3UR4hvbeFgUM00" target="_blank" 
               class="text-white hover:text-gray-200 text-sm underline"
               data-umami-event="manage-subscription">
                <span data-i18n="manageSubscription">Manage</span>
            </a>
            <button onclick="deactivatePremium()" class="text-white hover:text-gray-200">
                <i class="fas fa-sign-out-alt"></i>
            </button>
        </div>
    </div>
</div>
```

#### 3.4 Add Cancel Subscription Card (if user has premium)

```html
<!-- Add to info section when premium is active -->
<div id="cancelSubscriptionCard" class="hidden bg-white border border-gray-200 rounded-lg p-4 mb-4">
    <div class="flex items-center justify-between">
        <div class="flex items-center">
            <i class="fas fa-credit-card text-2xl mr-3 text-red-500"></i>
            <div>
                <h3 class="font-semibold text-gray-800" data-i18n="cancelSubscriptionTitle">Cancel Subscription</h3>
                <p class="text-sm text-gray-600" data-i18n="cancelSubscriptionDescription">Manage or cancel your premium subscription</p>
            </div>
        </div>
        <a href="https://billing.stripe.com/p/login/3cIaEW8jJ3UR4hvbeFgUM00" target="_blank" 
           class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300 text-sm"
           data-umami-event="cancel-subscription">
            <span data-i18n="cancelSubscriptionButton">Cancel</span>
        </a>
    </div>
</div>
```

### Phase 4: Internationalization

#### 4.1 Add New Translation Keys

**Add to all locale files** (`locales/en.json`, `locales/pt.json`, etc.):

```json
{
    "removeAdsTitle": "Remove Ads",
    "pricingDescription": "Choose your plan to remove all advertisements and enjoy an ad-free experience.",
    "premiumPageDescription": "Enjoy an ad-free experience and support the development of São Miguel Bus.",
    "supportDeveloper": "Bonus: Support an Azorean Solo Developer. (Yes, this app is not developed by any company, it is just one guy)",
    "weeklyDescription": "Perfect for tourists",
    "monthlyDescription": "Most popular",
    "yearlyDescription": "Save 17%",
    "removeAdsButton": "Remove Ads",
    "alreadySubscribed": "I already have a subscription enabled",
    "premiumTerms": "By subscribing, you agree to our Terms of Service and Privacy Policy.",
    "premiumFeaturesTitle": "Premium Features:",
    "premiumFeature1": "No advertisements",
    "premiumFeature2": "Priority support",
    "premiumFeature3": "Early access to new features",
    "verifySubscriptionTitle": "Verify Subscription",
    "verifySubscriptionDescription": "Enter the email address associated with your subscription to activate premium features.",
    "emailPlaceholder": "Enter your subscription email",
    "verifyButton": "Verify Subscription",
    "verificationHelp": "Think this is a mistake?",
    "contactSupport": "Contact us at info@saomiguelbus.com",
    "emailRequired": "Please enter your email address",
    "invalidEmail": "Please enter a valid email address",
    "verifying": "Verifying...",
    "premiumActivated": "Premium activated successfully!",
    "noSubscription": "No active subscription found for this email. Please subscribe first.",
    "verificationError": "Error verifying subscription. Please try again.",
    "premiumActive": "Premium Active",
    "premiumExpires": "Expires:",
    "deactivatePremium": "Deactivate Premium",
    "premiumDeactivated": "Premium deactivated successfully!",
    "manageSubscription": "Manage",
    "cancelSubscriptionTitle": "Cancel Subscription",
    "cancelSubscriptionDescription": "Manage or cancel your premium subscription",
    "cancelSubscriptionButton": "Cancel",
    "thankYouTitle": "Thank You!",
    "thankYouDescription": "You're enjoying an ad-free experience and supporting the development of São Miguel Bus.",
    "supportMessageTitle": "Your Support Matters",
    "supportMessageDescription": "Thank you for supporting an independent developer. Your subscription helps keep São Miguel Bus free for everyone and enables continuous improvements."
}
```

### Phase 5: Integration and Testing

#### 5.1 Update Main HTML File

**Add to `index.html`** (before closing `</body>` tag):

```html
<!-- Include ad removal handler -->
<script src="js/adRemovalHandler.js" defer></script>
```

#### 5.2 Initialize Ad Removal

**Modify `js/apiHandler.js`** (in DOMContentLoaded event):

```javascript
document.addEventListener("DOMContentLoaded", function() {
    fetchAndPopulateStops();
    
    // Initialize ad removal system
    initializeAdRemoval();
    
    // ... existing code
});
```

#### 5.3 Event Listeners

**Add to `js/adRemovalHandler.js`**:

```javascript
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
    
    // Update premium status display
    updatePremiumStatusDisplay();
});

// Update premium status display
function updatePremiumStatusDisplay() {
    const premiumStatusCard = document.getElementById('premiumStatusCard');
    const cancelSubscriptionCard = document.getElementById('cancelSubscriptionCard');
    const premiumExpiryDate = document.getElementById('premiumExpiryDate');
    
    if (adRemovalState.isActive) {
        if (premiumStatusCard) {
            premiumStatusCard.classList.remove('hidden');
        }
        
        if (cancelSubscriptionCard) {
            cancelSubscriptionCard.classList.remove('hidden');
        }
        
        if (premiumExpiryDate && adRemovalState.subscriptionExpiresAt) {
            const expiryDate = new Date(adRemovalState.subscriptionExpiresAt);
            premiumExpiryDate.textContent = expiryDate.toLocaleDateString();
        }
    } else {
        if (premiumStatusCard) {
            premiumStatusCard.classList.add('hidden');
        }
        
        if (cancelSubscriptionCard) {
            cancelSubscriptionCard.classList.add('hidden');
        }
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
```

### Phase 6: Testing Checklist

#### 6.1 Functional Testing
- [ ] Pricing selection modal opens correctly
- [ ] Monthly option is selected by default
- [ ] Users can select different pricing options
- [ ] Stripe links redirect to correct plans
- [ ] Email verification modal opens from pricing modal
- [ ] Email validation works correctly
- [ ] Subscription verification works
- [ ] Ads are hidden when premium is active
- [ ] Ads show when premium is inactive
- [ ] Premium status persists across sessions
- [ ] Premium deactivation works
- [ ] Modal interactions work correctly
- [ ] Error handling for invalid emails
- [ ] Error handling for no subscription found
- [ ] Contact support link works
- [ ] Cancel subscription card appears when premium is active
- [ ] Manage subscription link works
- [ ] Cancel subscription button redirects correctly
- [ ] Advert page shows subscription content for non-premium users
- [ ] Advert page shows thank you content for premium users
- [ ] Pricing selection works on advert page
- [ ] Subscribe button works on advert page
- [ ] Premium expiry date displays correctly on advert page
- [ ] Support message displays for premium users

#### 6.2 Edge Cases
- [ ] Invalid email handling
- [ ] Network error handling
- [ ] Expired subscription handling
- [ ] Cookie deletion handling
- [ ] Multiple activation attempts
- [ ] Modal state management
- [ ] Pricing option selection persistence

#### 6.3 Performance Testing
- [ ] Subscription check doesn't slow app load
- [ ] Ad hiding doesn't cause layout shifts
- [ ] Memory usage is reasonable
- [ ] Modal animations are smooth

### Phase 7: Deployment

#### 7.1 Backend Deployment
1. Deploy new subscription verification endpoint
2. Set up Stripe webhook for subscription events
3. Test API integration

#### 7.2 Frontend Deployment
1. Deploy updated JavaScript files
2. Deploy updated HTML with new modals
3. Deploy updated locale files
4. Test all functionality in production

#### 7.3 Monitoring
1. Set up analytics for premium conversions
2. Monitor subscription verification API usage
3. Track ad removal feature usage
4. Monitor pricing option selection patterns

## Technical Considerations

### Security
- Email validation on both frontend and backend
- Rate limiting on subscription verification endpoint
- Secure cookie handling for premium status

### Performance
- Lazy load premium features
- Cache subscription status appropriately
- Minimize API calls for subscription verification

### User Experience
- Clear pricing options with visual selection
- Easy activation process for existing subscribers
- Graceful fallback if subscription check fails
- Visual indicators for premium status
- Support for tourist users with weekly option

### Analytics
- Track premium conversion rates by pricing option
- Monitor subscription verification success rates
- Analyze user behavior with/without ads
- Track modal interaction patterns

## Success Metrics

1. **Conversion Rate**: Percentage of users who subscribe to premium
2. **Pricing Distribution**: Which pricing options are most popular
3. **Activation Rate**: Percentage of subscribers who successfully activate
4. **Retention Rate**: Percentage of premium users who remain active
5. **Revenue**: Monthly recurring revenue from premium subscriptions
6. **User Satisfaction**: Reduced complaints about ads

## Timeline

- **Phase 1-2**: 1 week (Backend API + Core Frontend)
- **Phase 3-4**: 3 days (UI Integration + i18n)
- **Phase 5**: 2 days (Integration & Testing)
- **Phase 6**: 2 days (Testing & Bug Fixes)
- **Phase 7**: 1 day (Deployment)

**Total Estimated Time**: 2 weeks 