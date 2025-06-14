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
        
        // Start the enhanced periodic update system (runs every minute)
        this.startPeriodicUpdates();
        
        // Clean up expired tracking every 5 minutes
        setInterval(() => this.cleanupExpiredTracking(), 5 * 60 * 1000);
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
            // Track premium required event
            if (typeof umami !== 'undefined') {
                umami.track('tracking-premium-required');
            }
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
            // Track already tracking event
            if (typeof umami !== 'undefined') {
                umami.track('tracking-already-active');
            }
            return false;
        }

        // Check tracking limits
        if (data.activeTracking.length >= this.MAX_ACTIVE_TRACKING) {
            this.showMessage(t('trackingLimitReached', 'Maximum tracking limit reached'), 'warning');
            // Track limit reached event
            if (typeof umami !== 'undefined') {
                umami.track('tracking-limit-reached');
            }
            return false;
        }

        // Create and add new tracking
        const trackedBus = this.createTrackedBus(routeData);
        data.activeTracking.push(trackedBus);
        
        this.saveTrackingData(data);
        this.updateHomepageWidget();

        this.showMessage(t('trackingStarted', 'Bus tracking started'), 'success');
        
        // Track successful tracking start
        if (typeof umami !== 'undefined') {
            umami.track('tracking-started', {
                routeId: routeData.routeId,
                routeNumber: routeData.routeNumber,
                origin: routeData.origin,
                destination: routeData.destination
            });
        }
        
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
    static timeStringToMinutes(timeStr) {
        if (!timeStr || typeof timeStr !== 'string') return 0;
        
        // Handle format like "14h30" or "14:30"
        const cleanTime = timeStr.replace('h', ':');
        const parts = cleanTime.split(':');
        
        if (parts.length !== 2) return 0;
        
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        
        if (isNaN(hours) || isNaN(minutes)) return 0;
        
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

    // Update countdown displays and all time-sensitive content
    static updateCountdownDisplays() {
        const data = this.loadTrackingData();
        let hasUpdates = false;
        
        // Update active tracking countdowns and check for expired tracking
        data.activeTracking.forEach((track, index) => {
            // Recalculate next departure time
            const newNextDeparture = this.calculateNextDeparture(track.allStops, track.origin, track.searchDay);
            if (newNextDeparture !== track.nextDeparture) {
                track.nextDeparture = newNextDeparture;
                hasUpdates = true;
            }
            
            // Recalculate estimated arrival
            const newEstimatedArrival = this.calculateEstimatedArrival(track.allStops, track.origin, track.destination, track.nextDeparture);
            if (newEstimatedArrival && newEstimatedArrival !== track.estimatedArrival) {
                track.estimatedArrival = newEstimatedArrival;
                hasUpdates = true;
            }
            
            // Update countdown
            const countdown = this.calculateCountdown(track.nextDeparture);
            if (countdown !== track.countdown) {
                track.countdown = countdown;
                hasUpdates = true;
            }
            
            // Update status based on time
            const now = Date.now();
            if (now > track.expiresAt) {
                track.status = 'expired';
                hasUpdates = true;
            }
        });
        
        // Update pinned routes countdowns
        data.pinnedRoutes.forEach(route => {
            // Recalculate next departure for pinned routes
            const newNextDeparture = this.calculateNextDeparture(route.allStops, route.origin, route.searchDay);
            if (newNextDeparture !== route.nextDeparture) {
                route.nextDeparture = newNextDeparture;
                hasUpdates = true;
            }
            
            // Recalculate estimated arrival
            const newEstimatedArrival = this.calculateEstimatedArrival(route.allStops, route.origin, route.destination, route.nextDeparture);
            if (newEstimatedArrival && newEstimatedArrival !== route.estimatedArrival) {
                route.estimatedArrival = newEstimatedArrival;
                hasUpdates = true;
            }
            
            // Update countdown
            const countdown = this.calculateCountdown(route.nextDeparture);
            if (countdown !== route.countdown) {
                route.countdown = countdown;
                hasUpdates = true;
            }
        });
        
        // Only save and update UI if there were actual changes
        if (hasUpdates) {
            this.saveTrackingData(data);
            this.updateHomepageWidget();
            this.updateTrackingElementsInDOM(data);
        }
        
        // Clean up expired tracking
        this.cleanupExpiredTracking();
    }

    // Update tracking elements in the DOM with new time information
    static updateTrackingElementsInDOM(data) {
        // Update active tracking elements
        data.activeTracking.forEach(track => {
            const trackElement = document.querySelector(`[data-tracking-id="${track.id}"]`);
            if (trackElement) {
                this.updateTrackingElementContent(trackElement, track);
            }
        });
        
        // Update pinned route elements
        data.pinnedRoutes.forEach(route => {
            const routeElement = document.querySelector(`[data-pinned-id="${route.id}"]`);
            if (routeElement) {
                this.updatePinnedRouteElementContent(routeElement, route);
            }
        });
        
        // Update active tracking count
        const countElement = document.getElementById('activeTrackingCount');
        if (countElement) {
            const activeCount = data.activeTracking.filter(track => track.status !== 'expired').length;
            countElement.textContent = `${activeCount} ${activeCount === 1 ? t('route', 'route') : t('routes', 'routes')}`;
        }
    }

    // Update individual tracking element content
    static updateTrackingElementContent(element, track) {
        if (!element || !track) return false;
        
        const busStatus = this.calculateBusStatus(track);
        const statusIcon = this.getStatusIcon(busStatus);
        const statusColor = this.getStatusColor(busStatus);
        
        // Update status indicator
        const statusIndicator = element.querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.textContent = busStatus.statusText;
            statusIndicator.className = `status-indicator px-2 py-1 rounded-full text-xs font-medium ${statusColor} bg-gray-100`;
        }
        
        // Update icon
        const iconElement = element.querySelector('i');
        if (iconElement) {
            iconElement.className = statusIcon;
        }
        
        // Update countdown
        const countdownElement = element.querySelector('.countdown-display');
        if (countdownElement) {
            const oldCountdown = countdownElement.textContent;
            countdownElement.textContent = busStatus.countdown;
            
            // Add visual feedback for urgent situations
            if (busStatus.timeToNextStop <= 2 && busStatus.status === 'active') {
                countdownElement.classList.add('text-red-600', 'font-bold', 'animate-pulse');
            } else if (busStatus.timeToNextStop <= 5 && busStatus.status === 'active') {
                countdownElement.classList.add('text-orange-600', 'font-semibold');
                countdownElement.classList.remove('text-red-600', 'font-bold', 'animate-pulse');
            } else {
                countdownElement.classList.remove('text-red-600', 'text-orange-600', 'font-bold', 'font-semibold', 'animate-pulse');
            }
            
            return oldCountdown !== busStatus.countdown;
        }
        
        return false;
    }

    // Update individual pinned route element content
    static updatePinnedRouteElementContent(element, route) {
        // Update countdown display
        const countdownElement = element.querySelector('.countdown-display');
        if (countdownElement && route.countdown) {
            countdownElement.textContent = route.countdown;
            
            // Add visual styling based on time
            countdownElement.className = 'countdown-display text-xs font-medium';
            if (route.countdown.includes('Departing soon') || route.countdown.includes('minute')) {
                countdownElement.classList.add('text-red-600', 'animate-pulse');
            } else if (route.countdown.includes('minutes') && parseInt(route.countdown) <= 10) {
                countdownElement.classList.add('text-orange-600');
            } else {
                countdownElement.classList.add('text-green-600');
            }
        }
        
        // Update next departure time
        const departureElement = element.querySelector('.next-departure');
        if (departureElement && route.nextDeparture) {
            departureElement.textContent = route.nextDeparture;
        }
        
        // Update estimated arrival time
        const arrivalElement = element.querySelector('.estimated-arrival');
        if (arrivalElement && route.estimatedArrival) {
            arrivalElement.textContent = route.estimatedArrival;
        }
    }

    // Enhanced periodic update system
    static startPeriodicUpdates() {
        // Clear any existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Start new interval that runs every minute
        this.updateInterval = setInterval(() => {
            try {
                // Only update if user has premium access and there's tracking data
                if (this.checkPremiumAccess()) {
                    const data = this.loadTrackingData();
                    if (data.activeTracking.length > 0 || data.pinnedRoutes.length > 0) {
                        this.updateCountdownDisplays();
                        
                        // Track periodic update event (only once per hour to avoid spam)
                        const now = Date.now();
                        const lastTracked = this.lastPeriodicTrack || 0;
                        if (now - lastTracked > 60 * 60 * 1000) { // 1 hour
                            if (typeof umami !== 'undefined') {
                                umami.track('tracking-periodic-update', {
                                    activeTracking: data.activeTracking.length,
                                    pinnedRoutes: data.pinnedRoutes.length
                                });
                            }
                            this.lastPeriodicTrack = now;
                        }
                    }
                }
            } catch (error) {
                console.error('Error in periodic tracking update:', error);
            }
        }, 60000); // 60 seconds = 1 minute
        
        // Also run an immediate update
        this.updateCountdownDisplays();
    }

    // Stop periodic updates
    static stopPeriodicUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // Pin a route for daily tracking
    static pinRoute(routeData, pinOptions) {
        if (!this.checkPremiumAccess()) {
            showPricingModal();
            // Track premium required event
            if (typeof umami !== 'undefined') {
                umami.track('pin-route-premium-required');
            }
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
            // Track already pinned event
            if (typeof umami !== 'undefined') {
                umami.track('pin-route-already-pinned');
            }
            return false;
        }

        // Check pinned routes limit
        if (data.pinnedRoutes.length >= this.MAX_PINNED_ROUTES) {
            this.showMessage(t('pinnedLimitReached', 'Maximum pinned routes limit reached'), 'warning');
            // Track limit reached event
            if (typeof umami !== 'undefined') {
                umami.track('pin-route-limit-reached');
            }
            return false;
        }

        // Create and add pinned route
        const pinnedRoute = this.createTrackedBus(routeData, true);
        pinnedRoute.pinnedDays = pinOptions.days || ['weekday'];
        pinnedRoute.autoTrackTime = pinOptions.autoTrackTime || '08:00';
        
        data.pinnedRoutes.push(pinnedRoute);
        this.saveTrackingData(data);
        this.updateHomepageWidget();

        this.showMessage(t('routePinned', 'Route pinned successfully'), 'success');
        
        // Track successful pin
        if (typeof umami !== 'undefined') {
            umami.track('route-pinned', {
                routeId: routeData.routeId,
                routeNumber: routeData.routeNumber,
                origin: routeData.origin,
                destination: routeData.destination,
                pinnedDays: pinnedRoute.pinnedDays.join(','),
                autoTrackTime: pinnedRoute.autoTrackTime
            });
        }
        
        return true;
    }

    // Remove a pinned route
    static removePinnedRoute(pinnedId) {
        const data = this.loadTrackingData();
        const routeIndex = data.pinnedRoutes.findIndex(route => route.id === pinnedId);
        
        if (routeIndex !== -1) {
            const removedRoute = data.pinnedRoutes[routeIndex];
            data.pinnedRoutes.splice(routeIndex, 1);
            this.saveTrackingData(data);
            this.updateHomepageWidget();
            
            // Track removal
            if (typeof umami !== 'undefined') {
                umami.track('pinned-route-removed', {
                    routeId: removedRoute.routeId,
                    routeNumber: removedRoute.routeNumber
                });
            }
            
            return true;
        }
        return false;
    }

    // Remove active tracking
    static removeTracking(trackingId) {
        const data = this.loadTrackingData();
        const trackingIndex = data.activeTracking.findIndex(track => track.id === trackingId);
        
        if (trackingIndex !== -1) {
            const removedTracking = data.activeTracking[trackingIndex];
            data.activeTracking.splice(trackingIndex, 1);
            this.saveTrackingData(data);
            this.updateHomepageWidget();
            
            // Track removal
            if (typeof umami !== 'undefined') {
                umami.track('tracking-removed', {
                    routeId: removedTracking.routeId,
                    routeNumber: removedTracking.routeNumber
                });
            }
            
            return true;
        }
        return false;
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

    // Update active tracking section
    static updateActiveTrackingSection(activeTracking) {
        const container = document.getElementById('activeTrackingList');
        const section = document.getElementById('activeTrackingSection');
        const countElement = document.getElementById('activeTrackingCount');
        
        if (!container || !section || !countElement) return;

        if (activeTracking.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        
        // Update count text
        const count = activeTracking.length;
        const countText = count === 1 ? 
            t('trackingCountSingular', '1 route') : 
            t('trackingCountPlural', '{count} routes').replace('{count}', count);
        countElement.textContent = countText;
        
        // Clear and populate container
        container.innerHTML = '';
        activeTracking.forEach(track => {
            const trackElementHTML = this.createActiveTrackingElement(track);
            // Convert HTML string to DOM element
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = trackElementHTML;
            const trackElement = tempDiv.firstElementChild;
            
            if (trackElement) {
                container.appendChild(trackElement);
            }
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
        element.setAttribute('data-pinned-id', route.id);
        element.innerHTML = `
            <div class="flex-1" onclick="BusTrackingHandler.showRouteDetails('${route.id}', 'pinned')" data-umami-event="view-pinned-route-details">
                <div class="flex items-center mb-1">
                    <div class="status-indicator w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <i class="fas fa-thumbtack text-yellow-300 mr-2"></i>
                    <span class="font-medium">${route.routeNumber}</span>
                </div>
                <div class="text-sm opacity-90 mb-1">
                    ${route.origin} → ${route.destination}
                </div>
                <div class="text-xs opacity-75 flex items-center space-x-2">
                    <span class="countdown-display">${countdownText}</span>
                    <span class="text-gray-400">•</span>
                    <span class="next-departure">${route.nextDeparture || '--:--'}</span>
                    ${route.estimatedArrival ? `<span class="text-gray-400">→</span><span class="estimated-arrival">${route.estimatedArrival}</span>` : ''}
                </div>
            </div>
            <button onclick="BusTrackingHandler.removePinnedRoute('${route.id}')" class="text-red-400 hover:text-red-300 ml-2 p-1" data-umami-event="remove-pinned-route">
                <i class="fas fa-times"></i>
            </button>
        `;
        return element;
    }

    static createActiveTrackingElement(track) {
        const busStatus = this.calculateBusStatus(track);
        const statusIcon = this.getStatusIcon(busStatus);
        const statusColor = this.getStatusColor(busStatus);
        
        // Handle undefined route name
        const routeName = track.routeName || track.routeId || '';
        const displayTitle = routeName ? `${track.routeNumber}` : track.routeNumber;
        
        return `
            <div class="bg-white border border-gray-200 rounded-lg p-3 mb-2 shadow-sm" data-tracking-id="${track.id}">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center flex-1 min-w-0">
                        <div class="mr-3">
                            <i class="${statusIcon}"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between mb-1">
                                <h4 class="font-semibold text-sm text-gray-800 truncate">
                                    ${displayTitle}
                                </h4>
                                <span class="status-indicator px-2 py-1 rounded-full text-xs font-medium ${statusColor} bg-gray-100">
                                    ${busStatus.statusText}
                                </span>
                            </div>
                            <p class="text-xs text-gray-600 truncate mb-1">
                                ${track.origin} → ${track.destination}
                            </p>
                            
                            <!-- Detailed Status Information -->
                            <div class="text-xs space-y-1">
                                ${busStatus.currentStop && busStatus.status !== 'completed' ? `
                                    <div class="flex items-center text-gray-700">
                                        <i class="fas fa-map-marker-alt mr-1 text-blue-500"></i>
                                        <span><strong>${t('current', 'Current')}:</strong> ${busStatus.currentStop.name.split(' - ')[0]}</span>
                                    </div>
                                ` : ''}
                                
                                ${busStatus.nextStop && busStatus.timeToNextStop > 0 && busStatus.status !== 'completed' ? `
                                    <div class="flex items-center text-gray-700">
                                        <i class="fas fa-arrow-right mr-1 text-green-500"></i>
                                        <span><strong>${t('next', 'Next')}:</strong> ${busStatus.nextStop.name.split(' - ')[0]} 
                                        (${this.formatTimeRemaining(busStatus.timeToNextStop)})</span>
                                    </div>
                                ` : ''}
                                
                                ${busStatus.timeToDestination > 0 && busStatus.status !== 'completed' ? `
                                    <div class="flex items-center text-gray-700">
                                        <i class="fas fa-flag-checkered mr-1 text-red-500"></i>
                                        <span><strong>${t('destination', 'Destination')}:</strong> ${this.formatTimeRemaining(busStatus.timeToDestination)}</span>
                                    </div>
                                ` : ''}
                                
                                ${busStatus.progress > 0 && busStatus.status !== 'completed' ? `
                                    <div class="mt-2">
                                        <div class="flex justify-between text-xs text-gray-600 mb-1">
                                            <span>${t('progress', 'Progress')}</span>
                                            <span>${busStatus.progress}%</span>
                                        </div>
                                        <div class="w-full bg-gray-200 rounded-full h-1.5">
                                            <div class="bg-green-500 h-1.5 rounded-full transition-all duration-300" 
                                                 style="width: ${busStatus.progress}%"></div>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div class="text-xs text-gray-600">
                        <span class="countdown-display">${busStatus.countdown}</span>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="BusTrackingHandler.viewTrackingDetails('${track.id}')" 
                                class="text-blue-500 hover:text-blue-700 text-xs"
                                data-umami-event="view-active-tracking-details">
                            <i class="fas fa-info-circle mr-1"></i>${t('details', 'Details')}
                        </button>
                        <button onclick="BusTrackingHandler.confirmStopTracking('${track.id}')" 
                                class="text-red-500 hover:text-red-700 text-xs"
                                data-umami-event="stop-tracking-confirmation">
                            <i class="fas fa-stop mr-1"></i>${t('stop', 'Stop')}
                        </button>
                    </div>
                </div>
            </div>
        `;
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

    // Confirm stop tracking with detailed modal
    static confirmStopTracking(trackingId) {
        const activeTracking = this.getActiveTracking();
        const track = activeTracking.find(t => t.id === trackingId);
        
        if (!track) {
            this.showMessage(t('trackingNotFound', 'Tracking not found'), 'error');
            return;
        }
        
        // Handle undefined route name
        const routeName = track.routeName || track.routeId || '';
        const displayTitle = routeName ? `${track.routeNumber} - ${routeName}` : track.routeNumber;
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-sm mx-auto relative">
                <div class="text-center mb-4">
                    <i class="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-3"></i>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">${t('stopTrackingQuestion', 'Stop Tracking?')}</h3>
                    <p class="text-gray-600 text-sm">
                        ${t('stopTrackingConfirmation', 'Are you sure you want to stop tracking this route?')}
                    </p>
                    <div class="bg-gray-50 rounded-lg p-2 mt-3">
                        <p class="text-xs text-gray-700">
                            <strong>${displayTitle}</strong><br>
                            ${track.origin} → ${track.destination}
                        </p>
                    </div>
                </div>
                
                <div class="flex space-x-2">
                    <button onclick="BusTrackingHandler.stopTracking('${trackingId}'); this.parentElement.parentElement.parentElement.remove();" 
                            class="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition duration-300">
                        ${t('yesStop', 'Yes, Stop')}
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            class="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition duration-300">
                        ${t('cancel', 'Cancel')}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Calculate detailed bus status for active tracking
    static calculateBusStatus(track) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        // Get all stops with times in chronological order
        const allStopsArray = Object.entries(track.allStops).map(([stop, time]) => ({
            name: stop,
            time: time,
            timeInMinutes: this.timeStringToMinutes(time)
        })).sort((a, b) => a.timeInMinutes - b.timeInMinutes);
        
        // Find user's origin and destination stops in the route
        const originStopIndex = allStopsArray.findIndex(stop => 
            this.stopMatchesOrigin(stop.name, track.origin)
        );
        const destinationStopIndex = allStopsArray.findIndex(stop => 
            this.stopMatchesOrigin(stop.name, track.destination)
        );
        
        if (originStopIndex === -1 || destinationStopIndex === -1) {
            return this.getBasicStatus(track);
        }
        
        // Get the route segment the user cares about
        const userRouteStops = allStopsArray.slice(originStopIndex, destinationStopIndex + 1);
        
        // Determine current bus status
        const firstStopTime = userRouteStops[0].timeInMinutes;
        const lastStopTime = userRouteStops[userRouteStops.length - 1].timeInMinutes;
        
        // Check if bus hasn't started yet
        if (currentTime < firstStopTime) {
            const minutesUntilStart = firstStopTime - currentTime;
            return {
                status: 'waiting',
                statusText: t('waitingToStart', 'Waiting to start'),
                currentStop: null,
                nextStop: userRouteStops[0],
                timeToNextStop: minutesUntilStart,
                timeToDestination: lastStopTime - currentTime,
                progress: 0,
                isActive: false,
                detailedInfo: t('busNotStarted', 'Bus has not started this route yet'),
                countdown: this.formatTimeRemaining(minutesUntilStart, 'departure')
            };
        }
        
        // Check if bus has finished the route
        if (currentTime > lastStopTime) {
            return {
                status: 'completed',
                statusText: t('routeCompleted', 'Route completed'),
                currentStop: userRouteStops[userRouteStops.length - 1],
                nextStop: null,
                timeToNextStop: 0,
                timeToDestination: 0,
                progress: 100,
                isActive: false,
                detailedInfo: t('busCompleted', 'Bus has completed this route'),
                countdown: t('routeFinished', 'Route finished')
            };
        }
        
        // Bus is currently active - find current position
        let currentStopIndex = 0;
        let nextStopIndex = 1;
        
        // Find the current segment based on time
        for (let i = 0; i < userRouteStops.length - 1; i++) {
            const currentStopTime = userRouteStops[i].timeInMinutes;
            const nextStopTime = userRouteStops[i + 1].timeInMinutes;
            
            if (currentTime >= currentStopTime && currentTime < nextStopTime) {
                currentStopIndex = i;
                nextStopIndex = i + 1;
                break;
            }
        }
        
        // If we're past the last stop time, bus is at destination
        if (currentTime >= userRouteStops[userRouteStops.length - 1].timeInMinutes) {
            currentStopIndex = userRouteStops.length - 1;
            nextStopIndex = userRouteStops.length - 1;
        }
        
        const currentStop = userRouteStops[currentStopIndex];
        const nextStop = nextStopIndex < userRouteStops.length ? userRouteStops[nextStopIndex] : null;
        
        // Calculate times
        const timeToNextStop = nextStop ? Math.max(0, nextStop.timeInMinutes - currentTime) : 0;
        const timeToDestination = Math.max(0, lastStopTime - currentTime);
        
        // Calculate progress percentage
        const totalRouteTime = lastStopTime - firstStopTime;
        const elapsedTime = currentTime - firstStopTime;
        const progress = Math.min(100, Math.max(0, (elapsedTime / totalRouteTime) * 100));
        
        // Determine detailed status
        let statusText, detailedInfo;
        
        if (timeToNextStop <= 2) {
            statusText = t('arrivingSoon', 'Arriving soon');
            detailedInfo = nextStop ? 
                t('arrivingAtStop', 'Arriving at {stop}').replace('{stop}', nextStop.name.split(' - ')[0]) :
                t('arrivingAtDestination', 'Arriving at destination');
        } else if (timeToNextStop <= 5) {
            statusText = t('approaching', 'Approaching');
            detailedInfo = nextStop ? 
                t('approachingStop', 'Approaching {stop}').replace('{stop}', nextStop.name.split(' - ')[0]) :
                t('approachingDestination', 'Approaching destination');
        } else {
            statusText = t('enRoute', 'En route');
            detailedInfo = nextStop ? 
                t('headingToStop', 'Heading to {stop}').replace('{stop}', nextStop.name.split(' - ')[0]) :
                t('headingToDestination', 'Heading to destination');
        }
        
        return {
            status: 'active',
            statusText: statusText,
            currentStop: currentStop,
            nextStop: nextStop,
            timeToNextStop: timeToNextStop,
            timeToDestination: timeToDestination,
            progress: Math.round(progress),
            isActive: true,
            detailedInfo: detailedInfo,
            countdown: this.formatTimeRemaining(timeToDestination, 'arrival'),
            allStopsInRoute: userRouteStops,
            currentStopIndex: currentStopIndex,
            totalStops: userRouteStops.length
        };
    }
    
    // Get basic status when detailed calculation fails
    static getBasicStatus(track) {
        const countdown = this.calculateCountdown(track.nextDeparture);
        return {
            status: 'unknown',
            statusText: t('trackingActive', 'Tracking active'),
            currentStop: null,
            nextStop: null,
            timeToNextStop: 0,
            timeToDestination: 0,
            progress: 0,
            isActive: true,
            detailedInfo: t('basicTracking', 'Basic tracking information'),
            countdown: countdown || t('scheduleUnavailable', 'Schedule unavailable')
        };
    }
    
    // Format time remaining with context
    static formatTimeRemaining(minutes, context = 'general') {
        if (minutes <= 0) {
            return context === 'arrival' ? t('arrived', 'Arrived') : t('departingSoon', 'Departing soon');
        }
        
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            const hourText = hours === 1 ? t('hour', 'hour') : t('hours', 'hours');
            const minuteText = mins === 1 ? t('minute', 'minute') : t('minutes', 'minutes');
            
            if (mins === 0) {
                return `${hours} ${hourText}`;
            } else {
                return `${hours} ${hourText} ${mins} ${minuteText}`;
            }
        } else {
            const minuteText = mins === 1 ? t('minute', 'minute') : t('minutes', 'minutes');
            return `${mins} ${minuteText}`;
        }
    }
    
    // Get status icon based on bus status
    static getStatusIcon(status) {
        switch (status.status) {
            case 'waiting':
                return 'fas fa-clock text-blue-500';
            case 'active':
                if (status.timeToNextStop <= 2) {
                    return 'fas fa-map-marker-alt text-red-500 animate-pulse';
                } else if (status.timeToNextStop <= 5) {
                    return 'fas fa-location-arrow text-orange-500';
                } else {
                    return 'fas fa-bus text-green-500';
                }
            case 'completed':
                return 'fas fa-check-circle text-gray-500';
            default:
                return 'fas fa-question-circle text-gray-400';
        }
    }
    
    // Get status color based on urgency
    static getStatusColor(status) {
        switch (status.status) {
            case 'waiting':
                return 'text-blue-600';
            case 'active':
                if (status.timeToNextStop <= 2) {
                    return 'text-red-600';
                } else if (status.timeToNextStop <= 5) {
                    return 'text-orange-600';
                } else {
                    return 'text-green-600';
                }
            case 'completed':
                return 'text-gray-600';
            default:
                return 'text-gray-500';
        }
    }

    // Helper method to check if a stop matches the origin/destination
    static stopMatchesOrigin(stopName, targetLocation) {
        if (!stopName || !targetLocation) return false;
        
        const stopLower = stopName.toLowerCase();
        const targetLower = targetLocation.toLowerCase();
        
        // Direct match
        if (stopLower.includes(targetLower) || targetLower.includes(stopLower)) {
            return true;
        }
        
        // Check if stop name contains target location words
        const targetWords = targetLower.split(/\s+/);
        const stopWords = stopLower.split(/\s+/);
        
        return targetWords.some(targetWord => 
            targetWord.length > 2 && stopWords.some(stopWord => 
                stopWord.includes(targetWord) || targetWord.includes(stopWord)
            )
        );
    }

    // View detailed tracking information
    static viewTrackingDetails(trackingId) {
        const activeTracking = this.getActiveTracking();
        const track = activeTracking.find(t => t.id === trackingId);
        
        if (!track) {
            this.showMessage(t('trackingNotFound', 'Tracking not found'), 'error');
            return;
        }
        
        const busStatus = this.calculateBusStatus(track);
        
        // Handle undefined route name
        const routeName = track.routeName || track.routeId || '';
        const displayTitle = routeName ? `${track.routeNumber}` : track.routeNumber;
        
        // Create detailed modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-md mx-auto relative max-h-[90vh] overflow-y-auto">
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="text-gray-600 w-full text-right hover:text-gray-800 transition duration-300 ease-in-out mb-2">
                    <i class="fas fa-times text-xl text-right"></i>
                </button>
                
                <div class="text-center mb-4">
                    <i class="${this.getStatusIcon(busStatus)} text-3xl mb-2"></i>
                    <h3 class="text-xl font-semibold text-gray-800 mb-1">
                        ${displayTitle}
                    </h3>
                    <p class="text-gray-600">${track.origin} → ${track.destination}</p>
                </div>
                
                <div class="space-y-3">
                    <div class="bg-gray-50 rounded-lg p-3">
                        <h4 class="font-semibold text-gray-800 mb-2">${t('currentStatus', 'Current Status')}</h4>
                        <div class="flex items-center mb-2">
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${this.getStatusColor(busStatus)} bg-gray-100">
                                ${busStatus.statusText}
                            </span>
                        </div>
                        <p class="text-sm text-gray-700">${busStatus.detailedInfo}</p>
                    </div>
                    
                    ${busStatus.currentStop && busStatus.status !== 'completed' ? `
                        <div class="bg-blue-50 rounded-lg p-3">
                            <h4 class="font-semibold text-blue-800 mb-2">${t('currentLocation', 'Current Location')}</h4>
                            <div class="flex items-center text-blue-700">
                                <i class="fas fa-map-marker-alt mr-2"></i>
                                <span>${busStatus.currentStop.name}</span>
                            </div>
                            <p class="text-xs text-blue-600 mt-1">
                                ${t('stopProgress', 'Stop {current} of {total}').replace('{current}', busStatus.currentStopIndex + 1).replace('{total}', busStatus.totalStops)}
                            </p>
                        </div>
                    ` : ''}
                    
                    ${busStatus.nextStop && busStatus.timeToNextStop > 0 && busStatus.status !== 'completed' ? `
                        <div class="bg-green-50 rounded-lg p-3">
                            <h4 class="font-semibold text-green-800 mb-2">${t('nextStop', 'Next Stop')}</h4>
                            <div class="flex items-center text-green-700 mb-1">
                                <i class="fas fa-arrow-right mr-2"></i>
                                <span>${busStatus.nextStop.name}</span>
                            </div>
                            <p class="text-xs text-green-600">
                                ${t('arrivingIn', 'Arriving in')} ${this.formatTimeRemaining(busStatus.timeToNextStop)}
                            </p>
                        </div>
                    ` : ''}
                    
                    ${busStatus.timeToDestination > 0 && busStatus.status !== 'completed' ? `
                        <div class="bg-red-50 rounded-lg p-3">
                            <h4 class="font-semibold text-red-800 mb-2">${t('finalDestination', 'Final Destination')}</h4>
                            <div class="flex items-center text-red-700 mb-1">
                                <i class="fas fa-flag-checkered mr-2"></i>
                                <span>${track.destination}</span>
                            </div>
                            <p class="text-xs text-red-600">
                                ${t('arrivingIn', 'Arriving in')} ${this.formatTimeRemaining(busStatus.timeToDestination)}
                            </p>
                        </div>
                    ` : ''}
                    
                    ${busStatus.progress > 0 && busStatus.status !== 'completed' ? `
                        <div class="bg-gray-50 rounded-lg p-3">
                            <h4 class="font-semibold text-gray-800 mb-2">${t('routeProgress', 'Route Progress')}</h4>
                            <div class="flex justify-between text-sm text-gray-600 mb-2">
                                <span>${t('progress', 'Progress')}</span>
                                <span>${busStatus.progress}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-green-500 h-2 rounded-full transition-all duration-300" 
                                     style="width: ${busStatus.progress}%"></div>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="mt-6 flex space-x-2">
                    <button onclick="BusTrackingHandler.confirmStopTracking('${trackingId}'); this.parentElement.parentElement.parentElement.remove();" 
                            class="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition duration-300">
                        <i class="fas fa-stop mr-2"></i>${t('stopTracking', 'Stop Tracking')}
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            class="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition duration-300">
                        ${t('close', 'Close')}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Track analytics
        if (typeof umami !== 'undefined') {
            umami.track('view-detailed-tracking-status');
        }
    }

    // Add helper method to get active tracking
    static getActiveTracking() {
        const data = this.loadTrackingData();
        return data.activeTracking || [];
    }
    
    // Add stopTracking method that calls removeTracking
    static stopTracking(trackingId) {
        this.removeTracking(trackingId);
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