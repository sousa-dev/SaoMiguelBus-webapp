document.addEventListener('DOMContentLoaded', () => {
    const languageButton = document.getElementById('languageButton');
    const languageModal = document.getElementById('languageModal');
    const closeModal = document.getElementById('closeModal');

    // Open the modal when the button is clicked
    languageButton.addEventListener('click', () => {
        languageModal.style.display = 'flex';
        // Track modal open
        if (typeof umami !== 'undefined') {
            umami.track('open-language-modal');
        }
    });

    // Close the modal when the close button is clicked
    closeModal.addEventListener('click', () => {
        languageModal.style.display = 'none';
        // Track modal close
        if (typeof umami !== 'undefined') {
            umami.track('close-language-modal');
        }
    });

    // Close the modal when clicking outside of it
    languageModal.addEventListener('click', (event) => {
        if (event.target === languageModal) {
            languageModal.style.display = 'none';
            // Track modal close by outside click
            if (typeof umami !== 'undefined') {
                umami.track('close-language-modal-outside');
            }
        }
    });
});