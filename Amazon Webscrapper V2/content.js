(function() {
    // --- UTILITY FUNCTIONS ---
    const getText = (selector, context = document) => context.querySelector(selector)?.textContent.trim() || null;
    const getAttribute = (selector, attribute, context = document) => context.querySelector(selector)?.getAttribute(attribute) || null;
    const getValue = (selector, context = document) => context.querySelector(selector)?.value.trim() || null;

    const cleanSellerInfo = (sellerText) => {
        if (!sellerText) return null;
        
        // Remove "Visit the" and "Store" patterns
        let cleaned = sellerText
            .replace(/^Visit the\s+/i, '')  // Remove "Visit the" at the beginning
            .replace(/\s+Store\s*$/i, '')   // Remove "Store" at the end
            .replace(/^by\s+/i, '')         // Remove "by" at the beginning
            .trim();
        
        // If the result is empty or just whitespace, return null
        return cleaned.length > 0 ? cleaned : null;
    };

    // --- SCRAPING LOGIC ---
    const getProductDetails = () => {
        const details = {};
        const detailRows = document.querySelectorAll('#productDetails_detailBullets_sections1 tr');
        detailRows.forEach(row => {
            const label = getText('th', row)?.toLowerCase();
            const value = getText('td', row);
            if (label && value) {
                if (label.includes('asin')) details.asin = value;
                if (label.includes('best sellers rank')) details.bestSellerRank = value.split(' (')[0];
            }
        });
        return details;
    };

    const getColorOptions = () => {
        const colorOptions = [];
        const colorElements = document.querySelectorAll('#variation_color_name li, .imgSwatch');
        colorElements.forEach(el => {
            const colorName = el.getAttribute('title') || el.textContent.trim();
            if (colorName && !colorOptions.includes(colorName)) {
                colorOptions.push(colorName);
            }
        });
        return colorOptions;
    };

    const getItemOptions = () => {
        const itemOptions = [];
        const optionElements = document.querySelectorAll('#variation_size_name li, #variation_style_name li, .a-button-text');
        optionElements.forEach(el => {
            const optionName = el.textContent.trim();
            if (optionName && !itemOptions.includes(optionName)) {
                itemOptions.push(optionName);
            }
        });
        return itemOptions;
    };

    const getDetailedRating = () => {
        const ratingDetails = {};
        
        // Overall rating
        const overallRating = getAttribute('#acrPopover', 'title');
        if (overallRating) {
            ratingDetails.overall = overallRating;
        }
        
        // Review count
        const reviewCount = getText('#acrCustomerReviewText');
        if (reviewCount) {
            ratingDetails.reviewCount = reviewCount;
        }
        
        // Star breakdown (if available)
        const starBreakdown = {};
        const starElements = document.querySelectorAll('#histogramTable .a-text-right, .a-histogram-row');
        starElements.forEach(el => {
            const stars = el.querySelector('.a-text-right')?.textContent.trim();
            const percentage = el.querySelector('.a-text-left')?.textContent.trim();
            if (stars && percentage) {
                starBreakdown[stars] = percentage;
            }
        });
        
        if (Object.keys(starBreakdown).length > 0) {
            ratingDetails.breakdown = starBreakdown;
        }
        
        return ratingDetails;
    };

    const getAboutThisItem = () => {
        // Try multiple selectors for "About this item" section
        const selectors = [
            '#feature-bullets .a-list-item',
            '#feature-bullets ul li',
            '#feature-bullets .a-spacing-mini',
            '#feature-bullets .a-text-bold + span',
            '#feature-bullets .a-list-item span',
            '#feature-bullets li span',
            '#feature-bullets .a-spacing-base',
            '#feature-bullets .a-spacing-mini span'
        ];
        
        let aboutItems = [];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                aboutItems = Array.from(elements).map(el => {
                    let text = el.textContent.trim();
                    // Clean up the text - remove extra whitespace and normalize
                    text = text.replace(/\s+/g, ' ').trim();
                    return text;
                }).filter(text => text.length > 0);
                
                if (aboutItems.length > 0) {
                    break; // Found items, stop searching
                }
            }
        }
        
        // If no items found with specific selectors, try a broader approach
        if (aboutItems.length === 0) {
            const featureBullets = document.querySelector('#feature-bullets');
            if (featureBullets) {
                // Get all text content and split by common patterns
                const fullText = featureBullets.textContent.trim();
                const lines = fullText.split(/(?=\n|•|\*|·)/).map(line => line.trim()).filter(line => line.length > 0);
                aboutItems = lines;
            }
        }
        
        return aboutItems;
    };

    const productDetails = getProductDetails();
    const colorOptions = getColorOptions();
    const detailedRating = getDetailedRating();
    const aboutThisItem = getAboutThisItem();

    const product = {
        title: getText('#productTitle'),
        price: getText('#corePrice_feature_div .a-offscreen'),
        listPrice: getText('span[data-a-strike="true"] .a-offscreen'),
        rating: getAttribute('#acrPopover', 'title'),
        reviewCount: getText('#acrCustomerReviewText'),
        description: aboutThisItem,
        imageUrl: getAttribute('#landingImage', 'src') || getAttribute('#imgBlkFront', 'src'),
        affiliateLink: getValue('#amzn-ss-text-shortlink-textarea'),
        seller: cleanSellerInfo(getText('#bylineInfo')),
        asin: productDetails.asin,
        bestSeller: productDetails.bestSellerRank,
        // New fields
        colorOptions: colorOptions,
        detailedRating: detailedRating
    };

    // --- SEND DATA ---
    chrome.storage.local.get({ currentAction: "all" }, (data) => {
        const action = data.currentAction;
        
        // Send data to background script for processing
        chrome.runtime.sendMessage({ action: "sendData", data: product });
        
        // Clear the action after sending
        chrome.storage.local.remove('currentAction');
    });
})();
