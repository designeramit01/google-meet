window.addEventListener('DOMContentLoaded', () => {
    // Get all the containers and buttons
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const createMeetingBtn = document.getElementById('create-meeting-btn');
    const resultContainer = document.getElementById('result-container');

    // Function to check login status with our backend
    const checkLoginStatus = async () => {
        try {
            const response = await fetch('/get-status');
            const data = await response.json();

            if (data.loggedIn) {
                // If user is logged in, show the app and hide the login section
                authContainer.style.display = 'none';
                appContainer.style.display = 'block';
            } else {
                // If user is not logged in, show the login section and hide the app
                authContainer.style.display = 'block';
                appContainer.style.display = 'none';
            }
        } catch (error) {
            console.error('Error checking login status:', error);
        }
    };

    // Function to create a meeting
    const createMeeting = async () => {
        // Show loader in the result container
        resultContainer.innerHTML = `
            <div class="result-loader">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Generating your meeting link...</span>
            </div>
        `;
        createMeetingBtn.disabled = true;

        try {
            const response = await fetch('/create-meeting');
            const data = await response.json();

            if (data.link) {
                // If we get a link, display it with a copy button
                resultContainer.innerHTML = `
                    <div class="result-content">
                        <p><strong>Hi Team,</strong><br>Let's connect quickly. Please join the meeting using the link below.</p>
                        <div class="link-wrapper">
                           <a href="${data.link}" target="_blank">${data.link}</a>
                           <button id="copy-link-btn" class="copy-btn" title="Copy link">
                                <i class="fa-solid fa-copy"></i>
                           </button>
                        </div>
                    </div>
                `;
                
                // Add event listener to the new copy button
                document.getElementById('copy-link-btn').addEventListener('click', () => {
                    const copyBtn = document.getElementById('copy-link-btn');
                    const originalIcon = copyBtn.innerHTML;
                    const messageToCopy = `Hi Team,\n\nLet's connect quickly. Please join the meeting using the link below.\n\n${data.link}\n\nThanks!`;
                    
                    navigator.clipboard.writeText(messageToCopy).then(() => {
                        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
                        setTimeout(() => {
                           copyBtn.innerHTML = originalIcon;
                        }, 2000);
                    });
                });

            } else {
                resultContainer.innerHTML = `<p style="color: red;">Error: ${data.error || 'Failed to create meeting.'}</p>`;
            }

        } catch (error) {
            console.error('Error creating meeting:', error);
            resultContainer.innerHTML = `<p style="color: red;">A network error occurred. Please try again.</p>`;
        } finally {
            createMeetingBtn.disabled = false;
        }
    };

    // Add click event listener to the "Create Meeting" button
    createMeetingBtn.addEventListener('click', createMeeting);

    // Initial check when the page loads
    checkLoginStatus();
    // Add this code inside your DOMContentLoaded event listener, after the checkLoginStatus(); call

    // --- Logic for Static Link Cards (FINAL BEM Version) ---
    const staticCards = document.querySelectorAll('.static-card');
    const modalOverlay = document.getElementById('static-link-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalOpenBtn = document.getElementById('modal-open-btn');
    const modalCopyBtn = document.getElementById('modal-copy-btn');
    const toast = document.getElementById('toast-notification');

    // Function to open the modal
    function openModal(card) {
        const title = card.querySelector('.static-card-title').textContent;
        const link = card.dataset.link;
        modalTitle.textContent = title;
        modalOpenBtn.href = link;
        modalCopyBtn.dataset.link = link;
        modalOverlay.classList.add('static-modal__overlay--show'); // UPDATED CLASS
    }

    // Function to close the modal
    function closeModal() {
        modalOverlay.classList.remove('static-modal__overlay--show'); // UPDATED CLASS
    }

    // Add click listeners to all static cards
    staticCards.forEach(card => {
        card.addEventListener('click', () => {
            openModal(card);
        });
    });
    
    // Add click listener for the copy button inside the modal
    modalCopyBtn.addEventListener('click', () => {
        const linkToCopy = modalCopyBtn.dataset.link;
        navigator.clipboard.writeText(linkToCopy).then(() => {
            closeModal();
            showToast('Link copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy link: ', err);
            showToast('Could not copy the link.');
        });
    });

    // Listeners to close the modal
    modalCloseBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            closeModal();
        }
    });

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // function showToast(message) {
    //     toast.textContent = message;
    //     toast.classList.add('show');
    //     setTimeout(() => {
    //         toast.classList.remove('show');
    //     }, 3000); // Hide after 3 seconds
    // }
});