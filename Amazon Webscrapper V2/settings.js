document.addEventListener('DOMContentLoaded', () => {
    const settingsContainer = document.getElementById('settings-container');
    const shortcutsContainer = document.getElementById('shortcuts-container');
    const saveConfirmation = document.getElementById('save-confirmation');

    const fields = {
        title: 'Product Title',
        price: 'Discounted Price',
        listPrice: 'List Price',
        rating: 'Rating & Reviews',
        affiliateLink: 'Affiliate Link',
        imageUrl: 'Image URL',
        description: 'About This Item',
        asin: 'ASIN',
        seller: 'Seller Info',
        bestSeller: 'Best Seller Rank',
        detailedRating: 'Detailed Rating'
    };

    const defaultSettings = {
        title: true, price: true, listPrice: false, rating: true,
        affiliateLink: true, imageUrl: true, description: true,
        asin: true, seller: false, bestSeller: false,
        detailedRating: false
    };

    const shortcuts = {
        'copy-all-data': 'Copy All Product Data',
        'copy-image-link': 'Copy Image Link',
        'copy-affiliate-link': 'Copy Affiliate Link',
        'copy-title': 'Copy Product Title'
    };

    const defaultShortcuts = {
        'copy-all-data': 'Ctrl+Shift+S',
        'copy-image-link': 'Ctrl+Shift+I',
        'copy-affiliate-link': 'Ctrl+Shift+A',
        'copy-title': 'Ctrl+Shift+T'
    };

    chrome.storage.sync.get({ settings: defaultSettings }, (data) => {
        const currentSettings = data.settings;
        for (const [key, label] of Object.entries(fields)) {
            const isChecked = currentSettings[key] ?? defaultSettings[key];
            settingsContainer.appendChild(createToggleSwitch(key, label, isChecked));
        }
    });

    // Load and display shortcuts
    chrome.commands.getAll((commands) => {
        const commandMap = {};
        commands.forEach(cmd => {
            commandMap[cmd.name] = cmd.shortcut || 'Not set';
        });

        for (const [key, label] of Object.entries(shortcuts)) {
            const shortcut = commandMap[key] || defaultShortcuts[key];
            shortcutsContainer.appendChild(createShortcutRow(key, label, shortcut));
        }
    });

    function createToggleSwitch(key, label, isChecked) {
        const container = document.createElement('div');
        container.className = 'flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200';

        const labelEl = document.createElement('span');
        labelEl.className = 'text-gray-800 font-medium';
        labelEl.textContent = label;
        container.appendChild(labelEl);

        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = key;
        checkbox.id = key;
        checkbox.checked = isChecked;
        checkbox.className = 'toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer';

        const toggleLabel = document.createElement('label');
        toggleLabel.htmlFor = key;
        toggleLabel.className = 'toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer';

        toggleContainer.append(checkbox, toggleLabel);
        container.appendChild(toggleContainer);

        checkbox.addEventListener('change', saveSettings);
        return container;
    }

    function createShortcutRow(key, label, shortcut) {
        const container = document.createElement('div');
        container.className = 'flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200';

        const labelEl = document.createElement('span');
        labelEl.className = 'text-gray-800 font-medium';
        labelEl.textContent = label;
        container.appendChild(labelEl);

        const shortcutEl = document.createElement('button');
        shortcutEl.className = 'px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-mono transition-colors';
        shortcutEl.textContent = shortcut;
        shortcutEl.dataset.command = key;
        shortcutEl.addEventListener('click', () => {
            showShortcutDialog(key, label, shortcutEl);
        });
        container.appendChild(shortcutEl);

        return container;
    }

    function showShortcutDialog(command, label, buttonEl) {
        const dialog = document.createElement('div');
        dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        dialog.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="text-lg font-bold mb-4">Change Keyboard Shortcut</h3>
                <p class="text-gray-600 mb-4">Press the new key combination for "${label}":</p>
                <div class="text-center">
                    <div id="shortcut-display" class="text-2xl font-mono bg-gray-100 p-4 rounded mb-4">Press keys...</div>
                    <div class="flex space-x-2">
                        <button id="cancel-shortcut" class="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded">Cancel</button>
                        <button id="clear-shortcut" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded">Clear Shortcut</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const shortcutDisplay = dialog.querySelector('#shortcut-display');
        const cancelBtn = dialog.querySelector('#cancel-shortcut');
        const clearBtn = dialog.querySelector('#clear-shortcut');

        let keys = [];
        let isRecording = true;

        function updateDisplay() {
            shortcutDisplay.textContent = keys.length > 0 ? keys.join('+') : 'Press keys...';
        }

        function handleKeyDown(e) {
            if (!isRecording) return;
            e.preventDefault();
            
            const key = e.key === ' ' ? 'Space' : e.key;
            const modifiers = [];
            
            if (e.ctrlKey) modifiers.push('Ctrl');
            if (e.shiftKey) modifiers.push('Shift');
            if (e.altKey) modifiers.push('Alt');
            if (e.metaKey) modifiers.push('Cmd');
            
            keys = [...modifiers, key].filter((k, i, arr) => arr.indexOf(k) === i);
            updateDisplay();
        }

        function handleKeyUp(e) {
            if (!isRecording) return;
            e.preventDefault();
            
            if (keys.length > 0) {
                isRecording = false;
                const shortcut = keys.join('+');
                
                // Update the command
                chrome.commands.update({
                    name: command,
                    shortcut: shortcut
                }, () => {
                    if (chrome.runtime.lastError) {
                        alert('Invalid shortcut or shortcut already in use. Please try a different combination.');
                    } else {
                        buttonEl.textContent = shortcut;
                        saveConfirmation.textContent = 'Shortcut updated!';
                        setTimeout(() => { saveConfirmation.textContent = ''; }, 2000);
                    }
                    document.body.removeChild(dialog);
                });
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });

        clearBtn.addEventListener('click', () => {
            chrome.commands.update({
                name: command,
                shortcut: ''
            }, () => {
                buttonEl.textContent = 'Not set';
                saveConfirmation.textContent = 'Shortcut cleared!';
                setTimeout(() => { saveConfirmation.textContent = ''; }, 2000);
                document.body.removeChild(dialog);
            });
        });
    }

    function saveSettings() {
        const newSettings = {};
        settingsContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            newSettings[cb.name] = cb.checked;
        });

        chrome.storage.sync.set({ settings: newSettings }, () => {
            saveConfirmation.textContent = 'Settings saved!';
            setTimeout(() => { saveConfirmation.textContent = ''; }, 2000);
        });
    }
});
