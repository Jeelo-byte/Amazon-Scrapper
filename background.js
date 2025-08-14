// --- LISTENERS ---
chrome.commands.onCommand.addListener((command) => {
    switch (command) {
        case "copy-all-data":
            triggerScrapingInActiveTab("all");
            break;
        case "copy-image-link":
            triggerScrapingInActiveTab("image");
            break;
        case "copy-affiliate-link":
            triggerScrapingInActiveTab("affiliate");
            break;
        case "copy-title":
            triggerScrapingInActiveTab("title");
            break;
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "sendData" && sender.tab) {
        handleScrapedData(request.data, sender.tab.id);
    }
});

// --- CORE FUNCTIONS ---
function triggerScrapingInActiveTab(action = "all") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
            // Check if we can access the tab
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['content.js']
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error executing script:', chrome.runtime.lastError);
                    // Show error notification to user
                    showErrorNotification(tabs[0].id, "Permission Error", "Cannot access this page. Make sure you're on an Amazon product page.");
                    return;
                }
                // Store the action type for the content script to use
                chrome.storage.local.set({ currentAction: action });
            });
        }
    });
}



function handleScrapedData(product, tabId) {
    chrome.storage.local.get({ currentAction: "all" }, (data) => {
        const action = data.currentAction;
        let textToCopy = "";
        let notificationTitle = "";
        let notificationMessage = "";

        switch (action) {
            case "image":
                if (product.imageUrl) {
                    textToCopy = product.imageUrl;
                    notificationTitle = "Image Link Copied!";
                    notificationMessage = "Product image URL has been copied to clipboard.";
                } else {
                    notificationTitle = "No Image Found";
                    notificationMessage = "Could not find product image on this page.";
                }
                break;
            case "affiliate":
                if (product.affiliateLink) {
                    textToCopy = product.affiliateLink;
                    notificationTitle = "Affiliate Link Copied!";
                    notificationMessage = "Product affiliate link has been copied to clipboard.";
                } else {
                    notificationTitle = "No Affiliate Link Found";
                    notificationMessage = "Could not find affiliate link on this page.";
                }
                break;
            case "title":
                if (product.title) {
                    textToCopy = product.title;
                    notificationTitle = "Title Copied!";
                    notificationMessage = "Product title has been copied to clipboard.";
                } else {
                    notificationTitle = "No Title Found";
                    notificationMessage = "Could not find product title on this page.";
                }
                break;
            case "all":
            default:
                chrome.storage.sync.get({ settings: getDefaultSettings() }, (settingsData) => {
                    const settings = settingsData.settings;
                    let partialData = false;
                    let missingFields = [];

                    const fields = getFieldConfig(product);
                    for (const field of fields) {
                        if (settings[field.key]) {
                            if (field.value) {
                                textToCopy += `${field.label}: ${field.value}\n`;
                            } else {
                                partialData = true;
                                missingFields.push(field.label);
                            }
                        }
                    }

                    // Always include image URL if available
                    if (product.imageUrl) {
                        textToCopy += `Image URL: ${product.imageUrl}\n`;
                    } else {
                        missingFields.push("Image URL");
                    }

                    if (partialData && missingFields.length > 0) {
                        const missingText = missingFields.join(", ");
                        const formattedMessage = `Data copied successfully. Missing fields: **${missingText}**`;
                        copyTextAndNotify(textToCopy.trim(), true, tabId, "Partial Data Copied!", formattedMessage);
                    } else {
                        copyTextAndNotify(textToCopy.trim(), false, tabId, "All Product Data Copied!", "All selected product data has been copied to clipboard.");
                    }
                });
                return; // Exit early for "all" case
        }

        // For specific actions, copy the text and show notification
        if (textToCopy) {
            copyTextAndNotify(textToCopy, false, tabId, notificationTitle, notificationMessage);
        } else {
            showErrorNotification(tabId, notificationTitle, notificationMessage);
        }
    });
}

function copyTextAndNotify(text, partial, tabId, title = "Data Copied!", message = "Data has been copied to clipboard.") {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (textToCopy, isPartial, notificationTitle, notificationMessage) => {
            // Copy text to clipboard first
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Create simple notification
                createSimpleNotification(notificationTitle, notificationMessage, isPartial ? 'warning' : 'success');
            }).catch(() => {
                // Fallback if clipboard fails
                createSimpleNotification(notificationTitle, notificationMessage, isPartial ? 'warning' : 'success');
            });
            
            function createSimpleNotification(title, message, type) {
                // Remove existing notifications
                const existingNotifications = document.querySelectorAll('.amazon-scraper-notification');
                existingNotifications.forEach(notification => notification.remove());
                
                // Create notification container
                let container = document.getElementById('amazon-scraper-notification-container');
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'amazon-scraper-notification-container';
                    container.style.cssText = `
                        position: fixed;
                        top: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        z-index: 999999;
                        max-width: 400px;
                        width: 90%;
                        pointer-events: none;
                    `;
                    document.body.appendChild(container);
                }
                
                // Create notification
                const notification = document.createElement('div');
                const bgColor = type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#ef4444';
                const icon = type === 'success' ? '✓' : type === 'warning' ? '⚠' : '✕';
                
                notification.className = 'amazon-scraper-notification';
                notification.style.cssText = `
                    background: ${bgColor};
                    color: white;
                    padding: 16px 20px;
                    border-radius: 8px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 10px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.25);
                    transform: translateY(-100px);
                    opacity: 0;
                    transition: all 0.3s ease;
                    pointer-events: auto;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                `;
                
                notification.innerHTML = `
                    <span style="font-size: 18px;">${icon}</span>
                    <div>
                        <div style="font-weight: 600; margin-bottom: 2px;">${title}</div>
                        <div style="opacity: 0.9; font-size: 13px;">${message}</div>
                    </div>
                `;
                
                container.appendChild(notification);
                
                // Animate in
                setTimeout(() => {
                    notification.style.transform = 'translateY(0)';
                    notification.style.opacity = '1';
                }, 10);
                
                // Auto remove
                setTimeout(() => {
                    notification.style.transform = 'translateY(-100px)';
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        if (notification.parentElement) {
                            notification.remove();
                        }
                    }, 300);
                }, 4000);
            }
        },
        args: [text, partial, title, message]
    }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error showing notification:', chrome.runtime.lastError);
        }
    });
}

function showErrorNotification(tabId, title, message) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (notificationTitle, notificationMessage) => {
            // Create simple notification
            createSimpleNotification(notificationTitle, notificationMessage, 'error');
            
            function createSimpleNotification(title, message, type) {
                // Remove existing notifications
                const existingNotifications = document.querySelectorAll('.amazon-scraper-notification');
                existingNotifications.forEach(notification => notification.remove());
                
                // Create notification container
                let container = document.getElementById('amazon-scraper-notification-container');
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'amazon-scraper-notification-container';
                    container.style.cssText = `
                        position: fixed;
                        top: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        z-index: 999999;
                        max-width: 400px;
                        width: 90%;
                        pointer-events: none;
                    `;
                    document.body.appendChild(container);
                }
                
                // Create notification
                const notification = document.createElement('div');
                const bgColor = type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#ef4444';
                const icon = type === 'success' ? '✓' : type === 'warning' ? '⚠' : '✕';
                
                notification.className = 'amazon-scraper-notification';
                notification.style.cssText = `
                    background: ${bgColor};
                    color: white;
                    padding: 16px 20px;
                    border-radius: 8px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 10px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.25);
                    transform: translateY(-100px);
                    opacity: 0;
                    transition: all 0.3s ease;
                    pointer-events: auto;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                `;
                
                notification.innerHTML = `
                    <span style="font-size: 18px;">${icon}</span>
                    <div>
                        <div style="font-weight: 600; margin-bottom: 2px;">${title}</div>
                        <div style="opacity: 0.9; font-size: 13px;">${message}</div>
                    </div>
                `;
                
                container.appendChild(notification);
                
                // Animate in
                setTimeout(() => {
                    notification.style.transform = 'translateY(0)';
                    notification.style.opacity = '1';
                }, 10);
                
                // Auto remove
                setTimeout(() => {
                    notification.style.transform = 'translateY(-100px)';
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        if (notification.parentElement) {
                            notification.remove();
                        }
                    }, 300);
                }, 4000);
            }
        },
        args: [title, message]
    }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error showing error notification:', chrome.runtime.lastError);
        }
    });
}

function showSimpleNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: #10b981;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 999999;
        box-shadow: 0 8px 25px rgba(0,0,0,0.25);
        opacity: 0;
        transition: all 0.3s ease;
        max-width: 400px;
        width: 90%;
        text-align: center;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(0)';
        notification.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(-100px)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}



// --- UTILITIES ---
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
        { key: 'title', label: 'Title', value: product.title },
        { key: 'price', label: 'Price', value: product.price },
        { key: 'listPrice', label: 'List Price', value: product.listPrice },
        { key: 'rating', label: 'Rating', value: product.rating },
        { key: 'affiliateLink', label: 'Affiliate Link', value: product.affiliateLink },
        { key: 'asin', label: 'ASIN', value: product.asin },
        { key: 'seller', label: 'Seller', value: product.seller },
        { key: 'bestSeller', label: 'Best Seller Rank', value: product.bestSeller },
        { key: 'description', label: 'Description', value: product.description?.join('\n• ') },
        { key: 'detailedRating', label: 'Detailed Rating', value: formatDetailedRating(product.detailedRating) }
    ];
}

function formatDetailedRating(detailedRating) {
    if (!detailedRating || typeof detailedRating !== 'object') return null;
    
    let result = '';
    if (detailedRating.overall) result += `Overall: ${detailedRating.overall}`;
    if (detailedRating.reviewCount) result += ` | Reviews: ${detailedRating.reviewCount}`;
    if (detailedRating.breakdown && Object.keys(detailedRating.breakdown).length > 0) {
        result += ` | Breakdown: ${Object.entries(detailedRating.breakdown).map(([stars, percent]) => `${stars}: ${percent}`).join(', ')}`;
    }
    return result || null;
}
