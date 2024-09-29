document.addEventListener('DOMContentLoaded', () => {
    const languageButton = document.getElementById('languageButton');
    const languageModal = document.getElementById('languageModal');
    const closeModal = document.getElementById('closeModal');

    // Open the modal when the button is clicked
    languageButton.addEventListener('click', () => {
        languageModal.style.display = 'flex';
    });

    // Close the modal when the close button is clicked
    closeModal.addEventListener('click', () => {
        languageModal.style.display = 'none';
    });

    // Close the modal when clicking outside of it
    languageModal.addEventListener('click', (event) => {
        if (event.target === languageModal) {
            languageModal.style.display = 'none';
        }
    });
});