// Bus Tracking UI Components
class BusTrackingUI {
    
    // Create tracking button for route cards
    static createTrackingButton(routeData, isPremium = false) {
        const button = document.createElement('button');
        button.className = 'bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition duration-300 text-xs sm:text-sm relative flex-1 min-w-0';
        
        if (isPremium) {
            button.innerHTML = '<i class="fas fa-location-arrow mr-1 sm:mr-2"></i><span class="truncate">' + t('trackBus', 'Track Bus') + '</span>';
            button.setAttribute('data-umami-event', 'track-bus-button');
            
            button.onclick = (event) => {
                event.stopPropagation();
                this.showTrackingDisclaimer(routeData);
            };
        } else {
            button.innerHTML = `
                <div class="flex items-center justify-center relative w-full">
                    <i class="fas fa-location-arrow mr-1 sm:mr-2 flex-shrink-0"></i>
                    <span class="truncate">${t('trackBus', 'Track Bus')}</span>
                    <i class="fas fa-crown absolute -top-1.5 -right-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center" style="font-size: 7px;"></i>
                </div>
            `;
            button.setAttribute('data-umami-event', 'track-bus-button-premium-required');
            
            button.onclick = (event) => {
                event.stopPropagation();
                // Open premium modal instead of tracking
                if (typeof showPricingModal === 'function') {
                    showPricingModal();
                }
                // Track premium required event
                if (typeof umami !== 'undefined') {
                    umami.track('tracking-premium-required');
                }
            };
        }
        
        return button;
    }

    // Create pin route button for "track every day" functionality
    static createPinRouteButton(routeData, isPremium = false) {
        const button = document.createElement('button');
        button.className = 'bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition duration-300 text-xs sm:text-sm relative flex-1 min-w-0';
        
        if (isPremium) {
            button.innerHTML = '<i class="fas fa-thumbtack mr-1 sm:mr-2"></i><span class="truncate">' + t('trackEveryDay', 'Track Every Day') + '</span>';
            button.setAttribute('data-umami-event', 'pin-route-button');
            
            button.onclick = (event) => {
                event.stopPropagation();
                this.showPinRouteModal(routeData);
            };
        } else {
            button.innerHTML = `
                <div class="flex items-center justify-center relative w-full">
                    <i class="fas fa-thumbtack mr-1 sm:mr-2 flex-shrink-0"></i>
                    <span class="truncate">${t('trackEveryDay', 'Track Every Day')}</span>
                    <i class="fas fa-crown absolute -top-1.5 -right-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center" style="font-size: 7px;"></i>
                </div>
            `;
            button.setAttribute('data-umami-event', 'pin-route-button-premium-required');
            
            button.onclick = (event) => {
                event.stopPropagation();
                // Open premium modal instead of pinning
                if (typeof showPricingModal === 'function') {
                    showPricingModal();
                }
                // Track premium required event
                if (typeof umami !== 'undefined') {
                    umami.track('pin-route-premium-required');
                }
            };
        }
        
        return button;
    }

    // Create journey-specific tracking button for step-by-step directions (no pin button)
    static createJourneyTrackingButton(routeData, isPremium = false) {
        const button = document.createElement('button');
        button.className = 'bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition duration-300 text-xs sm:text-sm relative w-full';
        
        if (isPremium) {
            button.innerHTML = '<i class="fas fa-location-arrow mr-1 sm:mr-2"></i><span class="truncate">' + t('trackThisJourney', 'Track This Journey') + '</span>';
            button.setAttribute('data-umami-event', 'track-journey-button');
            
            button.onclick = (event) => {
                event.stopPropagation();
                this.showJourneyTrackingDisclaimer(routeData);
            };
        } else {
            button.innerHTML = `
                <div class="flex items-center justify-center relative w-full">
                    <i class="fas fa-location-arrow mr-1 sm:mr-2 flex-shrink-0"></i>
                    <span class="truncate">${t('trackThisJourney', 'Track This Journey')}</span>
                    <i class="fas fa-crown absolute -top-1.5 -right-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center" style="font-size: 7px;"></i>
                </div>
            `;
            button.setAttribute('data-umami-event', 'track-journey-button-premium-required');
            
            button.onclick = (event) => {
                event.stopPropagation();
                // Open premium modal instead of tracking
                if (typeof showPricingModal === 'function') {
                    showPricingModal();
                }
                // Track premium required event
                if (typeof umami !== 'undefined') {
                    umami.track('journey-tracking-premium-required');
                }
            };
        }
        
        return button;
    }

    // Show tracking disclaimer modal
    static showTrackingDisclaimer(routeData) {
        const modal = this.createTrackingDisclaimerModal(routeData);
        document.body.appendChild(modal);
        modal.classList.remove('hidden');
    }

    // Create tracking disclaimer modal
    static createTrackingDisclaimerModal(routeData) {
        const modal = document.createElement('div');
        modal.id = 'trackingDisclaimerModal';
        modal.className = 'fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div class="p-4 sm:p-6">
                    <div class="flex items-start mb-4">
                        <i class="fas fa-exclamation-triangle text-yellow-500 text-xl sm:text-2xl mr-3 mt-0.5"></i>
                        <h2 class="text-lg sm:text-xl font-semibold text-gray-800 leading-tight">${t('trackingDisclaimer')}</h2>
                    </div>
                    
                    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 mb-4">
                        <h3 class="font-semibold text-yellow-800 mb-2 text-sm sm:text-base">${t('estimateOnlyTitle')}</h3>
                        <p class="text-yellow-700 text-xs sm:text-sm leading-relaxed">
                            ${t('estimateOnlyDescription')}
                        </p>
                    </div>
                    
                    <div class="space-y-3 text-xs sm:text-sm text-gray-600">
                        <div class="flex items-start">
                            <i class="fas fa-info-circle text-blue-500 mr-2 mt-0.5 flex-shrink-0"></i>
                            <p class="leading-relaxed">${t('trackingInfo1')}</p>
                        </div>
                        <div class="flex items-start">
                            <i class="fas fa-clock text-blue-500 mr-2 mt-0.5 flex-shrink-0"></i>
                            <p class="leading-relaxed">${t('trackingInfo2')}</p>
                        </div>
                        <div class="flex items-start">
                            <i class="fas fa-phone text-blue-500 mr-2 mt-0.5 flex-shrink-0"></i>
                            <p class="leading-relaxed">${t('trackingInfo3')}</p>
                        </div>
                    </div>
                    
                    <div class="mt-6 flex items-center hidden">
                        <input type="checkbox" id="dontShowAgainCheckbox" class="mr-2 flex-shrink-0">
                        <label for="dontShowAgainCheckbox" class="text-xs sm:text-sm text-gray-600 leading-relaxed">
                            ${t('dontShowAgain')}
                        </label>
                    </div>
                </div>
                
                <div class="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                    <button onclick="BusTrackingUI.cancelTracking()" class="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm sm:text-base order-2 sm:order-1" data-umami-event="cancel-tracking">
                        ${t('cancel')}
                    </button>
                    <button onclick="BusTrackingUI.acceptTrackingDisclaimer('${btoa(JSON.stringify(routeData))}')" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm sm:text-base order-1 sm:order-2" data-umami-event="accept-tracking-disclaimer">
                        ${t('iUnderstand')}
                    </button>
                </div>
            </div>
        `;
        
        // Close modal when clicking outside
        modal.onclick = (event) => {
            if (event.target === modal) {
                this.cancelTracking();
            }
        };
        
        return modal;
    }

    // Show pin route modal
    static showPinRouteModal(routeData) {
        const modal = this.createPinRouteModal(routeData);
        document.body.appendChild(modal);
        modal.classList.remove('hidden');
    }

    // Create pin route modal
    static createPinRouteModal(routeData) {
        const modal = document.createElement('div');
        modal.id = 'pinRouteModal';
        modal.className = 'fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4';
        
        // Auto-detect route available days
        const availableDays = BusTrackingHandler.detectRouteAvailableDays(routeData);
        const dayTypeText = this.formatDayTypeText(availableDays);
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <div class="p-4 sm:p-6">
                    <div class="flex items-start mb-4">
                        <i class="fas fa-thumbtack text-green-500 text-xl sm:text-2xl mr-3 mt-0.5"></i>
                        <h2 class="text-lg sm:text-xl font-semibold text-gray-800 leading-tight">${t('pinRouteTitle')}</h2>
                    </div>
                    
                    <div class="mb-4">
                        <h3 class="font-medium text-gray-700 mb-2 text-sm sm:text-base">${t('routeDetails', 'Route Details')}</h3>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <div class="flex items-center mb-2">
                                <i class="fas fa-bus text-gray-500 mr-2"></i>
                                <span class="font-medium text-sm sm:text-base">${routeData.routeNumber}</span>
                            </div>
                            <div class="text-xs sm:text-sm text-gray-600 leading-relaxed mb-2">
                                ${routeData.origin} → ${routeData.destination}
                            </div>
                            <div class="flex items-center text-xs text-blue-600">
                                <i class="fas fa-calendar-alt mr-1"></i>
                                <span>${t('availableOn', 'Available on')}: ${dayTypeText}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-green-50 border-l-4 border-green-400 p-3 sm:p-4 mb-4">
                        <h4 class="font-medium text-green-800 mb-1 text-sm sm:text-base">${t('autoTrackingTitle', 'Smart Auto-Tracking')}</h4>
                        <p class="text-xs sm:text-sm text-green-700 mb-2">
                            ${t('autoTrackingDescription', 'This route will be automatically tracked on all days it operates.')}
                        </p>
                        <div class="text-xs text-green-600">
                            <i class="fas fa-magic mr-1"></i>
                            ${t('smartScheduling', 'Smart scheduling based on route availability')}
                        </div>
                    </div>
                    
                    <div class="bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4">
                        <h4 class="font-medium text-blue-800 mb-1 text-sm sm:text-base">${t('pinnedRouteFeatures')}</h4>
                        <ul class="text-xs sm:text-sm text-blue-700 space-y-1">
                            <li>• ${t('autoTrackingFeature')}</li>
                            <li>• ${t('homepageWidgetFeature')}</li>
                            <li>• ${t('smartNotificationsFeature')}</li>
                            <li>• ${t('dayAwareTracking', 'Day-aware countdown calculations')}</li>
                        </ul>
                    </div>
                </div>
                
                <div class="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                    <button onclick="BusTrackingUI.cancelPinning()" class="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm sm:text-base order-2 sm:order-1" data-umami-event="cancel-pin-route">
                        ${t('cancel')}
                    </button>
                    <button onclick="BusTrackingUI.confirmPinRoute('${btoa(JSON.stringify(routeData))}')" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm sm:text-base order-1 sm:order-2" data-umami-event="confirm-pin-route">
                        ${t('pinRoute')}
                    </button>
                </div>
            </div>
        `;
        
        // Close modal when clicking outside
        modal.onclick = (event) => {
            if (event.target === modal) {
                this.cancelPinning();
            }
        };
        
        return modal;
    }

    // Show journey tracking disclaimer modal (specific for step-by-step directions)
    static showJourneyTrackingDisclaimer(routeData) {
        const modal = this.createJourneyTrackingDisclaimerModal(routeData);
        document.body.appendChild(modal);
        modal.classList.remove('hidden');
    }

    // Create journey tracking disclaimer modal
    static createJourneyTrackingDisclaimerModal(routeData) {
        const modal = document.createElement('div');
        modal.id = 'journeyTrackingDisclaimerModal';
        modal.className = 'fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div class="p-4 sm:p-6">
                    <div class="flex items-start mb-4">
                        <i class="fas fa-exclamation-triangle text-yellow-500 text-xl sm:text-2xl mr-3 mt-0.5"></i>
                        <h2 class="text-lg sm:text-xl font-semibold text-gray-800 leading-tight">${t('journeyTrackingDisclaimer', 'Journey Tracking Disclaimer')}</h2>
                    </div>
                    
                    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 mb-4">
                        <h3 class="font-semibold text-yellow-800 mb-2 text-sm sm:text-base">${t('estimateOnlyTitle')}</h3>
                        <p class="text-yellow-700 text-xs sm:text-sm leading-relaxed">
                            ${t('journeyEstimateDescription', 'This tracks your specific journey only. Times are estimates based on scheduled timetables and may vary due to traffic, weather, or service changes.')}
                        </p>
                    </div>
                    
                    <div class="space-y-3 text-xs sm:text-sm text-gray-600">
                        <div class="flex items-start">
                            <i class="fas fa-info-circle text-blue-500 mr-2 mt-0.5 flex-shrink-0"></i>
                            <p class="leading-relaxed">${t('journeyTrackingInfo1', 'This will track only this specific journey until completion or 4 hours maximum.')}</p>
                        </div>
                        <div class="flex items-start">
                            <i class="fas fa-clock text-blue-500 mr-2 mt-0.5 flex-shrink-0"></i>
                            <p class="leading-relaxed">${t('journeyTrackingInfo2', 'Departure times are based on the specific time window shown in your directions.')}</p>
                        </div>
                        <div class="flex items-start">
                            <i class="fas fa-phone text-blue-500 mr-2 mt-0.5 flex-shrink-0"></i>
                            <p class="leading-relaxed">${t('trackingInfo3')}</p>
                        </div>
                    </div>
                </div>
                
                <div class="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                    <button onclick="BusTrackingUI.cancelJourneyTracking()" class="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm sm:text-base order-2 sm:order-1" data-umami-event="cancel-journey-tracking">
                        ${t('cancel')}
                    </button>
                    <button onclick="BusTrackingUI.acceptJourneyTrackingDisclaimer('${btoa(JSON.stringify(routeData))}')" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm sm:text-base order-1 sm:order-2" data-umami-event="accept-journey-tracking-disclaimer">
                        ${t('iUnderstand')}
                    </button>
                </div>
            </div>
        `;
        
        // Close modal when clicking outside
        modal.onclick = (event) => {
            if (event.target === modal) {
                this.cancelJourneyTracking();
            }
        };
        
        return modal;
    }

    // Accept tracking disclaimer
    static acceptTrackingDisclaimer(routeDataBase64) {
        const routeData = JSON.parse(atob(routeDataBase64));
        
        // Check if user selected "don't show again"
        const dontShowAgain = document.getElementById('dontShowAgainCheckbox')?.checked;
        if (dontShowAgain) {
            setCookie('trackingDisclaimerAccepted', 'true', 365);
        }
        
        // Start tracking
        BusTrackingHandler.startTracking(routeData);
        
        // Close modal
        this.cancelTracking();
    }

    // Confirm pin route
    static confirmPinRoute(routeDataBase64) {
        const routeData = JSON.parse(atob(routeDataBase64));
        
        // Auto-detect available days (no user selection needed)
        const availableDays = BusTrackingHandler.detectRouteAvailableDays(routeData);
        
        const pinOptions = {
            days: [availableDays]
        };
        
        // Pin the route
        BusTrackingHandler.pinRoute(routeData, pinOptions);
        
        // Close modal
        this.cancelPinning();
    }
    
    // Format day type text for display
    static formatDayTypeText(dayType) {
        switch (dayType) {
            case 'weekday':
                return t('weekdaysOnly', 'Weekdays only');
            case 'weekend':
                return t('weekendsOnly', 'Weekends only');
            case 'both':
                return t('everyDay', 'Every day');
            default:
                return t('unknown', 'Unknown');
        }
    }

    // Cancel tracking
    static cancelTracking() {
        const modal = document.getElementById('trackingDisclaimerModal');
        if (modal) {
            modal.remove();
        }
    }

    // Cancel pinning
    static cancelPinning() {
        const modal = document.getElementById('pinRouteModal');
        if (modal) {
            modal.remove();
        }
    }

    // Check if user should see disclaimer
    static shouldShowDisclaimer() {
        return !getCookie('trackingDisclaimerAccepted');
    }

    // Show pinned route management modal
    static showPinnedRouteManager() {
        const modal = this.createPinnedRouteManagerModal();
        document.body.appendChild(modal);
        modal.classList.remove('hidden');
    }

    // Create pinned route manager modal
    static createPinnedRouteManagerModal() {
        const modal = document.createElement('div');
        modal.id = 'pinnedRouteManagerModal';
        modal.className = 'fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4';
        
        const data = BusTrackingHandler.loadTrackingData();
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
                <div class="flex items-center justify-between p-3 sm:p-4 border-b">
                    <h2 class="text-lg sm:text-xl font-semibold" data-i18n="managePinnedRoutes">Manage Pinned Routes</h2>
                                            <button onclick="BusTrackingUI.closePinnedRouteManager()" class="text-gray-500 hover:text-gray-700 p-1" data-umami-event="close-pinned-route-manager">
                            <i class="fas fa-times text-lg"></i>
                        </button>
                </div>
                
                <div class="p-3 sm:p-4 max-h-80 overflow-y-auto">
                    <div id="pinnedRouteManagerContent">
                        ${data.pinnedRoutes.length === 0 ? 
                            '<p class="text-gray-500 text-center py-4 text-sm sm:text-base" data-i18n="noPinnedRoutes">No pinned routes yet</p>' :
                            data.pinnedRoutes.map(route => this.createPinnedRouteManagerItem(route)).join('')
                        }
                    </div>
                </div>
                
                <div class="p-3 sm:p-4 border-t bg-gray-50">
                    <div class="flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm text-gray-600 space-y-2 sm:space-y-0">
                        <span>
                            <span>${data.pinnedRoutes.length}</span> pinned
                        </span>
                        ${data.pinnedRoutes.length > 0 ? `
                            <button onclick="BusTrackingUI.clearAllPinnedRoutes()" class="text-red-600 hover:text-red-800 text-xs sm:text-sm" data-umami-event="clear-all-pinned-routes">
                                <i class="fas fa-trash mr-1"></i>
                                <span data-i18n="clearAll">Clear All</span>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }

    // Create pinned route manager item
    static createPinnedRouteManagerItem(route) {
        return `
            <div class="border border-gray-200 rounded-lg p-3 mb-3">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center">
                        <i class="fas fa-thumbtack text-green-500 mr-2"></i>
                        <span class="font-medium text-sm sm:text-base">${route.routeNumber}</span>
                    </div>
                                                <button onclick="BusTrackingHandler.showRemovePinnedRouteConfirmation('${route.id}')" class="text-red-500 hover:text-red-700 p-1" data-umami-event="remove-individual-pinned-route">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="text-xs sm:text-sm text-gray-600 mb-2 leading-relaxed">
                    ${route.origin} → ${route.destination}
                </div>
                <div class="text-xs text-gray-500">
                    <span data-i18n="days">Days</span>: ${route.pinnedDays.join(', ')}
                </div>
            </div>
        `;
    }

    // Close pinned route manager
    static closePinnedRouteManager() {
        const modal = document.getElementById('pinnedRouteManagerModal');
        if (modal) {
            modal.remove();
        }
    }

    // Clear all pinned routes
    static clearAllPinnedRoutes() {
        if (confirm(t('confirmClearAllPinned', 'Are you sure you want to remove all pinned routes?'))) {
            const data = BusTrackingHandler.loadTrackingData();
            data.pinnedRoutes = [];
            BusTrackingHandler.saveTrackingData(data);
            BusTrackingHandler.updateHomepageWidget();
            this.closePinnedRouteManager();
        }
    }

    // Update active tracking display with detailed status
    static updateActiveTrackingDisplay() {
        const activeTracking = BusTrackingHandler.getActiveTracking();
        const activeTrackingSection = document.getElementById('activeTrackingSection');
        const activeTrackingList = document.getElementById('activeTrackingList');
        const activeTrackingCount = document.getElementById('activeTrackingCount');
        
        if (!activeTrackingSection || !activeTrackingList || !activeTrackingCount) return;
        
        // Hide section for non-premium users
        if (!BusTrackingHandler.checkPremiumAccess()) {
            activeTrackingSection.style.display = 'none';
            return;
        }
        
        if (activeTracking.length === 0) {
            activeTrackingSection.style.display = 'none';
            return;
        }
        
        // Update count
        const count = activeTracking.length;
        const countText = count === 1 ? 
            '1 ' + (t('trackingCount', '0 routes').replace('0 ', '') || 'route') : 
            `${count} ` + (t('trackingCount', '0 routes').replace('0 ', '') || 'routes');
        activeTrackingCount.textContent = countText;
        
        // Clear and rebuild list with detailed status
        activeTrackingList.innerHTML = '';
        
        activeTracking.forEach(track => {
            const trackingElementHTML = BusTrackingHandler.createActiveTrackingElement(track);
            // Convert HTML string to DOM element
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = trackingElementHTML;
            const trackingElement = tempDiv.firstElementChild;
            
            if (trackingElement) {
                activeTrackingList.appendChild(trackingElement);
            }
        });
        
        activeTrackingSection.style.display = 'block';
        
        // Track analytics
        if (typeof umami !== 'undefined') {
            umami.track('active-tracking-display-updated', {
                count: activeTracking.length
            });
        }
    }

    // Accept journey tracking disclaimer and start tracking
    static acceptJourneyTrackingDisclaimer(routeDataBase64) {
        try {
            const routeData = JSON.parse(atob(routeDataBase64));
            routeData.isJourneySpecific = true; // Mark as journey-specific tracking
            routeData.type = 'journey'; // Set type to journey instead of route
            
            if (BusTrackingHandler.startTracking(routeData)) {
                this.cancelJourneyTracking();
                
                // Track journey tracking accepted
                if (typeof umami !== 'undefined') {
                    umami.track('journey-tracking-accepted', {
                        routeId: routeData.routeId,
                        routeNumber: routeData.routeNumber
                    });
                }
            }
        } catch (error) {
            console.error('Error accepting journey tracking disclaimer:', error);
            this.cancelJourneyTracking();
        }
    }

    // Cancel journey tracking
    static cancelJourneyTracking() {
        const modal = document.getElementById('journeyTrackingDisclaimerModal');
        if (modal) {
            modal.remove();
        }
        
        // Track journey tracking cancelled
        if (typeof umami !== 'undefined') {
            umami.track('journey-tracking-cancelled');
        }
    }

    // Initialize the bus tracking UI
    static init() {
        this.updateActiveTrackingDisplay();
        if (typeof BusTrackingHandler !== 'undefined' && BusTrackingHandler.updatePinnedRoutesDisplay) {
            const data = BusTrackingHandler.loadTrackingData();
            BusTrackingHandler.updatePinnedRoutesDisplay(data.pinnedRoutes);
        }
        
        // Set up periodic updates for real-time status
        if (BusTrackingHandler.startPeriodicUpdates) {
            BusTrackingHandler.startPeriodicUpdates();
        }
        
        // Bus Tracking UI initialized with enhanced status system
    }
}

// Global function to manage pinned routes (called from homepage widget)
function managePinnedRoutes() {
    BusTrackingUI.showPinnedRouteManager();
}

// Make BusTrackingUI globally accessible
window.BusTrackingUI = BusTrackingUI; 