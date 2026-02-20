(function () {
    // Configuration
    const SCRIPT_TAG = document.currentScript;
    const TENANT_ID = SCRIPT_TAG.getAttribute('data-tenant-id');
    const BASE_URL = SCRIPT_TAG.src.substring(0, SCRIPT_TAG.src.lastIndexOf('/')); // infer base url from script location
    // const BASE_URL = "http://localhost:3000"; // For dev validation

    if (!TENANT_ID) {
        console.error('RelateAI Widget: data-tenant-id attribute is missing.');
        return;
    }

    // Styles
    const style = document.createElement('style');
    style.innerHTML = `
        #relate-ai-widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: sans-serif;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 10px;
        }
        #relate-ai-chat-frame {
            width: 350px;
            height: 500px;
            border: none;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            background: white;
            transition: all 0.3s ease;
            transform-origin: bottom right;
            opacity: 0;
            pointer-events: none;
            transform: scale(0.9);
            position: absolute;
            bottom: 70px; /* Space for button */
            right: 0;
        }
        #relate-ai-chat-frame.open {
            opacity: 1;
            pointer-events: all;
            transform: scale(1);
        }
        #relate-ai-toggle-btn {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: #000; /* Default black, can be overridden */
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
        }
        #relate-ai-toggle-btn:hover {
            transform: scale(1.05);
        }
        #relate-ai-toggle-btn svg {
            width: 30px;
            height: 30px;
        }
    `;
    document.head.appendChild(style);

    // Container
    const container = document.createElement('div');
    container.id = 'relate-ai-widget-container';
    document.body.appendChild(container);

    // Iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'relate-ai-chat-frame';
    iframe.src = `${BASE_URL}/embed/${TENANT_ID}`;
    // In production, BASE_URL should be the real domain e.g. https://relate-ai.com
    // For now we try to detect or hardcode if needed. 
    // If the script is loaded from https://relate-ai.com/widget.js, BASE_URL is https://relate-ai.com

    container.appendChild(iframe);

    // Button
    const btn = document.createElement('button');
    btn.id = 'relate-ai-toggle-btn';
    btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    `;
    container.appendChild(btn);

    // Logic
    let isOpen = false;
    btn.onclick = () => {
        isOpen = !isOpen;
        if (isOpen) {
            iframe.classList.add('open');
            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            `;
        } else {
            iframe.classList.remove('open');
            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            `;
        }
    };

})();
