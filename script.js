// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');

    if (document.body.classList.contains('dark-theme')) {
        themeIcon.innerHTML = '<path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>';
    } else {
        themeIcon.innerHTML = '<path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>';
    }
});

// Mode Selector
const modeOptions = document.querySelectorAll('.mode-option');
modeOptions.forEach(option => {
    option.addEventListener('click', () => {
        modeOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
    });
});

// PDF.js library for PDF processing
// Make sure to include the PDF.js library in your HTML:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js"></script>

// Gemini API integration
class GeminiProcessor {
    constructor() {
        // Load the Google Generative AI library from CDN
        this.loadGeminiSDK();

        // API key should be securely stored in a backend service
        // For demonstration, we'll use a placeholder
        this.apiKey = "1234";
        this.modelName = "gemini-2.0-flash";
        this.aiClient = null;
    }

    async loadGeminiSDK() {
        try {
            // Dynamically load the Google Generative AI library
            const script = document.createElement('script');
            script.src = "https://esm.run/@google/generative-ai";
            script.type = "module";

            // Create a promise that resolves when the script loads
            const scriptLoadPromise = new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
            });

            document.head.appendChild(script);
            await scriptLoadPromise;

            console.log("Gemini SDK loaded successfully");
        } catch (error) {
            console.error("Failed to load Gemini SDK:", error);
        }
    }

    async initializeClient() {
        if (!this.aiClient) {
            try {
                // Create a new Gemini client
                const { GoogleGenerativeAI } = await import("https://esm.run/@google/generative-ai");
                this.aiClient = new GoogleGenerativeAI(this.apiKey);
                console.log("Gemini client initialized");
            } catch (error) {
                console.error("Error initializing Gemini client:", error);
                throw error;
            }
        }
        return this.aiClient;
    }

    async processText(text, instructions) {
        try {
            const client = await this.initializeClient();
            const model = client.getGenerativeModel({ model: this.modelName });

            // Prepare the prompt
            const prompt = instructions ? `${instructions}\n\n${text}` : text;

            // Generate content
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Error processing with Gemini:", error);
            throw error;
        }
    }
}

// Initialize Gemini processor
const geminiProcessor = new GeminiProcessor();

// Store the uploaded PDF file for later rendering
let uploadedPdfFile = null;

// PDF Processing with PDF.js
async function extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function (event) {
            const arrayBuffer = event.target.result;

            try {
                // Initialize PDF.js (ensure pdfjsLib is globally available from the CDN)
                const loadingTask = pdfjsLib.getDocument(arrayBuffer);
                const pdf = await loadingTask.promise;

                let fullText = "";

                // Process each page
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + "\n\n";
                }

                resolve(fullText);
            } catch (error) {
                console.error("Error extracting text from PDF:", error);
                reject(error);
            }
        };

        reader.onerror = function (error) {
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
}

// File Upload
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const dragArea = document.getElementById('dragArea');
const loadingElement = document.getElementById('loading');
const uploadLink = document.getElementById('upload-link');

uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

dragArea.addEventListener('click', () => {
    fileInput.click();
});

// Drag and drop functionality
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dragArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drag area when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
    dragArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dragArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dragArea.classList.add('active');
}

function unhighlight() {
    dragArea.classList.remove('active');
}

// Handle dropped files
dragArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

// Handle selected files
fileInput.addEventListener('change', function () {
    handleFiles(this.files);
});

async function handleFiles(files) {
    if (files.length === 0) return;

    const file = files[0];

    // Check if the file is a PDF
    if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file');
        return;
    }

    // Check file size (50MB = 52428800 bytes)
    if (file.size > 52428800) {
        alert('File size exceeds the 50MB limit');
        return;
    }

    // Save the file for PDF viewer
    uploadedPdfFile = file;

    // Show loading animation
    loadingElement.style.display = 'block';

    try {
        // Extract text from PDF
        const pdfText = await extractTextFromPDF(file);

        // Store the extracted text in session storage for the chat interface
        sessionStorage.setItem('pdfContent', pdfText);
        sessionStorage.setItem('pdfName', file.name);

        // Get the Gemini toggle state
        const geminiEnabled = document.querySelector('.toggle-container:nth-child(1) input').checked;

        // If Gemini is enabled, process with it
        if (geminiEnabled) {
            try {
                // Process the first part of the PDF text to get a summary
                // (limiting to first 4000 chars to avoid token limits)
                const summary = await geminiProcessor.processText(
                    pdfText.substring(0, 4000),
                    "You are an assistant that summarizes PDF content. Provide a brief overview of this document."
                );

                sessionStorage.setItem('pdfSummary', summary);
            } catch (error) {
                console.error("Error processing with Gemini:", error);
                alert("There was an error processing with Gemini. Continuing with standard processing.");
            }
        }

        // Hide loading
        loadingElement.style.display = 'none';

        // Check which features are enabled
        const mindMapEnabled = document.querySelector('.toggle-container:nth-child(2) input').checked;
        const translateEnabled = document.querySelector('.toggle-container:nth-child(3) input').checked;

        // Store feature preferences
        sessionStorage.setItem('mindMapEnabled', mindMapEnabled);
        sessionStorage.setItem('translateEnabled', translateEnabled);

        // Create a URL for the PDF file
        const pdfUrl = URL.createObjectURL(file);
        sessionStorage.setItem('pdfUrl', pdfUrl);

        // Redirect to chat interface
        redirectToChatInterface(file.name);

    } catch (error) {
        console.error("Error processing PDF:", error);
        loadingElement.style.display = 'none';
        alert("There was an error processing your PDF. Please try again.");
    }
}

// Handle upload via link
uploadLink.addEventListener('click', async () => {
    const url = prompt('Enter the URL of the PDF file:');
    if (url) {
        if (isValidUrl(url)) {
            // Show loading animation
            loadingElement.style.display = 'block';

            try {
                // Fetch the PDF from the URL
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
                }

                const pdfBlob = await response.blob();

                // Create a File object from the blob
                const file = new File([pdfBlob], "document-from-url.pdf", { type: "application/pdf" });

                // Process the file
                handleFiles([file]);

            } catch (error) {
                console.error("Error fetching PDF from URL:", error);
                loadingElement.style.display = 'none';
                alert("There was an error downloading the PDF from the provided URL. Please check the URL and try again.");
            }
        } else {
            alert('Please enter a valid URL');
        }
    }
});

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Feature toggles functionality
const toggles = document.querySelectorAll('.toggle input');
toggles.forEach(toggle => {
    toggle.addEventListener('change', function () {
        const featureName = this.parentElement.previousElementSibling.textContent.trim();
        console.log(`Feature ${featureName} is now ${this.checked ? 'enabled' : 'disabled'}`);
    });
});

// Render PDF in viewer
function renderPDF(pdfUrl, container) {
    // Specify the PDF.js worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

    // Load the PDF
    pdfjsLib.getDocument(pdfUrl).promise.then(function (pdf) {
        const numPages = pdf.numPages;

        // Set up pagination controls
        const paginationControls = document.createElement('div');
        paginationControls.className = 'pagination-controls';

        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.className = 'pagination-btn';
        prevButton.disabled = true;

        const pageIndicator = document.createElement('span');
        pageIndicator.textContent = '1 / ' + numPages;
        pageIndicator.className = 'page-indicator';

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.className = 'pagination-btn';

        paginationControls.appendChild(prevButton);
        paginationControls.appendChild(pageIndicator);
        paginationControls.appendChild(nextButton);

        // Create canvas for the PDF
        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-canvas';

        // Add elements to container
        container.appendChild(canvas);
        container.appendChild(paginationControls);

        let currentPage = 1;

        // Function to render a page
        function renderPage(pageNum) {
            pdf.getPage(pageNum).then(function (page) {
                const viewport = page.getViewport({ scale: 1.5 });
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: canvas.getContext('2d'),
                    viewport: viewport
                };

                page.render(renderContext).promise.then(function () {
                    pageIndicator.textContent = pageNum + ' / ' + numPages;
                    prevButton.disabled = pageNum === 1;
                    nextButton.disabled = pageNum === numPages;
                });
            });
        }

        // Render first page initially
        renderPage(currentPage);

        // Set up navigation
        prevButton.addEventListener('click', function () {
            if (currentPage > 1) {
                currentPage--;
                renderPage(currentPage);
            }
        });

        nextButton.addEventListener('click', function () {
            if (currentPage < numPages) {
                currentPage++;
                renderPage(currentPage);
            }
        });
    });
}

// Redirect to chat interface with PDF viewer
function redirectToChatInterface(filename) {
    // Get PDF URL from session storage
    const pdfUrl = sessionStorage.getItem('pdfUrl');

    // Create a new interface with both PDF viewer and chat
    document.body.innerHTML = `
        <div class="document-interface">
            <header class="interface-header">
                <div class="logo-container">
                    <div class="logo">B</div>
                    <div class="logo-text">Block Tutor</div>
                </div>
                <h1 class="document-title">${filename}</h1>
                <div class="header-actions">
                    <button id="toggle-view-btn">Toggle View</button>
                    <div class="theme-toggle" id="theme-toggle-interface">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"
                            id="theme-icon-interface">
                            <path
                                d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z" />
                        </svg>
                    </div>
                </div>
            </header>
            
            <div class="split-container">
                <div class="pdf-viewer" id="pdf-viewer"></div>
                <div class="chat-container">
                    <div class="chat-messages" id="chat-messages">
                        <div class="message assistant-message">
                            <div class="message-content">
                                <strong>Block Tutor:</strong> Hello! I've processed your PDF. How can I help you with?
                            </div>
                        </div>
                    </div>
                    <div class="chat-input-container">
                        <input type="text" id="user-input" placeholder="Ask a question about your PDF...">
                        <button id="send-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .document-interface {
                display: flex;
                flex-direction: column;
                height: 100vh;
                overflow: hidden;
            }
            
            .interface-header {
                display: flex;
                align-items: center;
                padding: 0.75rem 1.5rem;
                background-color: var(--bg-color);
                border-bottom: 1px solid var(--border-color);
                justify-content: space-between;
            }
            
            .document-title {
                font-size: 1.25rem;
                margin: 0;
            }
            
            .header-actions {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            #toggle-view-btn {
                padding: 0.5rem 1rem;
                background-color: var(--primary-color);
                color: white;
                border: none;
                border-radius: 2rem;
                cursor: pointer;
            }
            
            .split-container {
                display: flex;
                height: calc(100vh - 64px);
                overflow: hidden;
            }
            
            .pdf-viewer {
                flex: 1;
                border-right: 1px solid var(--border-color);
                overflow: auto;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 1rem;
                background-color: #f5f5f5;
            }
            
            body.dark-theme .pdf-viewer {
                background-color: #111827;
            }
            
            .pdf-canvas {
                max-width: 100%;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                margin-bottom: 1rem;
            }
            
            .pagination-controls {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .pagination-btn {
                padding: 0.5rem 1rem;
                background-color: var(--primary-color);
                color: white;
                border: none;
                border-radius: 2rem;
                cursor: pointer;
            }
            
            .pagination-btn:disabled {
                background-color: #ccc;
                cursor: not-allowed;
            }
            
            .page-indicator {
                font-weight: bold;
            }
            
            .chat-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                border-left: 1px solid var(--border-color);
            }
            
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 1rem;
            }
            
            .message {
                margin-bottom: 1rem;
            }
            
            .user-message {
                text-align: right;
            }
            
            .message-content {
                display: inline-block;
                padding: 0.75rem 1rem;
                border-radius: 1rem;
                max-width: 80%;
            }
            
            .assistant-message .message-content {
                background-color: #f0f0f0;
                color: var(--text-color);
            }
            
            .user-message .message-content {
                background-color: var(--primary-color);
                color: white;
            }
            
            .chat-input-container {
                display: flex;
                padding: 1rem;
                border-top: 1px solid var(--border-color);
                background-color: var(--bg-color);
            }
            
            #user-input {
                flex: 1;
                padding: 0.75rem 1rem;
                border: 1px solid var(--border-color);
                border-radius: 2rem;
                margin-right: 0.5rem;
                background-color: var(--bg-color);
                color: var(--text-color);
            }
            
            #send-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-color: var(--primary-color);
                color: white;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
            }
            
            /* Responsive design for mobile */
            @media (max-width: 768px) {
                .split-container {
                    flex-direction: column;
                }
                
                .pdf-viewer, .chat-container {
                    flex: none;
                    height: 50%;
                    border: none;
                }
                
                .pdf-viewer {
                    border-bottom: 1px solid var(--border-color);
                }
            }
        </style>
    `;

    // Re-initialize theme toggle in the new interface
    const themeToggleInterface = document.getElementById('theme-toggle-interface');
    const themeIconInterface = document.getElementById('theme-icon-interface');

    themeToggleInterface.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');

        if (document.body.classList.contains('dark-theme')) {
            themeIconInterface.innerHTML = '<path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>';
        } else {
            themeIconInterface.innerHTML = '<path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>';
        }
    });

    // Set up toggle view button
    document.getElementById('toggle-view-btn').addEventListener('click', () => {
        const splitContainer = document.querySelector('.split-container');
        const isRow = splitContainer.style.flexDirection !== 'column';

        if (isRow) {
            splitContainer.style.flexDirection = 'column';
            document.querySelector('.pdf-viewer').style.height = '50%';
            document.querySelector('.chat-container').style.height = '50%';
        } else {
            splitContainer.style.flexDirection = 'row';
            document.querySelector('.pdf-viewer').style.height = '';
            document.querySelector('.chat-container').style.height = '';
        }
    });

    // Render PDF in the viewer
    const pdfViewer = document.getElementById('pdf-viewer');
    renderPDF(pdfUrl, pdfViewer);

    // Add functionality to the chat interface
    document.getElementById('send-btn').addEventListener('click', handleChatMessage);
    document.getElementById('user-input').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleChatMessage();
        }
    });
}

// Handle chat messages in the interface
async function handleChatMessage() {
    const userInput = document.getElementById('user-input').value.trim();
    if (!userInput) return;

    // Display user message
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML += `
        <div class="message user-message">
            <div class="message-content">
                <strong>You:</strong> ${userInput}
            </div>
        </div>
    `;

    // Clear input
    document.getElementById('user-input').value = '';

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Check if this is a special command
    if (checkForCommands(userInput)) {
        return; // If it was a command, exit early as it's already handled
    }

    // Add typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'typing-indicator';
    typingIndicator.className = 'message assistant-message';
    typingIndicator.innerHTML = `
        <div class="message-content">
            <strong>Block Tutor:</strong> Thinking...
        </div>
    `;
    chatMessages.appendChild(typingIndicator);

    try {
        // Get stored PDF content
        const pdfContent = sessionStorage.getItem('pdfContent');
        const pdfSummary = sessionStorage.getItem('pdfSummary');

        let response;

        try {
            // Prepare context from PDF content (limiting to avoid token limits)
            const context = pdfContent ? pdfContent.substring(0, 2000) : "No PDF content available.";
            const prompt = `
                Question: ${userInput}
                
                Context from PDF:
                ${context}
                
                ${pdfSummary ? `Summary of PDF: ${pdfSummary}` : ''}
                
                Please answer the question based on the PDF content provided.
            `;

            response = await geminiProcessor.processText(prompt);
        } catch (error) {
            console.error("Error processing with Gemini:", error);

            // Fallback response selection if Gemini API fails
            const fallbackResponses = [
                "I'm having trouble connecting to the Gemini API. Please check your API key or network connection.",
                "I couldn't process your question with Gemini. Could you try again or rephrase your question?",
                "There was an issue with the Gemini API. Please ensure your API key is valid and try again.",
                "The Gemini service is currently unavailable. Please try again later."
            ];
            response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        }

        // Remove typing indicator
        document.getElementById('typing-indicator').remove();

        // Display assistant response
        chatMessages.innerHTML += `
            <div class="message assistant-message">
                <div class="message-content">
                    <strong>Monica:</strong> ${response}
                </div>
            </div>
        `;

        // Scroll to bottom again
        chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (error) {
        console.error("Error handling chat message:", error);

        // Remove typing indicator
        if (document.getElementById('typing-indicator')) {
            document.getElementById('typing-indicator').remove();
        }

        // Display error message
        chatMessages.innerHTML += `
            <div class="message assistant-message">
                <div class="message-content">
                    <strong>Monica:</strong> I'm sorry, I encountered an error processing your request. Please try again.
                </div>
            </div>
        `;
    }
}

// Check for special commands in user input
function checkForCommands(userInput) {
    const lowercaseInput = userInput.toLowerCase();

    // Command to generate summary
    if (lowercaseInput.includes("summarize") || lowercaseInput.includes("summary")) {
        generateSummary();
        return true;
    }

    // Command to extract key points
    if (lowercaseInput.includes("key points") || lowercaseInput.includes("main points")) {
        extractKeyPoints();
        return true;
    }

    // Command to search for specific terms
    if (lowercaseInput.includes("search for") || lowercaseInput.includes("find")) {
        const searchTerm = userInput.replace(/search for|find/i, "").trim();
        searchPdfContent(searchTerm);
        return true;
    }

    // Command to generate mind map if enabled
    if (lowercaseInput.includes("mind map") && sessionStorage.getItem('mindMapEnabled') === 'true') {
        generateMindMap();
        return true;
    }

    // Command to translate if enabled
    if ((lowercaseInput.includes("translate") || lowercaseInput.includes("translation")) &&
        sessionStorage.getItem('translateEnabled') === 'true') {
        const language = extractLanguage(userInput);
        translateContent(language);
        return true;
    }

    // Not a command
    return false;
}

// Extract target language from user input
function extractLanguage(userInput) {
    const lowercaseInput = userInput.toLowerCase();

    // Common languages that might be requested
    const languages = ['spanish', 'french', 'german', 'italian', 'chinese', 'japanese',
        'korean', 'russian', 'arabic', 'portuguese', 'hindi'];

    for (const language of languages) {
        if (lowercaseInput.includes(language)) {
            return language;
        }
    }

    // Default to spanish if no language specified
    return 'spanish';
}

// Generate summary of PDF
async function generateSummary() {
    const chatMessages = document.getElementById('chat-messages');

    // Add typing indicator
    chatMessages.innerHTML += `
        <div class="message assistant-message" id="typing-indicator">
            <div class="message-content">
                <strong>Monica:</strong> Generating summary...
            </div>
        </div>
    `;

    try {
        // Get PDF content
        const pdfContent = sessionStorage.getItem('pdfContent');

        if (!pdfContent) {
            document.getElementById('typing-indicator').remove();
            chatMessages.innerHTML += `
                <div class="message assistant-message">
                    <div class="message-content">
                        <strong>Monica:</strong> No PDF content available to summarize.
                    </div>
                </div>
            `;
            return;
        }

        // Use stored summary if available, otherwise generate new one
        let summary = sessionStorage.getItem('pdfSummary');

        if (!summary) {
            try {
                summary = await geminiProcessor.processText(
                    pdfContent.substring(0, 4000),
                    "You are an assistant that summarizes PDF content. Provide a comprehensive summary of this document in bullet points."
                );

                // Store summary for future use
                sessionStorage.setItem('pdfSummary', summary);
            } catch (error) {
                console.error("Error generating summary with Gemini:", error);
                summary = "I couldn't generate a summary using the Gemini API. Please check your API key or network connection.";
            }
        }

        // Remove typing indicator
        document.getElementById('typing-indicator').remove();

        // Display summary
        chatMessages.innerHTML += `
            <div class="message assistant-message">
                <div class="message-content">
                    <strong>Monica:</strong> <strong>Summary:</strong><br>${summary}
                </div>
            </div>
        `;

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (error) {
        console.error("Error generating summary:", error);

        // Remove typing indicator
        if (document.getElementById('typing-indicator')) {
            document.getElementById('typing-indicator').remove();
        }

        // Display error message
        chatMessages.innerHTML += `
            <div class="message assistant-message">
                <div class="message-content">
                    <strong>Monica:</strong> I encountered an error while generating the summary. Please try again.
                </div>
            </div>
        `;
    }
}

// Extract key points from PDF
async function extractKeyPoints() {
    const chatMessages = document.getElementById('chat-messages');

    // Add typing indicator
    chatMessages.innerHTML += `
        <div class="message assistant-message" id="typing-indicator">
            <div class="message-content">
                <strong>Monica:</strong> Extracting key points...
            </div>
        </div>
    `;

    try {
        // Get PDF content
        const pdfContent = sessionStorage.getItem('pdfContent');

        if (!pdfContent) {
            document.getElementById('typing-indicator').remove();
            chatMessages.innerHTML += `
                <div class="message assistant-message">
                    <div class="message-content">
                        <strong>Monica:</strong> No PDF content available to extract key points from.
                    </div>
                </div>
            `;
            return;
        }

        let keyPoints;

        try {
            keyPoints = await geminiProcessor.processText(
                pdfContent.substring(0, 4000),
                "Extract the 5-7 most important key points from this document. Format as a numbered list."
            );
        } catch (error) {
            console.error("Error extracting key points with Gemini:", error);
            keyPoints = "I couldn't extract key points using the Gemini API. Please check your API key or network connection.";
        }

        // Remove typing indicator
        document.getElementById('typing-indicator').remove();

        // Display key points
        chatMessages.innerHTML += `
            <div class="message assistant-message">
                <div class="message-content">
                    <strong>Monica:</strong> <strong>Key Points:</strong><br>${keyPoints}
                </div>
            </div>
        `;

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (error) {
        console.error("Error extracting key points:", error);

        // Remove typing indicator
        if (document.getElementById('typing-indicator')) {
            document.getElementById('typing-indicator').remove();
        }

        // Display error message
        chatMessages.innerHTML += `
            <div class="message assistant-message">
                <div class="message-content">
                    <strong>Monica:</strong> I encountered an error while extracting key points. Please try again.
                </div>
            </div>
        `;
    }
}

// Search for terms in PDF content
function searchPdfContent(searchTerm) {
    const chatMessages = document.getElementById('chat-messages');

    // Add typing indicator
    chatMessages.innerHTML += `
        <div class="message assistant-message" id="typing-indicator">
            <div class="message-content">
                <strong>Monica:</strong> Searching for "${searchTerm}"...
            </div>
        </div>
    `;

    try {
        // Get PDF content
        const pdfContent = sessionStorage.getItem('pdfContent');

        if (!pdfContent) {
            document.getElementById('typing-indicator').remove();
            chatMessages.innerHTML += `
                <div class="message assistant-message">
                    <div class="message-content">
                        <strong>Monica:</strong> No PDF content available to search.
                    </div>
                </div>
            `;
            return;
        }

        const results = [];
        const searchTermLower = searchTerm.toLowerCase();
        const contentLines = pdfContent.split('\n');

        // Search for the term in each line
        for (let i = 0; i < contentLines.length; i++) {
            const line = contentLines[i];
            if (line.toLowerCase().includes(searchTermLower)) {
                results.push({
                    line: i + 1,
                    content: line.trim()
                });
            }
        }

        // Remove typing indicator
        document.getElementById('typing-indicator').remove();

        // Display search results
        if (results.length > 0) {
            let resultsHTML = `<strong>Results for "${searchTerm}":</strong><br>`;

            // Limit to 5 results to avoid overwhelming the chat
            const displayResults = results.slice(0, 5);

            displayResults.forEach((result, index) => {
                resultsHTML += `<strong>${index + 1}.</strong> "${result.content}"<br>`;
            });

            if (results.length > 5) {
                resultsHTML += `<em>...and ${results.length - 5} more results.</em>`;
            }

            chatMessages.innerHTML += `
                <div class="message assistant-message">
                    <div class="message-content">
                        <strong>Monica:</strong> ${resultsHTML}
                    </div>
                </div>
            `;
        } else {
            chatMessages.innerHTML += `
                <div class="message assistant-message">
                    <div class="message-content">
                        <strong>Monica:</strong> No results found for "${searchTerm}" in the document.
                    </div>
                </div>
            `;
        }

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (error) {
        console.error("Error searching PDF content:", error);

        // Remove typing indicator
        if (document.getElementById('typing-indicator')) {
            document.getElementById('typing-indicator').remove();
        }

        // Display error message
        chatMessages.innerHTML += `
            <div class="message assistant-message">
                <div class="message-content">
                    <strong>Monica:</strong> I encountered an error while searching the document. Please try again.
                </div>
            </div>
        `;
    }
}

// Generate mind map from PDF content
async function generateMindMap() {
    const chatMessages = document.getElementById('chat-messages');

    // Check if mind map feature is enabled
    if (sessionStorage.getItem('mindMapEnabled') !== 'true') {
        chatMessages.innerHTML += `
            <div class="message assistant-message">
                <div class="message-content">
                    <strong>Monica:</strong> Mind map feature is not enabled. Please enable it in the settings before uploading your PDF.
                </div>
            </div>
        `;
        return;
    }

    // Add typing indicator
    chatMessages.innerHTML += `
        <div class="message assistant-message" id="typing-indicator">
            <div class="message-content">
                <strong>Monica:</strong> Generating mind map...
            </div>
        </div>
    `;

    try {
        // Get PDF content
        const pdfContent = sessionStorage.getItem('pdfContent');

        if (!pdfContent) {
            document.getElementById('typing-indicator').remove();
            chatMessages.innerHTML += `
                <div class="message assistant-message">
                    <div class="message-content">
                        <strong>Monica:</strong> No PDF content available to generate a mind map from.
                    </div>
                </div>
            `;
            return;
        }

        // Use Gemini to create a mind map structure
        let mindMapStructure;

        try {
            mindMapStructure = await geminiProcessor.processText(
                pdfContent.substring(0, 4000),
                "Create a mind map structure for this document with a central concept and key branches. Format it as a text-based mind map with indentation and bullet points to show hierarchy."
            );
        } catch (error) {
            console.error("Error generating mind map with Gemini:", error);
            mindMapStructure = "I couldn't generate a mind map using the Gemini API. Please check your API key or network connection.";
        }

        // Remove typing indicator
        document.getElementById('typing-indicator').remove();

        // Display mind map
        chatMessages.innerHTML += `
            <div class="message assistant-message">
                <div class="message-content">
                    <strong>Monica:</strong> <strong>Mind Map:</strong><br><pre>${mindMapStructure}</pre>
                </div>
            </div>
        `;

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (error) {
        console.error("Error generating mind map:", error);

        // Remove typing indicator
        if (document.getElementById('typing-indicator')) {
            document.getElementById('typing-indicator').remove();
        }

        // Display error message
        chatMessages.innerHTML += `
            <div class="message assistant-message">
                <div class="message-content">
                    <strong>Monica:</strong> I encountered an error while generating the mind map. Please try again.
                </div>
            </div>
        `;
    }
}

// Translate PDF content to another language
async function translateContent(targetLanguage) {
    const chatMessages = document.getElementById('chat-messages');

    // Check if translate feature is enabled
    if (sessionStorage.getItem('translateEnabled') !== 'true') {
        chatMessages.innerHTML += `
            <div class="message assistant-message">
                <div class="message-content">
                    <strong>Monica:</strong> Translation feature is not enabled. Please enable it in the settings before uploading your PDF.
                </div>
            </div>
        `;
        return;
    }

    // Add typing indicator
    chatMessages.innerHTML += `
        <div class="message assistant-message" id="typing-indicator">
            <div class="message-content">
                <strong>Monica:</strong> Translating content to ${targetLanguage}...
            </div>
        </div>
    `;

    try {
        // Get PDF content
        const pdfContent = sessionStorage.getItem('pdfContent');

        if (!pdfContent) {
            document.getElementById('typing-indicator').remove();
            chatMessages.innerHTML += `
                <div class="message assistant-message">
                    <div class="message-content">
                        <strong>Monica:</strong> No PDF content available to translate.
                    </div>
                </div>
            `;
            return;
        }

        // Take a sample of the content to translate (first 1000 characters)
        const contentSample = pdfContent.substring(0, 1000);

        let translatedContent;

        try {
            translatedContent = await geminiProcessor.processText(
                contentSample,
                `Translate the following text to ${targetLanguage}:`
            );
        } catch (error) {
            console.error("Error translating with Gemini:", error);
            translatedContent = `I couldn't translate the content to ${targetLanguage} using the Gemini API. Please check your API key or network connection.`;
        }

        // Remove typing indicator
        document.getElementById('typing-indicator').remove();

        // Display translated content
        chatMessages.innerHTML += `
            <div class="message assistant-message">
                <div class="message-content">
                    <strong>Monica:</strong> <strong>Translation to ${targetLanguage} (sample):</strong><br>${translatedContent}<br><br>
                    <em>Note: This is just a sample of the document. Ask specific questions about sections you want translated.</em>
                </div>
            </div>
        `;

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (error) {
        console.error("Error translating content:", error);

        // Remove typing indicator
        if (document.getElementById('typing-indicator')) {
            document.getElementById('typing-indicator').remove();
        }

        // Display error message
        chatMessages.innerHTML += `
            <div class="message assistant-message">
                <div class="message-content">
                    <strong>Monica:</strong> I encountered an error while translating the content. Please try again.
                </div>
            </div>
        `;
    }
}
