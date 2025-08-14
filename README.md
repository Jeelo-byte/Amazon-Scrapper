# Amazon Scraper Pro

Amazon Scraper Pro is a Chrome extension designed to quickly and easily scrape detailed product data from Amazon product pages. With a single click or keyboard shortcut, you can copy essential product information to your clipboard, including the title, price, image URL, ASIN, and more.

## Features

- **One-Click Scraping**: Scrape a wide range of product details directly from the Amazon page with a single click on the extension's popup.
- **Customizable Data**: Choose which data fields you want to scrape and copy, such as:
    - Product Title
    - Price (Discounted and List Price)
    - Rating and Review Count
    - Detailed Rating Breakdown (e.g., star percentages)
    - Affiliate Link
    - Image URL
    - "About This Item" bullet points
    - ASIN
    - Seller Information
    - Best Seller Rank
- **Keyboard Shortcuts**: Use customizable keyboard shortcuts for common actions to speed up your workflow.
    - `Ctrl+Shift+S` (or `Command+Shift+S` on Mac) to copy all selected data.
    - Shortcuts for copying just the image link, affiliate link, or title.
- **Auto-Copy Functionality**: The extension can automatically copy your selected data to the clipboard when you open the popup on a product page.
- **Intuitive UI**: A clean and easy-to-use popup displays the scraped data and provides options to copy individual fields or all data at once.
- **Non-intrusive Notifications**: Receive simple, clear notifications to confirm that data has been copied or to alert you of any issues.

## How to Use

1.  **Install the extension** from the Chrome Web Store.
2.  **Navigate** to any Amazon product page.
3.  **Click** the extension's icon in your browser toolbar.
4.  The popup will appear, and the product data will be automatically scraped and displayed.
5.  Click the "Copy All Selected" button to copy all the fields you have enabled in the settings, or click the individual copy icons next to each field.

### Customizing Settings

1.  Open the extension's popup.
2.  Click the "Settings" icon (gear icon) in the top-right corner.
3.  In the settings page, you can toggle which fields are included when you use the "Copy All" function.
4.  You can also customize the keyboard shortcuts for various actions on the same page.

## Data Fields Explained

- **Title**: The main title of the product.
- **Price**: The current selling price of the product.
- **List Price**: The original price, if a discount is applied.
- **Rating**: The overall star rating and total review count.
- **Detailed Rating**: A breakdown of the number of reviews for each star rating (e.g., "5 stars: 75%").
- **Affiliate Link**: A short, shareable affiliate link for the product.
- **Image URL**: The direct link to the main product image.
- **About This Item**: The list of bullet points detailing the product's features.
- **ASIN**: The unique Amazon Standard Identification Number.
- **Seller Info**: Information about the product's seller.
- **Best Seller Rank**: The product's ranking within its category (if available).

## Technology Stack

- **HTML/CSS**: For the popup and settings pages.
- **JavaScript**: The core logic for scraping the Amazon DOM, handling user interactions, and managing the extension's state.
- **Chrome Extension APIs**: `chrome.tabs`, `chrome.scripting`, `chrome.storage`, and `chrome.commands` are used to interact with browser tabs, execute scripts, save user settings, and manage shortcuts.
