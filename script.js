// coding: utf-8
class ModernYouTubeApp {
    constructor() {
        this.API_KEY = 'AIzaSyCC0F6nmwpMoxt4bghLAaxUwo2V4QwxuLI';
        this.BASE_URL = 'https://www.googleapis.com/youtube/v3';
        this.currentPlayer = null;
        this.currentVideoData = null;
        this.currentSection = 'home';
        this.currentView = 'grid';
        this.favorites = JSON.parse(localStorage.getItem('youtube-favorites') || '[]');
        this.history = JSON.parse(localStorage.getItem('youtube-history') || '[]');
        this.playlist = JSON.parse(localStorage.getItem('youtube-playlist') || '[]');
        this.isDarkMode = localStorage.getItem('youtube-dark-mode') === 'true';
        this.isAutoplay = localStorage.getItem('youtube-autoplay') !== 'false';
        this.videoQuality = localStorage.getItem('youtube-quality') || 'auto';
        this.isLoggedIn = localStorage.getItem('youtube-logged-in') === 'true';
        this.userEmail = localStorage.getItem('youtube-user-email') || null;
        
        this.initializeElements();
        this.bindEvents();
        this.setupTheme();
        this.updateLoginStatus();
        this.loadTrendingVideos();
        this.updateBadges();
        this.setupKeyboardShortcuts();
        this.handleResize(); // Initialize responsive behavior
    }

    initializeElements() {
        // Basic elements
        this.searchInput = document.getElementById('searchInput');
        this.searchButton = document.getElementById('searchButton');
        this.loadingContainer = document.getElementById('loadingContainer');
        this.videoGrid = document.getElementById('videoGrid');
        this.emptyState = document.getElementById('emptyState');

        // Sidebar elements
        this.sidebar = document.getElementById('sidebar');
        this.menuButton = document.getElementById('menuButton');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.navItems = document.querySelectorAll('.nav-item[data-section]');
        this.themeToggle = document.getElementById('themeToggle');
        this.mobileThemeToggle = document.getElementById('mobileThemeToggle');
        this.loginButton = document.getElementById('loginButton');
        this.logo = document.querySelector('.logo');

        // Header elements
        this.mainContent = document.querySelector('.main-content');
        this.voiceSearch = document.getElementById('voiceSearch');
        this.searchFilters = document.getElementById('searchFilters');
        this.durationFilter = document.getElementById('durationFilter');
        this.sortFilter = document.getElementById('sortFilter');
        this.settingsButton = document.getElementById('settingsButton');

        // Content elements
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.viewButtons = document.querySelectorAll('.view-button');

        // Modal elements
        this.playerModal = document.getElementById('playerModal');
        this.playlistModal = document.getElementById('playlistModal');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeButtons = document.querySelectorAll('.close-button');

        // Player elements
        this.videoTitle = document.getElementById('videoTitle');
        this.videoChannel = document.getElementById('videoChannel');
        this.videoViews = document.getElementById('videoViews');
        this.videoDate = document.getElementById('videoDate');
        this.videoDescription = document.getElementById('videoDescription');
        this.favoriteButton = document.getElementById('favoriteButton');
        this.playlistAddButton = document.getElementById('playlistAddButton');
        this.shareButton = document.getElementById('shareButton');
        this.openYouTubeButton = document.getElementById('openYouTubeButton');
        

        // Settings elements
        this.autoplayToggle = document.getElementById('autoplayToggle');
        this.qualitySelect = document.getElementById('qualitySelect');

        // Other elements
        this.toastContainer = document.getElementById('toastContainer');
        this.scrollToTop = document.getElementById('scrollToTop');
        this.favoritesBadge = document.getElementById('favoritesBadge');
        this.playlistBadge = document.getElementById('playlistBadge');
    }

    bindEvents() {
        // Search events
        this.searchButton.addEventListener('click', () => this.handleSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        this.searchInput.addEventListener('input', () => {
            const hasQuery = this.searchInput.value.trim().length > 0;
            this.searchFilters.classList.toggle('active', hasQuery);
        });
        this.searchInput.addEventListener('paste', (e) => {
            setTimeout(() => this.handlePaste(), 100);
        });

        // Voice search
        this.voiceSearch.addEventListener('click', () => this.startVoiceSearch());

        // Filter events
        this.durationFilter.addEventListener('change', () => this.searchVideos());
        this.sortFilter.addEventListener('change', () => this.searchVideos());

        // Sidebar events
        this.menuButton.addEventListener('click', () => this.toggleSidebar());
        this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.mobileThemeToggle.addEventListener('click', () => this.toggleTheme());
        this.loginButton.addEventListener('click', () => this.handleLogin());
        this.logo.addEventListener('click', () => this.goToHome());

        // Navigation events
        this.navItems.forEach(item => {
            item.addEventListener('click', () => this.switchSection(item.dataset.section));
        });

        // Tab and view events
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTab(button.dataset.tab));
        });
        this.viewButtons.forEach(button => {
            button.addEventListener('click', () => this.switchView(button.dataset.view));
        });

        // Modal events
        this.closeButtons.forEach(button => {
            button.addEventListener('click', () => this.closeAllModals());
        });

        // Player action events
        this.favoriteButton.addEventListener('click', () => this.toggleFavorite());
        this.playlistAddButton.addEventListener('click', () => this.showPlaylistModal());
        this.shareButton.addEventListener('click', () => this.shareVideo());
        this.openYouTubeButton.addEventListener('click', () => this.openInYouTube());
        

        // Settings events
        this.settingsButton.addEventListener('click', () => this.showSettingsModal());
        this.autoplayToggle.addEventListener('change', () => this.toggleAutoplay());
        this.qualitySelect.addEventListener('change', () => this.changeQuality());

        // Scroll events
        window.addEventListener('scroll', () => this.handleScroll());
        this.scrollToTop.addEventListener('click', () => this.scrollToTopAction());

        // Modal close on outside click
        [this.playerModal, this.playlistModal, this.settingsModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeAllModals();
            });
        });
        
        // Close sidebar on overlay click (mobile)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 && !this.sidebar.classList.contains('collapsed')) {
                if (!this.sidebar.contains(e.target) && !this.menuButton.contains(e.target)) {
                    this.sidebar.classList.add('collapsed');
                }
            }
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    setupTheme() {
        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.themeToggle.querySelector('.toggle-switch').classList.add('active');
            this.themeToggle.querySelector('.material-icons-round').textContent = 'light_mode';
            this.mobileThemeToggle.querySelector('.material-icons-round').textContent = 'light_mode';
        } else {
            this.themeToggle.querySelector('.material-icons-round').textContent = 'dark_mode';
            this.mobileThemeToggle.querySelector('.material-icons-round').textContent = 'dark_mode';
        }
    }

    setupKeyboardShortcuts() {
        this.shortcuts = {
            'Space': () => this.togglePlayPause(),
            'KeyF': () => this.toggleFullscreen(),
            'KeyM': () => this.toggleMute(),
            'Escape': () => this.closeAllModals(),
            'Slash': () => this.focusSearch(),
            'KeyK': () => this.togglePlayPause()
        };
    }

    handleKeyboard(e) {
        // Don't handle shortcuts if user is typing
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if (e.key === 'Escape') {
                e.target.blur();
            }
            return;
        }

        const handler = this.shortcuts[e.code] || this.shortcuts[e.key];
        if (handler) {
            e.preventDefault();
            handler();
        }
    }

    async startVoiceSearch() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showToast('Tarayıcınız sesli aramayı desteklemiyor.', 'error');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'tr-TR';
        recognition.continuous = false;
        recognition.interimResults = false;

        this.voiceSearch.style.backgroundColor = 'var(--accent-primary)';
        this.voiceSearch.style.color = 'white';

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.searchInput.value = transcript;
            this.searchVideos();
        };

        recognition.onerror = () => {
            this.showToast('Sesli arama hatası oluştu.', 'error');
        };

        recognition.onend = () => {
            this.voiceSearch.style.backgroundColor = '';
            this.voiceSearch.style.color = '';
        };

        recognition.start();
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('collapsed');
        
        // On mobile, always keep main content expanded
        if (window.innerWidth <= 1024) {
            this.mainContent.classList.add('expanded');
            this.menuButton.style.display = 'block';
        } else {
            this.mainContent.classList.toggle('expanded');
            // Update menu button visibility based on screen size
            this.menuButton.style.display = this.sidebar.classList.contains('collapsed') ? 'block' : 'none';
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('youtube-dark-mode', this.isDarkMode);
        
        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.themeToggle.querySelector('.toggle-switch').classList.add('active');
            this.themeToggle.querySelector('.material-icons-round').textContent = 'light_mode';
            this.mobileThemeToggle.querySelector('.material-icons-round').textContent = 'light_mode';
        } else {
            document.documentElement.removeAttribute('data-theme');
            this.themeToggle.querySelector('.toggle-switch').classList.remove('active');
            this.themeToggle.querySelector('.material-icons-round').textContent = 'dark_mode';
            this.mobileThemeToggle.querySelector('.material-icons-round').textContent = 'dark_mode';
        }
    }

    switchSection(section) {
        this.currentSection = section;
        
        // Update active nav item
        this.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        // Load content based on section
        switch (section) {
            case 'home':
                this.loadTrendingVideos();
                break;
            case 'trending':
                this.loadTrendingVideos();
                break;
            case 'favorites':
                this.displayFavorites();
                break;
            case 'history':
                this.displayHistory();
                break;
            case 'playlist':
                this.displayPlaylist();
                break;
        }
    }

    switchTab(tab) {
        this.tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tab);
        });
        
        // Handle tab switching logic here
        switch(tab) {
            case 'videos':
                if (this.searchInput.value.trim()) {
                    this.searchVideos();
                } else {
                    this.loadTrendingVideos();
                }
                break;
            case 'channels':
                this.searchChannels();
                break;
            case 'playlists':
                this.searchPlaylists();
                break;
            default:
                this.showToast(`${tab} sekmesine geçildi.`, 'success');
        }
    }

    switchView(view) {
        this.currentView = view;
        this.viewButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.view === view);
        });
        
        this.videoGrid.classList.toggle('list-view', view === 'list');
        document.querySelectorAll('.video-card').forEach(card => {
            card.classList.toggle('list-view', view === 'list');
        });
    }

    handleScroll() {
        const scrolled = window.scrollY > 300;
        this.scrollToTop.classList.toggle('visible', scrolled);
    }

    scrollToTopAction() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    handleResize() {
        if (window.innerWidth <= 1024) {
            this.sidebar.classList.add('collapsed');
            this.mainContent.classList.add('expanded');
            this.menuButton.style.display = 'block';
        } else {
            // On desktop, show menu button only if sidebar is collapsed
            this.menuButton.style.display = this.sidebar.classList.contains('collapsed') ? 'block' : 'none';
            if (!this.sidebar.classList.contains('collapsed')) {
                this.sidebar.classList.remove('collapsed');
                this.mainContent.classList.remove('expanded');
            }
        }
    }

    showLoading() {
        this.loadingContainer.classList.remove('hidden');
        this.videoGrid.style.display = 'none';
        this.emptyState.style.display = 'none';
    }

    hideLoading() {
        this.loadingContainer.classList.add('hidden');
        this.videoGrid.style.display = 'grid';
    }

    showEmpty(message = 'Henüz video yok') {
        this.loadingContainer.classList.add('hidden');
        this.videoGrid.style.display = 'none';
        this.emptyState.style.display = 'block';
        this.emptyState.querySelector('h3').textContent = message;
    }

    async makeAPIRequest(endpoint, params) {
        try {
            const url = new URL(`${this.BASE_URL}/${endpoint}`);
            url.search = new URLSearchParams({
                ...params,
                key: this.API_KEY
            });

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    async searchVideos() {
        const query = this.searchInput.value.trim();
        if (!query) return;

        try {
            this.showLoading();
            
            const params = {
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults: 20,
                order: this.sortFilter.value || 'relevance'
            };

            // Add duration filter
            const duration = this.durationFilter.value;
            if (duration) {
                params.videoDuration = duration;
            }

            const data = await this.makeAPIRequest('search', params);
            
            if (data.items && data.items.length > 0) {
                // Get video details to filter out shorts
                const videoIds = data.items.map(item => item.id.videoId).join(',');
                const videoDetails = await this.makeAPIRequest('videos', {
                    part: 'contentDetails',
                    id: videoIds
                });
                
                // Filter out Shorts videos
                const filteredVideos = data.items.filter(video => {
                    const details = videoDetails.items?.find(detail => detail.id === video.id.videoId);
                    if (!details?.contentDetails?.duration) return true;
                    const duration = this.parseDuration(details.contentDetails.duration);
                    return duration > 60; // Only show videos longer than 60 seconds
                });
                
                this.displayVideos(filteredVideos);
            } else {
                this.showEmpty('Arama sonucu bulunamadı');
            }
        } catch (error) {
            console.error('Video search error:', error);
            this.showToast('Video arama sırasında bir hata oluştu.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadTrendingVideos() {
        try {
            this.showLoading();
            const data = await this.makeAPIRequest('videos', {
                part: 'snippet,contentDetails,statistics',
                chart: 'mostPopular',
                maxResults: 50,
                regionCode: 'TR'
            });

            // Filter out Shorts videos (videos shorter than 61 seconds)
            const filteredVideos = data.items.filter(video => {
                if (!video.contentDetails?.duration) return true;
                const duration = this.parseDuration(video.contentDetails.duration);
                return duration > 60; // Only show videos longer than 60 seconds
            });

            this.displayVideos(filteredVideos.slice(0, 20));
        } catch (error) {
            console.error('Trending videos loading error:', error);
            this.showToast('Videolar yüklenirken bir hata oluştu.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async searchChannels() {
        const query = this.searchInput.value.trim();
        if (!query) {
            this.showEmpty('Kanal aramak için bir arama terimi girin');
            return;
        }

        try {
            this.showLoading();
            
            const params = {
                part: 'snippet',
                q: query,
                type: 'channel',
                maxResults: 20,
                order: this.sortFilter.value || 'relevance'
            };

            const data = await this.makeAPIRequest('search', params);
            
            if (data.items && data.items.length > 0) {
                this.displayChannels(data.items);
            } else {
                this.showEmpty('Kanal bulunamadı');
            }
        } catch (error) {
            console.error('Channel search error:', error);
            this.showToast('Kanal arama sırasında bir hata oluştu.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async searchPlaylists() {
        const query = this.searchInput.value.trim();
        if (!query) {
            this.showEmpty('Oynatma listesi aramak için bir arama terimi girin');
            return;
        }

        try {
            this.showLoading();
            
            const params = {
                part: 'snippet',
                q: query,
                type: 'playlist',
                maxResults: 20,
                order: this.sortFilter.value || 'relevance'
            };

            const data = await this.makeAPIRequest('search', params);
            
            if (data.items && data.items.length > 0) {
                this.displayPlaylists(data.items);
            } else {
                this.showEmpty('Oynatma listesi bulunamadı');
            }
        } catch (error) {
            console.error('Playlist search error:', error);
            this.showToast('Oynatma listesi arama sırasında bir hata oluştu.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    displayChannels(channels) {
        this.videoGrid.innerHTML = '';
        
        channels.forEach(channel => {
            const channelCard = this.createChannelCard(channel);
            this.videoGrid.appendChild(channelCard);
        });

        if (this.currentView === 'list') {
            this.videoGrid.classList.add('list-view');
        }
    }

    displayPlaylists(playlists) {
        this.videoGrid.innerHTML = '';
        
        playlists.forEach(playlist => {
            const playlistCard = this.createPlaylistCard(playlist);
            this.videoGrid.appendChild(playlistCard);
        });

        if (this.currentView === 'list') {
            this.videoGrid.classList.add('list-view');
        }
    }

    createChannelCard(channel) {
        const card = document.createElement('div');
        card.className = 'video-card channel-card';
        if (this.currentView === 'list') {
            card.classList.add('list-view');
        }
        
        const thumbnailUrl = channel.snippet.thumbnails.medium?.url || channel.snippet.thumbnails.default.url;
        
        card.innerHTML = `
            <div class="thumbnail-container">
                <img src="${thumbnailUrl}" alt="${channel.snippet.title}" class="thumbnail channel-thumbnail" loading="lazy">
            </div>
            <div class="video-content">
                <h3 class="video-title">${channel.snippet.title}</h3>
                <p class="video-channel">${channel.snippet.description || 'Kanal açıklaması mevcut değil'}</p>
            </div>
        `;

        card.addEventListener('click', () => {
            const channelUrl = `https://www.youtube.com/channel/${channel.id.channelId}`;
            window.open(channelUrl, '_blank');
        });

        return card;
    }

    createPlaylistCard(playlist) {
        const card = document.createElement('div');
        card.className = 'video-card playlist-card';
        if (this.currentView === 'list') {
            card.classList.add('list-view');
        }
        
        const thumbnailUrl = playlist.snippet.thumbnails.medium?.url || playlist.snippet.thumbnails.default.url;
        
        card.innerHTML = `
            <div class="thumbnail-container">
                <img src="${thumbnailUrl}" alt="${playlist.snippet.title}" class="thumbnail" loading="lazy">
                <div class="playlist-indicator">
                    <span class="material-icons-round">playlist_play</span>
                </div>
            </div>
            <div class="video-content">
                <h3 class="video-title">${playlist.snippet.title}</h3>
                <p class="video-channel">${playlist.snippet.channelTitle}</p>
                <p class="video-views">${playlist.snippet.description || 'Açıklama mevcut değil'}</p>
            </div>
        `;

        card.addEventListener('click', () => {
            const playlistUrl = `https://www.youtube.com/playlist?list=${playlist.id.playlistId}`;
            window.open(playlistUrl, '_blank');
        });

        return card;
    }

    displayVideos(videos) {
        this.videoGrid.innerHTML = '';
        
        videos.forEach(video => {
            const videoCard = this.createVideoCard(video);
            this.videoGrid.appendChild(videoCard);
        });

        if (this.currentView === 'list') {
            this.videoGrid.classList.add('list-view');
        }
    }

    displayFavorites() {
        if (this.favorites.length === 0) {
            this.showEmpty('Henüz favori video eklenmemiş');
            return;
        }

        this.videoGrid.innerHTML = '';
        this.favorites.forEach(video => {
            const videoCard = this.createVideoCard(video);
            this.videoGrid.appendChild(videoCard);
        });
        this.hideLoading();
    }

    displayHistory() {
        if (this.history.length === 0) {
            this.showEmpty('Henüz video geçmişi yok');
            return;
        }

        this.videoGrid.innerHTML = '';
        this.history.slice().reverse().forEach(video => {
            const videoCard = this.createVideoCard(video);
            this.videoGrid.appendChild(videoCard);
        });
        this.hideLoading();
    }

    displayPlaylist() {
        if (this.playlist.length === 0) {
            this.showEmpty('Oynatma listesi boş');
            return;
        }

        this.videoGrid.innerHTML = '';
        this.playlist.forEach(video => {
            const videoCard = this.createVideoCard(video);
            this.videoGrid.appendChild(videoCard);
        });
        this.hideLoading();
    }

    createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'video-card';
        if (this.currentView === 'list') {
            card.classList.add('list-view');
        }
        
        const thumbnailUrl = video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default.url;
        const duration = video.contentDetails?.duration ? this.formatDuration(video.contentDetails.duration) : '';
        const viewCount = video.statistics?.viewCount ? this.formatViewCount(video.statistics.viewCount) : '';
        const publishedAt = this.formatDate(video.snippet.publishedAt);
        
        card.innerHTML = `
            <div class="thumbnail-container">
                <img src="${thumbnailUrl}" alt="${video.snippet.title}" class="thumbnail" loading="lazy">
                ${duration ? `<div class="duration">${duration}</div>` : ''}
            </div>
            <div class="video-content">
                <h3 class="video-title">${video.snippet.title}</h3>
                <p class="video-channel">${video.snippet.channelTitle}</p>
                <p class="video-views">
                    ${viewCount ? `${viewCount} görüntülenme` : ''}
                    ${viewCount && publishedAt ? ' • ' : ''}
                    ${publishedAt}
                </p>
            </div>
        `;

        card.addEventListener('click', (e) => {
            const videoId = video.id.videoId || video.id;
            
            // Alt+Click veya Ctrl+Click ile direkt YouTube'da aç
            if (e.altKey || e.ctrlKey) {
                const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
                window.open(youtubeUrl, '_blank');
            } else {
                this.openVideoPlayer(videoId, video);
            }
        });

        return card;
    }

    parseDuration(duration) {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return 0;
        
        const hours = parseInt((match[1] || '').replace('H', '')) || 0;
        const minutes = parseInt((match[2] || '').replace('M', '')) || 0;
        const seconds = parseInt((match[3] || '').replace('S', '')) || 0;
        
        return hours * 3600 + minutes * 60 + seconds;
    }

    formatDuration(duration) {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return '';
        
        const hours = (match[1] || '').replace('H', '');
        const minutes = (match[2] || '').replace('M', '');
        const seconds = (match[3] || '').replace('S', '');
        
        let formatted = '';
        if (hours) formatted += hours + ':';
        formatted += (minutes || '0').padStart(2, '0') + ':';
        formatted += (seconds || '0').padStart(2, '0');
        
        return formatted;
    }

    formatViewCount(count) {
        const num = parseInt(count);
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toLocaleString('tr-TR');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return '1 gün önce';
        if (diffDays < 7) return `${diffDays} gün önce`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} ay önce`;
        return `${Math.floor(diffDays / 365)} yıl önce`;
    }

    openVideoPlayer(videoId, videoData) {
        this.currentVideoData = videoData;
        this.addToHistory(videoData);
        
        this.videoTitle.textContent = videoData.snippet.title;
        this.videoChannel.textContent = videoData.snippet.channelTitle;
        
        if (videoData.statistics?.viewCount) {
            this.videoViews.textContent = `${this.formatViewCount(videoData.statistics.viewCount)} görüntülenme`;
        }
        
        this.videoDate.textContent = this.formatDate(videoData.snippet.publishedAt);
        this.videoDescription.textContent = videoData.snippet.description || 'Açıklama mevcut değil.';

        // Update favorite button
        const isFavorite = this.favorites.some(fav => (fav.id.videoId || fav.id) === videoId);
        this.favoriteButton.classList.toggle('active', isFavorite);
        this.favoriteButton.querySelector('.material-icons-round').textContent = 
            isFavorite ? 'favorite' : 'favorite_border';

        this.playerModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Try to load player, but provide fallback
        try {
            this.showToast('Video yükleniyor...', 'info');
            this.loadYouTubePlayer(videoId);
        } catch (error) {
            console.error('Failed to load player:', error);
            this.showToast('Video yüklenemedi. Alternatif yöntemler deneniyor...', 'warning');
            setTimeout(() => {
                const playerContainer = document.getElementById('videoPlayer');
                this.tryAlternativeHost(videoId, playerContainer);
            }, 1000);
        }
    }

    loadYouTubePlayer(videoId) {
        // Check if YouTube API is available
        if (!window.YT || !window.YT.Player) {
            console.error('YouTube API not loaded yet');
            this.showToast('YouTube API yüklenmedi. Lütfen tekrar deneyin.', 'error');
            return;
        }

        if (this.currentPlayer) {
            try {
                if (typeof this.currentPlayer.destroy === 'function') {
                    this.currentPlayer.destroy();
                }
            } catch (error) {
                console.warn('Error destroying previous player:', error);
            }
            this.currentPlayer = null;
        }

        const playerContainer = document.getElementById('videoPlayer');
        playerContainer.innerHTML = '';

        // İlk olarak alternatif embedding yöntemini dene
        this.tryAlternativeEmbedding(videoId, playerContainer);
    }

    tryAlternativeEmbedding(videoId, container) {
        // Method 1: Direct iframe with nocookie domain
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1&rel=0&showinfo=0&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=1`;
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.style.border = 'none';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        iframe.loading = 'lazy';
        
        iframe.onload = () => {
            console.log('Alternative iframe loaded successfully');
        };
        
        iframe.onerror = () => {
            console.log('Alternative iframe failed, trying YouTube API');
            this.tryYouTubeAPI(videoId, container);
        };

        // Iframe yüklenme başarısızlığını kontrol et
        setTimeout(() => {
            if (!iframe.contentDocument && !iframe.contentWindow) {
                console.log('Iframe blocked, trying YouTube API');
                container.innerHTML = '';
                this.tryYouTubeAPI(videoId, container);
            }
        }, 3000);

        container.appendChild(iframe);
    }

    tryYouTubeAPI(videoId, container) {
        try {
            this.currentPlayer = new YT.Player(container, {
                height: '100%',
                width: '100%',
                videoId: videoId,
                host: 'https://www.youtube-nocookie.com',
                playerVars: {
                    'playsinline': 1,
                    'rel': 0,
                    'modestbranding': 1,
                    'autoplay': 0,
                    'controls': 1,
                    'disablekb': 0,
                    'enablejsapi': 1,
                    'fs': 1,
                    'iv_load_policy': 3,
                    'cc_load_policy': 0,
                    'showinfo': 0,
                    'origin': window.location.protocol + '//' + window.location.host
                },
                events: {
                    'onReady': (event) => {
                        console.log('YouTube API Player ready');
                        if (this.isAutoplay) {
                            try {
                                if (typeof event.target.playVideo === 'function') {
                                    event.target.playVideo();
                                }
                            } catch (error) {
                                console.warn('Auto-play failed:', error);
                            }
                        }
                    },
                    'onStateChange': this.onPlayerStateChange.bind(this),
                    'onError': (event) => {
                        console.error('YouTube API Player error:', event.data);
                        this.handlePlayerError(event.data, videoId, container);
                    }
                }
            });
        } catch (error) {
            console.error('YouTube API failed:', error);
            this.tryFallbackMethod(videoId, container);
        }
    }

    tryFallbackMethod(videoId, container) {
        // Method 3: Proxy/embed alternative
        container.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #000; color: white;">
                <div style="text-align: center; padding: 20px;">
                    <span class="material-icons-round" style="font-size: 64px; margin-bottom: 16px;">play_circle_outline</span>
                    <h3>Video Gömme Kısıtlaması</h3>
                    <p>Bu video doğrudan oynatılamıyor.</p>
                    <button onclick="window.modernYouTubeApp.openInYouTube()" style="
                        background: #ff0000; 
                        color: white; 
                        border: none; 
                        padding: 12px 24px; 
                        border-radius: 24px; 
                        cursor: pointer; 
                        font-size: 16px; 
                        margin-top: 16px;
                    ">YouTube'da İzle</button>
                </div>
            </div>
        `;
    }

    onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.ENDED) {
            // Auto-play next video from playlist if enabled
            if (this.isAutoplay && this.playlist.length > 0) {
                this.playNextFromPlaylist();
            }
        }
    }

    handlePlayerError(errorCode, videoId = null, container = null) {
        let errorMessage = 'Video oynatılamadı';
        
        switch(errorCode) {
            case 2:
                errorMessage = 'Video ID geçersiz';
                this.showToast(errorMessage, 'error');
                break;
            case 5:
                errorMessage = 'HTML5 player hatası - Alternatif yöntem deneniyor';
                this.showToast(errorMessage, 'warning');
                if (videoId && container) {
                    this.tryFallbackMethod(videoId, container);
                }
                break;
            case 100:
                errorMessage = 'Video bulunamadı veya gizli';
                this.showToast(errorMessage, 'error');
                break;
            case 101:
            case 150:
                errorMessage = 'Video gömme kısıtlaması - Alternatif deneniyor';
                this.showToast(errorMessage, 'warning');
                if (videoId && container) {
                    // Alternatif embedding denemesi
                    this.tryAlternativeHost(videoId, container);
                }
                break;
            default:
                errorMessage = `Video hatası (Kod: ${errorCode}) - Alternatif deneniyor`;
                this.showToast(errorMessage, 'warning');
                if (videoId && container) {
                    this.tryFallbackMethod(videoId, container);
                }
        }
    }

    tryAlternativeHost(videoId, container) {
        // Invidious veya diğer alternatif hostları dene
        const alternatives = [
            `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1&rel=0`,
            `https://invidious.io/embed/${videoId}?autoplay=0&controls=1&rel=0`,
        ];

        let currentIndex = 0;
        
        const tryNext = () => {
            if (currentIndex >= alternatives.length) {
                this.tryFallbackMethod(videoId, container);
                return;
            }

            const iframe = document.createElement('iframe');
            iframe.src = alternatives[currentIndex];
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.style.border = 'none';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.allowFullscreen = true;
            
            iframe.onload = () => {
                console.log(`Alternative host ${currentIndex} loaded successfully`);
            };
            
            iframe.onerror = () => {
                console.log(`Alternative host ${currentIndex} failed`);
                currentIndex++;
                container.innerHTML = '';
                tryNext();
            };

            container.innerHTML = '';
            container.appendChild(iframe);

            // Timeout kontrolü
            setTimeout(() => {
                if (!iframe.contentDocument && !iframe.contentWindow) {
                    currentIndex++;
                    tryNext();
                }
            }, 3000);
        };

        tryNext();
    }

    toggleFavorite() {
        if (!this.currentVideoData) return;

        const videoId = this.currentVideoData.id.videoId || this.currentVideoData.id;
        const favoriteIndex = this.favorites.findIndex(fav => (fav.id.videoId || fav.id) === videoId);

        if (favoriteIndex > -1) {
            this.favorites.splice(favoriteIndex, 1);
            this.favoriteButton.classList.remove('active');
            this.favoriteButton.querySelector('.material-icons-round').textContent = 'favorite_border';
            this.showToast('Favorilerden kaldırıldı', 'success');
        } else {
            this.favorites.push(this.currentVideoData);
            this.favoriteButton.classList.add('active');
            this.favoriteButton.querySelector('.material-icons-round').textContent = 'favorite';
            this.showToast('Favorilere eklendi', 'success');
        }

        localStorage.setItem('youtube-favorites', JSON.stringify(this.favorites));
        this.updateBadges();
    }

    showPlaylistModal() {
        if (!this.currentVideoData) return;
        this.playlistModal.classList.add('active');
        
        document.getElementById('currentPlaylist').addEventListener('click', () => {
            this.addToPlaylist();
            this.playlistModal.classList.remove('active');
        });
    }

    addToPlaylist() {
        if (!this.currentVideoData) return;

        const videoId = this.currentVideoData.id.videoId || this.currentVideoData.id;
        const exists = this.playlist.some(video => (video.id.videoId || video.id) === videoId);

        if (!exists) {
            this.playlist.push(this.currentVideoData);
            localStorage.setItem('youtube-playlist', JSON.stringify(this.playlist));
            this.updateBadges();
            this.showToast('Oynatma listesine eklendi', 'success');
        } else {
            this.showToast('Video zaten oynatma listesinde', 'warning');
        }
    }

    addToHistory(videoData) {
        const videoId = videoData.id.videoId || videoData.id;
        
        // Remove if already exists
        this.history = this.history.filter(video => (video.id.videoId || video.id) !== videoId);
        
        // Add to beginning
        this.history.unshift(videoData);
        
        // Keep only last 50 videos
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        localStorage.setItem('youtube-history', JSON.stringify(this.history));
    }

    shareVideo() {
        if (!this.currentVideoData) return;

        const videoId = this.currentVideoData.id.videoId || this.currentVideoData.id;
        const shareUrl = `https://www.youtube.com/watch?v=${videoId}`;

        if (navigator.share) {
            navigator.share({
                title: this.currentVideoData.snippet.title,
                url: shareUrl
            });
        } else {
            navigator.clipboard.writeText(shareUrl);
            this.showToast('Link kopyalandı', 'success');
        }
    }

    openInYouTube() {
        if (!this.currentVideoData) return;

        const videoId = this.currentVideoData.id.videoId || this.currentVideoData.id;
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        window.open(youtubeUrl, '_blank');
        this.closeAllModals();
    }

    showSettingsModal() {
        this.settingsModal.classList.add('active');
        this.autoplayToggle.checked = this.isAutoplay;
        this.qualitySelect.value = this.videoQuality;
    }

    toggleAutoplay() {
        this.isAutoplay = this.autoplayToggle.checked;
        localStorage.setItem('youtube-autoplay', this.isAutoplay);
    }

    changeQuality() {
        this.videoQuality = this.qualitySelect.value;
        localStorage.setItem('youtube-quality', this.videoQuality);
    }

    updateLoginStatus() {
        if (this.isLoggedIn && this.userEmail) {
            this.loginButton.querySelector('.nav-text').textContent = this.userEmail;
            this.loginButton.querySelector('.material-icons-round').textContent = 'logout';
        } else {
            this.loginButton.querySelector('.nav-text').textContent = 'Giriş Yap';
            this.loginButton.querySelector('.material-icons-round').textContent = 'account_circle';
        }
    }

    handleLogin() {
        if (this.isLoggedIn) {
            this.logout();
        } else {
            this.showLoginPrompt();
        }
    }

    showLoginPrompt() {
        const email = prompt('Gmail adresinizi girin:');
        if (email && this.isValidEmail(email)) {
            this.isLoggedIn = true;
            this.userEmail = email;
            localStorage.setItem('youtube-logged-in', 'true');
            localStorage.setItem('youtube-user-email', email);
            this.updateLoginStatus();
            this.showToast(`${email} ile giriş yapıldı`, 'success');
        } else if (email) {
            this.showToast('Geçerli bir email adresi girin', 'error');
        }
    }

    logout() {
        this.isLoggedIn = false;
        this.userEmail = null;
        localStorage.setItem('youtube-logged-in', 'false');
        localStorage.removeItem('youtube-user-email');
        this.updateLoginStatus();
        this.showToast('Çıkış yapıldı', 'success');
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    extractVideoId(url) {
        // YouTube URL formatları:
        // https://www.youtube.com/watch?v=VIDEO_ID
        // https://youtu.be/VIDEO_ID
        // https://www.youtube.com/embed/VIDEO_ID
        // https://www.youtube.com/v/VIDEO_ID
        // https://m.youtube.com/watch?v=VIDEO_ID
        // https://youtube.com/watch?v=VIDEO_ID (www olmadan)
        
        const patterns = [
            /(?:youtu\.be\/)([^&\n?#]+)/,
            /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
            /(?:m\.youtube\.com\/watch\?v=)([^&\n?#]+)/,
            /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
            /(?:youtube\.com\/v\/)([^&\n?#]+)/,
            /(?:youtube\.com\/watch\?.*v=)([^&\n?#]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        return null;
    }

    isYouTubeUrl(text) {
        return text.includes('youtube.com') || text.includes('youtu.be') || text.includes('m.youtube.com');
    }

    handleSearch() {
        const query = this.searchInput.value.trim();
        if (!query) return;

        // YouTube linki kontrolü
        if (this.isYouTubeUrl(query)) {
            const videoId = this.extractVideoId(query);
            if (videoId) {
                this.playVideoFromUrl(videoId);
                return;
            }
        }

        // Normal arama
        this.searchVideos();
    }

    handlePaste() {
        const query = this.searchInput.value.trim();
        
        // Yapıştırılan içerik YouTube linki mi kontrol et
        if (this.isYouTubeUrl(query)) {
            const videoId = this.extractVideoId(query);
            if (videoId) {
                this.showToast('YouTube linki algılandı! Video oynatılıyor...', 'success');
                setTimeout(() => {
                    this.playVideoFromUrl(videoId);
                }, 1000);
            }
        }
    }

    async playVideoFromUrl(videoId) {
        try {
            this.showLoading();
            
            // Video bilgilerini API'den al
            const data = await this.makeAPIRequest('videos', {
                part: 'snippet,contentDetails,statistics',
                id: videoId
            });

            if (data.items && data.items.length > 0) {
                const video = data.items[0];
                this.hideLoading();
                this.openVideoPlayer(videoId, video);
                this.searchInput.value = video.snippet.title; // Arama kutusuna video başlığını yaz
            } else {
                this.hideLoading();
                this.showToast('Video bulunamadı', 'error');
            }
        } catch (error) {
            console.error('Error loading video from URL:', error);
            this.hideLoading();
            this.showToast('Video yüklenirken hata oluştu', 'error');
        }
    }

    updateBadges() {
        this.favoritesBadge.textContent = this.favorites.length;
        this.playlistBadge.textContent = this.playlist.length;
    }

    closeAllModals() {
        [this.playerModal, this.playlistModal, this.settingsModal].forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = 'auto';
        
        if (this.currentPlayer) {
            try {
                // Check if player is ready and has methods available
                if (typeof this.currentPlayer.pauseVideo === 'function') {
                    this.currentPlayer.pauseVideo();
                }
                if (typeof this.currentPlayer.destroy === 'function') {
                    this.currentPlayer.destroy();
                }
            } catch (error) {
                console.warn('Error controlling/destroying player:', error);
            } finally {
                this.currentPlayer = null;
            }
        }
        
        this.currentVideoData = null;
    }

    // Player control methods
    togglePlayPause() {
        if (this.currentPlayer && typeof this.currentPlayer.getPlayerState === 'function') {
            try {
                const state = this.currentPlayer.getPlayerState();
                if (state === YT.PlayerState.PLAYING) {
                    this.currentPlayer.pauseVideo();
                } else {
                    this.currentPlayer.playVideo();
                }
            } catch (error) {
                console.warn('Error controlling player:', error);
            }
        }
    }

    toggleMute() {
        if (this.currentPlayer && typeof this.currentPlayer.isMuted === 'function') {
            try {
                if (this.currentPlayer.isMuted()) {
                    this.currentPlayer.unMute();
                } else {
                    this.currentPlayer.mute();
                }
            } catch (error) {
                console.warn('Error controlling volume:', error);
            }
        }
    }

    toggleFullscreen() {
        if (this.currentVideoData) {
            const videoId = this.currentVideoData.id.videoId || this.currentVideoData.id;
            const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
            window.open(youtubeUrl, '_blank');
        }
    }

    focusSearch() {
        this.searchInput.focus();
    }

    goToHome() {
        // Modalları kapat
        this.closeAllModals();
        
        // Ana sayfa sekmesini aktif et
        this.switchSection('home');
        
        // Arama kutusunu temizle
        this.searchInput.value = '';
        this.searchFilters.classList.remove('active');
        
        // Videolar sekmesini aktif et
        this.tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === 'videos');
        });
        
        // Trending videoları yükle
        this.loadTrendingVideos();
        
        // Yukarı scroll
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        this.showToast('Ana sayfaya dönüldü', 'success');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        this.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// YouTube IFrame API ready handler
function onYouTubeIframeAPIReady() {
    console.log('YouTube API ready');
    window.modernYouTubeApp = new ModernYouTubeApp();
}

// Manual initialization if API is already loaded
if (window.YT && window.YT.Player) {
    console.log('YouTube API already loaded');
    window.modernYouTubeApp = new ModernYouTubeApp();
} else {
    console.log('Waiting for YouTube API to load...');
}
