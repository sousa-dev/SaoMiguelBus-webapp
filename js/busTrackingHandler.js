// Bus Tracking Handler - Core functionality for tracking buses and pinned routes
class BusTrackingHandler {
    static STORAGE_KEY = 'busTracking';
    static MAX_ACTIVE_TRACKING = 5;
    static MAX_PINNED_ROUTES = 3;
    static TRACKING_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

    // Initialize bus tracking system
    static init() {
        this.checkPremiumAccess();
        this.loadTrackingData();
        this.startAutoTrackingScheduler();
        this.updateHomepageWidget();
        
        // Clean up expired tracking every 5 minutes
        setInterval(() => this.cleanupExpiredTracking(), 5 * 60 * 1000);
        
        // Update countdown displays every minute
        setInterval(() => this.updateCountdownDisplays(), 60 * 1000);
    }

    // Check if user has premium access
    static checkPremiumAccess() {
        return adRemovalState && adRemovalState.isActive;
    }

    // Load tracking data from localStorage
    static loadTrackingData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : this.getDefaultData();
        } catch (error) {
            console.error('Failed to load tracking data:', error);
            return this.getDefaultData();
        }
    }

    // Get default tracking data structure
    static getDefaultData() {
        return {
            activeTracking: [],
            pinnedRoutes: [],
            trackingHistory: [],
            preferences: {
                notificationsEnabled: true,
                defaultTrackingDuration: 4 * 60, // 4 hours in minutes
                maxConcurrentTracks: 5,
                maxPinnedRoutes: 3,
                autoTrackingEnabled: true
            },
            lastCleanup: Date.now()
        };
    }

    // Save tracking data to localStorage
    static saveTrackingData(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save tracking data:', error);
            this.handleStorageError(error);
        }
    }

    // Start tracking a bus route
    static startTracking(routeData) {
        if (!this.checkPremiumAccess()) {
            showPricingModal();
            return false;
        }

        const data = this.loadTrackingData();
        
        // Check if already tracking this route
        const existingTracking = data.activeTracking.find(track => 
            track.routeId === routeData.routeId && 
            track.origin === routeData.origin && 
            track.destination === routeData.destination &&
            track.searchDay === routeData.searchDay
        );

        if (existingTracking) {
            this.showMessage(t('alreadyTracking', 'This route is already being tracked'), 'info');
            return false;
        }

        // Check tracking limits
        if (data.activeTracking.length >= this.MAX_ACTIVE_TRACKING) {
            this.showMessage(t('trackingLimitReached', 'Maximum tracking limit reached'), 'warning');
            return false;
        }

        // Create and add new tracking
        const trackedBus = this.createTrackedBus(routeData);
        data.activeTracking.push(trackedBus);
        
        this.saveTrackingData(data);
        this.updateHomepageWidget();

        this.showMessage(t('trackingStarted', 'Bus tracking started'), 'success');
        return true;
    }

    // Create a new tracked bus object
    static createTrackedBus(routeData, isPinned = false) {
        const now = Date.now();
        const trackingId = `track_${now}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Calculate next departure time
        const nextDeparture = this.calculateNextDeparture(routeData.allStops, routeData.origin, routeData.searchDay);
        
        // Calculate estimated arrival with fallback
        const estimatedArrival = this.calculateEstimatedArrival(routeData.allStops, routeData.origin, routeData.destination, nextDeparture) || '--:--';
        
        return {
            id: trackingId,
            routeId: routeData.routeId,
            routeNumber: routeData.routeNumber,
            origin: routeData.origin,
            destination: routeData.destination,
            searchDay: routeData.searchDay,
            searchDate: routeData.searchDate || new Date().toISOString().split('T')[0],
            allStops: routeData.allStops,
            userStops: this.extractUserStops(routeData.allStops, routeData.origin, routeData.destination),
            nextDeparture: nextDeparture,
            estimatedArrival: estimatedArrival,
            status: isPinned ? 'pinned' : 'active',
            createdAt: now,
            expiresAt: now + this.TRACKING_DURATION,
            type: routeData.type,
            notificationsEnabled: true,
            isPinned: isPinned,
            pinnedDays: isPinned ? routeData.pinnedDays || ['weekday'] : [],
            autoTrackTime: isPinned ? routeData.autoTrackTime || '08:00' : null
        };
    }

    // Calculate next departure time based on current time and schedule
    static calculateNextDeparture(allStops, origin, searchDay) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
        const currentDay = this.getCurrentDayType();
        
        // Extract all departure times from stops
        const departureTimes = this.extractDepartureTimes(allStops, origin);
        
        // If no departure times found, return a fallback
        if (departureTimes.length === 0) {
            // Try to find any time from the stops object as fallback
            const allTimes = Object.values(allStops);
            if (allTimes.length > 0) {
                return allTimes[0]; // Return the first available time
            }
            return '08h00'; // Default fallback time
        }
        
        // Check if today matches the search day
        if (searchDay !== 'both' && currentDay !== searchDay) {
            // Not today, return next occurrence
            return this.getNextOccurrenceTime(allStops, origin, searchDay);
        }
        
        // Find the next departure time today
        for (let time of departureTimes) {
            if (time > currentTime) {
                return this.minutesToTimeString(time);
            }
        }
        
        // No more departures today, return next occurrence
        return this.getNextOccurrenceTime(allStops, origin, searchDay);
    }

    // Get current day type (weekday/weekend)
    static getCurrentDayType() {
        const day = new Date().getDay();
        return (day === 0 || day === 6) ? 'weekend' : 'weekday';
    }

    // Extract departure times from stops object
    static extractDepartureTimes(allStops, origin) {
        const times = [];
        
        // First try to find exact matches
        for (const [stop, time] of Object.entries(allStops)) {
            if (this.stopMatchesOrigin(stop, origin)) {
                const minutes = this.timeStringToMinutes(time);
                if (minutes !== null) {
                    times.push(minutes);
                }
            }
        }
        
        // If no exact matches found, try partial matches
        if (times.length === 0) {
            const originWords = origin.toLowerCase().split(' ').filter(word => word.length > 2);
            for (const [stop, time] of Object.entries(allStops)) {
                const stopWords = stop.toLowerCase().split(' ');
                if (originWords.some(word => stopWords.some(stopWord => stopWord.includes(word)))) {
                    const minutes = this.timeStringToMinutes(time);
                    if (minutes !== null) {
                        times.push(minutes);
                    }
                }
            }
        }
        
        // If still no matches, return all times as fallback
        if (times.length === 0) {
            for (const time of Object.values(allStops)) {
                const minutes = this.timeStringToMinutes(time);
                if (minutes !== null) {
                    times.push(minutes);
                }
            }
        }
        
        return times.sort((a, b) => a - b);
    }

    // Check if stop matches origin
    static stopMatchesOrigin(stop, origin) {
        const stopWords = stop.toLowerCase().split(' ');
        const originWords = origin.toLowerCase().split(' ');
        return originWords.every(word => stopWords.includes(word));
    }

    // Convert time string to minutes (improved)
    static timeStringToMinutes(timeString) {
        if (!timeString || typeof timeString !== 'string') {
            return null;
        }
        
        // Handle different time formats: "08h30", "8:30", "08:30"
        let hours, minutes;
        
        if (timeString.includes('h')) {
            [hours, minutes] = timeString.split('h').map(Number);
        } else if (timeString.includes(':')) {
            [hours, minutes] = timeString.split(':').map(Number);
        } else {
            return null;
        }
        
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return null;
        }
        
        return hours * 60 + minutes;
    }

    // Convert minutes to time string (improved)
    static minutesToTimeString(minutes) {
        if (minutes === null || isNaN(minutes) || minutes < 0) {
            return null;
        }
        
        const hours = Math.floor(minutes / 60) % 24;
        const mins = minutes % 60;
        
        return `${hours.toString().padStart(2, '0')}h${mins.toString().padStart(2, '0')}`;
    }

    // Get next occurrence time for a route
    static getNextOccurrenceTime(allStops, origin, searchDay) {
        const departureTimes = this.extractDepartureTimes(allStops, origin);
        if (departureTimes.length === 0) {
            // Fallback to first available time
            const allTimes = Object.values(allStops);
            return allTimes.length > 0 ? allTimes[0] : '08h00';
        }
        
        // Return the first departure time of the day
        return this.minutesToTimeString(departureTimes[0]);
    }

    // Calculate estimated arrival time
    static calculateEstimatedArrival(allStops, origin, destination, departureTime) {
        const departureMinutes = this.timeStringToMinutes(departureTime);
        const travelTime = this.calculateTravelTime(allStops, origin, destination);
        
        if (departureMinutes === null || travelTime === null) {
            return null;
        }
        
        const arrivalMinutes = departureMinutes + travelTime;
        return this.minutesToTimeString(arrivalMinutes);
    }

    // Calculate travel time between origin and destination
    static calculateTravelTime(allStops, origin, destination) {
        let originTime = null;
        let destinationTime = null;
        let foundOrigin = false;
        
        // Convert stops object to array and sort by time
        const stopsArray = Object.entries(allStops).map(([stop, time]) => ({
            stop,
            time: this.timeStringToMinutes(time),
            originalTime: time
        })).filter(item => item.time !== null).sort((a, b) => a.time - b.time);
        
        for (const stopData of stopsArray) {
            if (this.stopMatchesOrigin(stopData.stop, origin) && !foundOrigin) {
                originTime = stopData.time;
                foundOrigin = true;
            }
            if (this.stopMatchesOrigin(stopData.stop, destination) && foundOrigin) {
                destinationTime = stopData.time;
                break;
            }
        }
        
        if (originTime !== null && destinationTime !== null) {
            return destinationTime - originTime;
        }
        
        return null; // Return null instead of default value
    }

    // Calculate countdown to next departure
    static calculateCountdown(nextDeparture) {
        if (!nextDeparture) return null;
        
        const now = new Date();
        const departureTime = this.parseDepartureTime(nextDeparture);
        const timeDiff = departureTime - now;
        
        if (timeDiff <= 0) return null;
        
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            const hourText = hours === 1 ? t('hour', 'hour') : t('hours', 'hours');
            return t('hoursLeftForDeparture', '{hours} {hourText} left for departure')
                .replace('{hours}', hours)
                .replace('{hourText}', hourText);
        } else if (minutes > 0) {
            const minuteText = minutes === 1 ? t('minute', 'minute') : t('minutes', 'minutes');
            return t('minutesLeftForDeparture', '{minutes} {minuteText} left for departure')
                .replace('{minutes}', minutes)
                .replace('{minuteText}', minuteText);
        } else {
            return t('departingSoon', 'Departing soon');
        }
    }

    // Parse departure time string to Date object
    static parseDepartureTime(departureTime) {
        const [hours, minutes] = departureTime.split('h').map(Number);
        const now = new Date();
        const departure = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        
        // If departure time has passed today, it's for tomorrow
        if (departure <= now) {
            departure.setDate(departure.getDate() + 1);
        }
        
        return departure;
    }

    // Update countdown displays
    static updateCountdownDisplays() {
        const data = this.loadTrackingData();
        
        // Update active tracking countdowns
        data.activeTracking.forEach(track => {
            const countdown = this.calculateCountdown(track.nextDeparture);
            if (countdown) {
                track.countdown = countdown;
            }
        });
        
        // Update pinned routes countdowns
        data.pinnedRoutes.forEach(route => {
            const countdown = this.calculateCountdown(route.nextDeparture);
            if (countdown) {
                route.countdown = countdown;
            }
        });
        
        this.saveTrackingData(data);
        this.updateHomepageWidget();
    }

    // Pin a route for daily tracking
    static pinRoute(routeData, pinOptions) {
        if (!this.checkPremiumAccess()) {
            showPricingModal();
            return false;
        }

        const data = this.loadTrackingData();
        
        // Check if already pinned
        const existingPinned = data.pinnedRoutes.find(route => 
            route.routeId === routeData.routeId && 
            route.origin === routeData.origin && 
            route.destination === routeData.destination
        );

        if (existingPinned) {
            this.showMessage(t('alreadyPinned', 'This route is already pinned'), 'info');
            return false;
        }

        // Check pinned routes limit
        if (data.pinnedRoutes.length >= this.MAX_PINNED_ROUTES) {
            this.showMessage(t('pinnedLimitReached', 'Maximum pinned routes limit reached'), 'warning');
            return false;
        }

        // Create pinned route
        const pinnedRoute = this.createTrackedBus({
            ...routeData,
            pinnedDays: pinOptions.days,
            autoTrackTime: pinOptions.autoTrackTime
        }, true);

        data.pinnedRoutes.push(pinnedRoute);
        this.saveTrackingData(data);
        this.updateHomepageWidget();

        this.showMessage(t('routePinned', 'Route pinned for daily tracking'), 'success');
        return true;
    }

    // Remove pinned route
    static removePinnedRoute(pinnedId) {
        const data = this.loadTrackingData();
        
        data.pinnedRoutes = data.pinnedRoutes.filter(route => route.id !== pinnedId);
        
        this.saveTrackingData(data);
        this.updateHomepageWidget();
        
        this.showMessage(t('pinnedRouteRemoved', 'Pinned route removed'), 'success');
    }

    // Remove tracking
    static removeTracking(trackingId) {
        const data = this.loadTrackingData();
        
        data.activeTracking = data.activeTracking.filter(track => track.id !== trackingId);
        
        this.saveTrackingData(data);
        this.updateHomepageWidget();
    }

    // Update homepage widget
    static updateHomepageWidget() {
        const data = this.loadTrackingData();
        const widget = document.getElementById('busTrackingWidget');
        
        // Update active tracking section (now separate from widget)
        this.updateActiveTrackingSection(data.activeTracking);
        
        // Update pinned routes widget
        if (!widget) return;

        const hasPinnedRoutes = data.pinnedRoutes.length > 0;
        
        if (hasPinnedRoutes) {
            widget.classList.remove('hidden');
            this.updatePinnedRoutesDisplay(data.pinnedRoutes);
        } else {
            widget.classList.add('hidden');
        }
    }

    // Update active tracking section (separate from widget)
    static updateActiveTrackingSection(activeTracking) {
        const section = document.getElementById('activeTrackingSection');
        const container = document.getElementById('activeTrackingList');
        const countElement = document.getElementById('activeTrackingCount');
        
        if (!section || !container || !countElement) return;

        if (activeTracking.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        
        // Update count with proper i18n
        const count = activeTracking.length;
        countElement.textContent = count === 1 ? 
            t('trackingCountSingular', '1 route') : 
            t('trackingCountPlural', '{count} routes').replace('{count}', count);
        
        // Clear and populate container
        container.innerHTML = '';
        activeTracking.forEach(track => {
            const trackElement = this.createActiveTrackingElement(track);
            container.appendChild(trackElement);
        });
    }

    // Update pinned routes display
    static updatePinnedRoutesDisplay(pinnedRoutes) {
        const container = document.getElementById('pinnedRoutesList');
        const section = document.getElementById('pinnedRoutesSection');
        
        if (!container || !section) return;

        if (pinnedRoutes.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        container.innerHTML = '';

        pinnedRoutes.forEach(route => {
            const routeElement = this.createPinnedRouteElement(route);
            container.appendChild(routeElement);
        });
    }

    // Update active tracking display (legacy method - now handled by updateActiveTrackingSection)
    static updateActiveTrackingDisplay(activeTracking) {
        this.updateActiveTrackingSection(activeTracking);
    }

    // Helper functions
    static extractUserStops(allStops, origin, destination) {
        return allStops; // Simplified for now
    }

    static createPinnedRouteElement(route) {
        const countdown = this.calculateCountdown(route.nextDeparture);
        const countdownText = countdown || t('scheduleUnavailable', 'Schedule unavailable');
        const element = document.createElement('div');
        element.className = 'bg-white bg-opacity-20 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-opacity-30 transition-all duration-200';
        element.innerHTML = `
            <div class="flex-1" onclick="BusTrackingHandler.showRouteDetails('${route.id}', 'pinned')">
                <div class="flex items-center mb-1">
                    <i class="fas fa-thumbtack text-yellow-300 mr-2"></i>
                    <span class="font-medium">${route.routeNumber}</span>
                </div>
                <div class="text-sm opacity-90 mb-1">
                    ${route.origin} → ${route.destination}
                </div>
                <div class="text-xs opacity-75">
                    ${countdownText}
                </div>
            </div>
            <button onclick="BusTrackingHandler.removePinnedRoute('${route.id}')" class="text-red-400 hover:text-red-300 ml-2 p-1">
                <i class="fas fa-times"></i>
            </button>
        `;
        return element;
    }

    static createActiveTrackingElement(track) {
        const countdown = this.calculateCountdown(track.nextDeparture);
        const countdownText = countdown || t('scheduleUnavailable', 'Schedule unavailable');
        const element = document.createElement('div');
        element.className = 'bg-gray-50 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-all duration-200 border border-gray-200';
        element.innerHTML = `
            <div class="flex-1" onclick="BusTrackingHandler.showRouteDetails('${track.id}', 'active')">
                <div class="flex items-center mb-1">
                    <div class="bg-green-500 rounded-full p-1 mr-2">
                        <i class="fas fa-bus text-white text-sm"></i>
                    </div>
                    <span class="font-semibold text-gray-800">${track.routeNumber}</span>
                </div>
                <div class="text-sm text-gray-600 mb-1">
                    ${track.origin} → ${track.destination}
                </div>
                <div class="text-xs text-gray-500">
                    ${countdownText}
                </div>
            </div>
            <button onclick="BusTrackingHandler.showStopTrackingConfirmation('${track.id}')" class="text-red-500 hover:text-red-700 ml-2 p-2 rounded-full hover:bg-red-50 transition-all duration-200">
                <i class="fas fa-times"></i>
            </button>
        `;
        return element;
    }

    static startAutoTrackingScheduler() {
        // Auto-tracking scheduler will be implemented in Phase 4
        console.log('Auto-tracking scheduler initialized');
    }

    static cleanupExpiredTracking() {
        const data = this.loadTrackingData();
        const now = Date.now();
        
        // Remove expired active tracking
        data.activeTracking = data.activeTracking.filter(track => track.expiresAt > now);
        
        // Move completed tracking to history
        const completedTracking = data.activeTracking.filter(track => {
            const departureTime = this.parseDepartureTime(track.nextDeparture);
            return departureTime < now;
        });
        
        data.trackingHistory.push(...completedTracking);
        data.activeTracking = data.activeTracking.filter(track => {
            const departureTime = this.parseDepartureTime(track.nextDeparture);
            return departureTime >= now;
        });
        
        this.saveTrackingData(data);
    }

    static handleStorageError(error) {
        console.error('Storage error:', error);
    }

    static showMessage(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    // Show route details modal
    static showRouteDetails(routeId, type) {
        const data = this.loadTrackingData();
        const routes = type === 'pinned' ? data.pinnedRoutes : data.activeTracking;
        const route = routes.find(r => r.id === routeId);
        
        if (!route) return;
        
        const modal = this.createRouteDetailsModal(route, type);
        document.body.appendChild(modal);
        modal.classList.remove('hidden');
    }

    // Create route details modal
    static createRouteDetailsModal(route, type) {
        const modal = document.createElement('div');
        modal.id = 'routeDetailsModal';
        modal.className = 'fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4';
        
        // Format all stops for display
        const stopsList = this.formatStopsForDisplay(route.allStops);
        const countdown = this.calculateCountdown(route.nextDeparture);
        const countdownText = countdown || t('scheduleUnavailable', 'Schedule unavailable');
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div class="p-4 sm:p-6">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-start">
                            <i class="fas ${type === 'pinned' ? 'fa-thumbtack text-green-500' : 'fa-bus text-blue-500'} text-xl sm:text-2xl mr-3 mt-0.5"></i>
                            <div>
                                <h2 class="text-lg sm:text-xl font-semibold text-gray-800 leading-tight">${route.routeNumber}</h2>
                                <p class="text-sm text-gray-600">${route.origin} → ${route.destination}</p>
                            </div>
                        </div>
                        <button onclick="BusTrackingHandler.closeRouteDetails()" class="text-gray-500 hover:text-gray-700 p-1">
                            <i class="fas fa-times text-lg"></i>
                        </button>
                    </div>
                    
                    <!-- Countdown Section -->
                    <div class="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-400 p-3 sm:p-4 mb-4 rounded-r-lg">
                        <div class="flex items-center">
                            <i class="fas fa-clock text-blue-500 mr-2"></i>
                            <span class="font-medium text-blue-800">${countdownText}</span>
                        </div>
                    </div>
                    
                    <!-- Route Information -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">${t('nextDeparture', 'Next Departure')}</div>
                            <div class="font-semibold text-gray-800">${route.nextDeparture}</div>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">${t('estimatedArrival', 'Estimated Arrival')}</div>
                            <div class="font-semibold text-gray-800">${route.estimatedArrival}</div>
                        </div>
                    </div>
                    
                    <!-- All Stops Section -->
                    <div class="mb-4">
                        <h3 class="text-sm sm:text-base font-semibold text-gray-700 mb-3 flex items-center">
                            <i class="fas fa-map-marker-alt text-gray-500 mr-2"></i>
                            ${t('allStops', 'All Stops')}
                        </h3>
                        <div class="bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto">
                            <div class="space-y-2">
                                ${stopsList.map((stop, index) => `
                                    <div class="flex items-center justify-between py-1 ${index === 0 ? 'border-b border-gray-200 pb-2' : ''} ${index === stopsList.length - 1 ? 'border-t border-gray-200 pt-2' : ''}">
                                        <div class="flex items-center">
                                            <div class="w-2 h-2 rounded-full ${index === 0 ? 'bg-green-500' : index === stopsList.length - 1 ? 'bg-red-500' : 'bg-blue-500'} mr-3"></div>
                                            <span class="text-sm text-gray-700">${stop.name}</span>
                                        </div>
                                        <span class="text-sm font-medium text-gray-800">${stop.time}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Additional Info -->
                    <div class="bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4 rounded-r-lg">
                        <h4 class="font-medium text-blue-800 mb-2 text-sm sm:text-base">${t('trackingInfo', 'Tracking Information')}</h4>
                        <div class="text-xs sm:text-sm text-blue-700 space-y-1">
                            <div class="flex items-center">
                                <i class="fas fa-calendar text-blue-500 mr-2"></i>
                                <span>${t('trackingDay', 'Day')}: ${this.formatDayType(route.searchDay)}</span>
                            </div>
                            ${type === 'pinned' ? `
                                <div class="flex items-center">
                                    <i class="fas fa-thumbtack text-blue-500 mr-2"></i>
                                    <span>${t('pinnedDays', 'Pinned Days')}: ${route.pinnedDays.join(', ')}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t flex justify-end">
                    <button onclick="BusTrackingHandler.closeRouteDetails()" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm sm:text-base">
                        ${t('close', 'Close')}
                    </button>
                </div>
            </div>
        `;
        
        // Close modal when clicking outside
        modal.onclick = (event) => {
            if (event.target === modal) {
                this.closeRouteDetails();
            }
        };
        
        return modal;
    }

    // Format stops for display
    static formatStopsForDisplay(allStops) {
        return Object.entries(allStops).map(([stop, time]) => ({
            name: stop,
            time: time
        }));
    }

    // Format day type for display
    static formatDayType(dayType) {
        switch (dayType) {
            case 'weekday': return t('weekday', 'Weekday');
            case 'weekend': return t('weekend', 'Weekend');
            case 'both': return t('everyDay', 'Every Day');
            default: return this.formatDate(dayType);
        }
    }

    // Format date for display
    static formatDate(timestamp) {
        const date = new Date(timestamp);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const time = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
        return `${day}/${month}/${year} ${time}`;
    }

    // Close route details modal
    static closeRouteDetails() {
        const modal = document.getElementById('routeDetailsModal');
        if (modal) {
            modal.remove();
        }
    }

    // Show confirmation modal for stopping tracking
    static showStopTrackingConfirmation(trackingId) {
        const data = this.loadTrackingData();
        const track = data.activeTracking.find(t => t.id === trackingId);
        
        if (!track) return;
        
        const modal = document.createElement('div');
        modal.id = 'stopTrackingModal';
        modal.className = 'fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg w-full max-w-sm mx-auto">
                <div class="p-6">
                    <div class="flex items-center mb-4">
                        <div class="bg-red-100 rounded-full p-2 mr-3">
                            <i class="fas fa-exclamation-triangle text-red-500 text-lg"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-800">${t('stopTrackingTitle', 'Stop Tracking')}</h3>
                    </div>
                    <p class="text-gray-600 mb-6">
                        ${t('stopTrackingMessage', 'Are you sure you want to stop tracking this route?')}
                    </p>
                    <div class="bg-gray-50 rounded-lg p-3 mb-4">
                        <div class="flex items-center">
                            <i class="fas fa-bus text-blue-500 mr-2"></i>
                            <span class="font-medium">${track.routeNumber}</span>
                        </div>
                        <div class="text-sm text-gray-600 mt-1">
                            ${track.origin} → ${track.destination}
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="BusTrackingHandler.closeStopTrackingModal()" class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200">
                            ${t('cancel', 'Cancel')}
                        </button>
                        <button onclick="BusTrackingHandler.confirmStopTracking('${trackingId}')" class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200">
                            ${t('stopTracking', 'Stop Tracking')}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Close modal when clicking outside
        modal.onclick = (event) => {
            if (event.target === modal) {
                this.closeStopTrackingModal();
            }
        };
        
        document.body.appendChild(modal);
    }

    // Close stop tracking confirmation modal
    static closeStopTrackingModal() {
        const modal = document.getElementById('stopTrackingModal');
        if (modal) {
            modal.remove();
        }
    }

    // Confirm stop tracking
    static confirmStopTracking(trackingId) {
        this.removeTracking(trackingId);
        this.closeStopTrackingModal();
        this.showMessage(t('trackingStopped', 'Tracking stopped'), 'success');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (typeof adRemovalState !== 'undefined') {
            BusTrackingHandler.init();
        }
    }, 1000);
});

// Make handler globally accessible
window.BusTrackingHandler = BusTrackingHandler; 