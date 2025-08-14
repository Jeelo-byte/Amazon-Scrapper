document.addEventListener('DOMContentLoaded', function() {
    // --- UI ELEMENTS ---
    const loadingState = document.getElementById('loading-state');
    const dataDisplay = document.getElementById('data-display');
    const errorState = document.getElementById('error-state');
    const productImageContainer = document.getElementById('product-image-container');
    const productDataRows = document.getElementById('product-data-rows');
    const openSettingsBtn = document.getElementById('openSettings');
    const openShortcutsBtn = document.getElementById('openShortcuts');
    const copyAllBtn = document.getElementById('copyAllBtn');

    // --- SVG ICONS ---
    const icons = {
        copy: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>',
        check: '<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
        title: '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>',
        price: '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01"></path></svg>',
        rating: '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>',
        link: '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>',
        info: '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        badge: '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>'
    };

    let fullProductData = {};
    let userSettings = {};

    // --- INITIALIZATION ---
    chrome.storage.sync.get({ settings: getDefaultSettings() }, (data) => {
        userSettings = data.settings;
        startScraping();
    });

    // --- EVENT LISTENERS ---
    openSettingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
    openShortcutsBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    });
    copyAllBtn.addEventListener('click', copyAllData);

    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === "sendData") {
            fullProductData = request.data;
            if (fullProductData.title) {
                displayProductData(fullProductData);
                // Auto-copy data to clipboard when popup opens
                setTimeout(() => {
                    autoCopyToClipboard();
                }, 500); // Small delay to ensure UI is rendered
            } else {
                showError("This page does not contain product data.");
            }
        }
    });

    // --- CORE FUNCTIONS ---
    function startScraping() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.url?.includes('amazon.com')) {
                // Update loading message to indicate auto-copy
                loadingState.querySelector('p').textContent = 'Scraping Amazon page... (will auto-copy data)';
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    files: ['content.js']
                });
            } else {
                showError("Navigate to an Amazon product page to begin.");
            }
        });
    }

    function displayProductData(product) {
        loadingState.classList.add('hidden');
        dataDisplay.classList.remove('hidden');

        if (product.imageUrl) {
            productImageContainer.innerHTML = `<img src="${product.imageUrl}" alt="Product Image" class="w-full h-auto rounded-lg border shadow-sm">`;
        }

        copyAllBtn.innerHTML = `<span>${icons.copy}</span><span>Copy All Selected</span>`;

        productDataRows.innerHTML = '';
        const fields = getFieldConfig(product);
        fields.forEach(field => {
            if (field.value) {
                productDataRows.appendChild(createDataRow(field));
            }
        });

        // Show preview of additional data
        showPreviewSection(product);
    }

    function showPreviewSection(product) {
        const previewSection = document.getElementById('preview-section');
        const previewContent = document.getElementById('preview-content');
        
        const previewData = [];
        
        if (product.detailedRating && Object.keys(product.detailedRating).length > 0) {
            const rating = product.detailedRating;
            let ratingText = '<strong>Detailed Rating:</strong> ';
            if (rating.overall) ratingText += `Overall: ${rating.overall}`;
            if (rating.reviewCount) ratingText += ` | Reviews: ${rating.reviewCount}`;
            if (rating.breakdown && Object.keys(rating.breakdown).length > 0) {
                ratingText += ` | Breakdown: ${Object.entries(rating.breakdown).map(([stars, percent]) => `${stars}: ${percent}`).join(', ')}`;
            }
            previewData.push(ratingText);
        }
        
        // Show description preview if it's long
        if (product.description && product.description.length > 0) {
            const descriptionText = product.description.join('\n• ');
            if (descriptionText.length > 200) {
                const shortDesc = descriptionText.substring(0, 200) + '...';
                previewData.push(`<strong>Description Preview:</strong> ${shortDesc}`);
            }
        }
        
        if (previewData.length > 0) {
            previewContent.innerHTML = previewData.join('<br><br>');
            previewSection.classList.remove('hidden');
        } else {
            previewSection.classList.add('hidden');
        }
    }

    function createDataRow({ key, label, value, icon, format }) {
        const row = document.createElement('div');
        row.className = 'data-row flex items-start justify-between text-sm p-2 rounded-lg hover:bg-gray-200';

        const formattedValue = format ? format(value) : value;

        row.innerHTML = `
        <div class="flex items-center text-gray-600 space-x-3">
        ${icon}
        <span class="font-semibold">${label}</span>
        </div>
        <div class="flex items-center space-x-2">
        <span class="text-gray-900 text-right font-medium max-w-[200px] truncate" title="${formattedValue}">${formattedValue}</span>
        <button title="Copy ${label}" class="copy-btn p-1 rounded-full bg-gray-300 hover:bg-gray-400" data-key="${key}">
        ${icons.copy}
        </button>
        </div>`;

        const copyButton = row.querySelector('.copy-btn');
        copyButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const textToCopy = fullProductData[key];
            navigator.clipboard.writeText(Array.isArray(textToCopy) ? textToCopy.join('\n- ') : textToCopy);

            copyButton.innerHTML = icons.check;
            setTimeout(() => { copyButton.innerHTML = icons.copy; }, 1500);
        });
        return row;
    }

    function copyAllData() {
        let textToCopy = "";
        let missingFields = [];
        const fields = getFieldConfig(fullProductData);

        for (const field of fields) {
            if (userSettings[field.key]) {
                if (field.value) {
                    const value = Array.isArray(field.value) ? field.value.join('\n• ') : field.value;
                    textToCopy += `${field.label}: ${value}\n`;
                } else {
                    missingFields.push(field.label);
                }
            }
        }

        // Always include image URL if available
        if (fullProductData.imageUrl) {
            textToCopy += `Image URL: ${fullProductData.imageUrl}\n`;
        } else {
            missingFields.push("Image URL");
        }

        navigator.clipboard.writeText(textToCopy.trim());
        
        // Show appropriate feedback
        if (missingFields.length > 0) {
            const missingText = missingFields.join(", ");
            copyAllBtn.innerHTML = `<span>${icons.check}</span><span>Partial Copy!</span>`;
            
            // Show notification about missing fields
            if (window.extensionNotifications) {
                window.extensionNotifications.warning(
                    'Partial Data Copied!',
                    `Data copied successfully. Missing fields: ${missingText}`,
                    4000
                );
            }
        } else {
            copyAllBtn.innerHTML = `<span>${icons.check}</span><span>Copied!</span>`;
            
            // Show success notification
            if (window.extensionNotifications) {
                window.extensionNotifications.success(
                    'Data Copied!',
                    'All selected product data has been copied to clipboard.',
                    3000
                );
            }
        }
        
        setTimeout(() => { copyAllBtn.innerHTML = `<span>${icons.copy}</span><span>Copy All Selected</span>`; }, 2000);
    }

    function autoCopyToClipboard() {
        let textToCopy = "";
        let missingFields = [];
        const fields = getFieldConfig(fullProductData);

        for (const field of fields) {
            if (userSettings[field.key]) {
                if (field.value) {
                    const value = Array.isArray(field.value) ? field.value.join('\n• ') : field.value;
                    textToCopy += `${field.label}: ${value}\n`;
                } else {
                    missingFields.push(field.label);
                }
            }
        }

        // Always include image URL if available
        if (fullProductData.imageUrl) {
            textToCopy += `Image URL: ${fullProductData.imageUrl}\n`;
        } else {
            missingFields.push("Image URL");
        }

        navigator.clipboard.writeText(textToCopy.trim());
        
        // Show appropriate feedback
        if (missingFields.length > 0) {
            const missingText = missingFields.join(", ");
            copyAllBtn.innerHTML = `<span>${icons.check}</span><span>Partial Copy!</span>`;
            
            // Show notification about missing fields
            if (window.extensionNotifications) {
                window.extensionNotifications.warning(
                    'Partial Data Copied!',
                    `Data copied successfully. Missing fields: ${missingText}`,
                    4000
                );
            }
        } else {
            copyAllBtn.innerHTML = `<span>${icons.check}</span><span>Auto-copied!</span>`;
            
            // Show success notification
            if (window.extensionNotifications) {
                window.extensionNotifications.success(
                    'Data Copied!',
                    'Product data including image URL has been copied to clipboard.',
                    3000
                );
            }
        }
        
        setTimeout(() => { copyAllBtn.innerHTML = `<span>${icons.copy}</span><span>Copy All Selected</span>`; }, 2000);
    }

    // --- UTILITY FUNCTIONS ---
    function showError(message) {
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
        errorState.querySelector('p').textContent = message;
    }

    function getDefaultSettings() {
        return {
            title: true, price: true, listPrice: false, rating: true,
            affiliateLink: true, imageUrl: true, description: true,
            asin: true, seller: false, bestSeller: false,
            detailedRating: false
        };
    }

    function getFieldConfig(product) {
        return [
            { key: 'title', label: 'Title', value: product.title, icon: icons.title },
            { key: 'price', label: 'Price', value: product.price, icon: icons.price },
            { key: 'listPrice', label: 'List Price', value: product.listPrice, icon: icons.price },
            { key: 'rating', label: 'Rating', value: product.rating ? `${product.rating} (${product.reviewCount || 0})` : null, icon: icons.rating },
            { key: 'affiliateLink', label: 'Affiliate Link', value: product.affiliateLink, icon: icons.link },
            { key: 'asin', label: 'ASIN', value: product.asin, icon: icons.info },
            { key: 'seller', label: 'Seller', value: product.seller, icon: icons.info },
            { key: 'bestSeller', label: 'Best Seller', value: product.bestSeller, icon: icons.badge },
            { key: 'description', label: 'About This Item', value: product.description, icon: icons.info, format: formatArray },
            { key: 'detailedRating', label: 'Detailed Rating', value: product.detailedRating, icon: icons.rating, format: formatDetailedRating }
        ];
    }

    function formatArray(value) {
        if (!value || !Array.isArray(value) || value.length === 0) return 'None available';
        return value.join('\n• ');
    }

    function formatDetailedRating(value) {
        if (!value || typeof value !== 'object') return 'None available';
        
        let result = '';
        if (value.overall) result += `Overall: ${value.overall}`;
        if (value.reviewCount) result += ` | Reviews: ${value.reviewCount}`;
        if (value.breakdown && Object.keys(value.breakdown).length > 0) {
            result += ` | Breakdown: ${Object.entries(value.breakdown).map(([stars, percent]) => `${stars}: ${percent}`).join(', ')}`;
        }
        return result || 'None available';
    }
});
