document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const methodSelect = document.getElementById('methodSelect');
    const urlInput = document.getElementById('urlInput');
    const sendBtn = document.getElementById('sendBtn');
    const paramsContainer = document.getElementById('paramsContainer');
    const headersContainer = document.getElementById('headersContainer');
    const bodyTextarea = document.getElementById('bodyTextarea');
    const addParamBtn = document.getElementById('addParamBtn');
    const addHeaderBtn = document.getElementById('addHeaderBtn');
    const addFormDataBtn = document.getElementById('addFormDataBtn');
    const responsePanel = document.getElementById('responsePanel');
    const statusText = document.getElementById('statusText');
    const timeText = document.getElementById('timeText');
    const sizeText = document.getElementById('sizeText');
    const responseBody = document.getElementById('responseBody');
    const responseHeaders = document.getElementById('responseHeaders');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    let requestHistory = [];

    // --- Event Listeners ---
    addParamBtn.addEventListener('click', () => addKeyValuePair(paramsContainer));
    addHeaderBtn.addEventListener('click', () => addKeyValuePair(headersContainer));
    addFormDataBtn.addEventListener('click', () => addFormDataPair(formDataContainer));
    sendBtn.addEventListener('click', sendRequest);
    clearHistoryBtn.addEventListener('click', clearHistory);
    historyList.addEventListener('click', loadFromHistory);
    
    document.querySelector('.body-type-selector').addEventListener('change', (e) => {
        document.getElementById('body-content-json').style.display = 'none';
        document.getElementById('body-content-form-data').style.display = 'none';
        
        if (e.target.value === 'json') {
            document.getElementById('body-content-json').style.display = 'block';
        } else if (e.target.value === 'form-data') {
            document.getElementById('body-content-form-data').style.display = 'block';
        }
    });

    setupTabs('.tabs', '.tab-content');
    setupTabs('.response-tabs', '.response-tab-content');

    // --- Functions ---
    function setupTabs(tabContainerSelector, tabContentSelector) {
        const tabContainer = document.querySelector(tabContainerSelector);
        tabContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const tab = e.target.dataset.tab;
                
                // Handle active state for tabs
                tabContainer.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');

                // Show correct content
                document.querySelectorAll(tabContentSelector).forEach(content => {
                    content.style.display = content.id === tab ? 'block' : 'none';
                });
            }
        });
    }

    function addKeyValuePair(container, key = '', value = '') {
        const div = document.createElement('div');
        div.className = 'kv-pair';
        div.innerHTML = `
            <input type="text" placeholder="Key" value="${key}">
            <input type="text" placeholder="Value" value="${value}">
            <button class="remove-btn"><i class="fas fa-trash"></i></button>
        `;
        div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
        container.appendChild(div);
    }

    function addFormDataPair(container, key = '', value = '') {
        const div = document.createElement('div');
        div.className = 'kv-pair';
        // Simplified for history loading, only supports text type restoration
        div.innerHTML = `
            <input type="text" placeholder="Key" value="${key}">
            <input type="text" placeholder="Value" class="form-data-value" value="${value}">
            <input type="file" style="display: none;" class="form-data-file">
            <button class="type-toggle-btn">Text</button>
            <button class="remove-btn"><i class="fas fa-trash"></i></button>
        `;
        const valueInput = div.querySelector('.form-data-value');
        const fileInput = div.querySelector('.form-data-file');
        const toggleBtn = div.querySelector('.type-toggle-btn');

        toggleBtn.addEventListener('click', () => {
            if (toggleBtn.textContent === 'Text') {
                toggleBtn.textContent = 'File';
                valueInput.style.display = 'none';
                fileInput.style.display = 'block';
            } else {
                toggleBtn.textContent = 'Text';
                valueInput.style.display = 'block';
                fileInput.style.display = 'none';
            }
        });

        div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
        container.appendChild(div);
    }

    function getKeyValuePairs(container) {
        const pairs = [];
        container.querySelectorAll('.kv-pair').forEach(div => {
            const key = div.children[0].value;
            const value = div.children[1].value;
            if (key) {
                pairs.push({ key, value });
            }
        });
        return pairs;
    }

    function getFormDataPairs() {
        const pairs = [];
        document.querySelectorAll('#formDataContainer .kv-pair').forEach(div => {
            const key = div.querySelector('input[type="text"]').value;
            const valueInput = div.querySelector('.form-data-value');
            const type = valueInput.style.display !== 'none' ? 'Text' : 'File';
            const value = type === 'Text' ? valueInput.value : ''; // Note: We don't save file content in history
            if (key) {
                pairs.push({ key, value, type });
            }
        });
        return pairs;
    }

    async function sendRequest() {
        let url = urlInput.value.trim();
        if (!url) {
            alert('Please enter a URL.');
            return;
        }

        loadingIndicator.style.display = 'block';
        responsePanel.style.display = 'none';
        
        const startTime = Date.now();
        const method = methodSelect.value;
        const bodyType = document.querySelector('input[name="body-type"]:checked').value;

        let proxyBody;
        const proxyHeaders = { 'Content-Type': 'application/json' };

        // Build the request to our proxy
        if (bodyType === 'form-data') {
            const formData = new FormData();
            formData.append('url', url);
            formData.append('method', method);
            
            const headers = getKeyValuePairs(headersContainer);
            formData.append('headers', JSON.stringify(headers));

            document.querySelectorAll('#formDataContainer .kv-pair').forEach(div => {
                const key = div.querySelector('input[type="text"]').value;
                const valueInput = div.querySelector('.form-data-value');
                const fileInput = div.querySelector('.form-data-file');
                if (key) {
                    if (valueInput.style.display !== 'none') {
                        formData.append(key, valueInput.value);
                    } else if (fileInput.files.length > 0) {
                        formData.append(key, fileInput.files[0]);
                    }
                }
            });
            proxyBody = formData;
            delete proxyHeaders['Content-Type']; // Let browser set multipart header
        } else {
             const headers = getKeyValuePairs(headersContainer);
             let body = null;
             if (bodyType === 'json' && (method !== 'GET' && method !== 'HEAD')) {
                 body = bodyTextarea.value;
             }
             proxyBody = JSON.stringify({ url, method, headers, body });
        }

        // Construct URL with params
        const params = new URLSearchParams(getKeyValuePairs(paramsContainer));
        const queryString = params.toString();
        if (queryString) {
            url += (url.includes('?') ? '&' : '?') + queryString;
        }

        try {
            const response = await fetch('/api-proxy', {
                method: 'POST',
                headers: proxyHeaders,
                body: proxyBody,
            });

            const data = await response.json();
            
            if(data.error) {
                throw new Error(data.error);
            }

            renderResponse(data, Date.now() - startTime);
            saveRequestToHistory();

        } catch (error) {
            renderError(error);
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    function renderResponse(data, duration) {
        responsePanel.style.display = 'block';

        // Status
        statusText.textContent = `${data.status} ${data.statusText}`;
        statusText.className = 'status-code'; // reset
        if (data.status >= 200 && data.status < 300) statusText.classList.add('success');
        else if (data.status >= 400 && data.status < 500) statusText.classList.add('client-error');
        else if (data.status >= 500) statusText.classList.add('server-error');
        else if (data.status >= 300 && data.status < 400) statusText.classList.add('redirect');
        
        // Meta
        timeText.textContent = `${duration} ms`;
        sizeText.textContent = `${(JSON.stringify(data.body).length / 1024).toFixed(2)} KB`;

        // Body
        try {
            const formattedBody = JSON.stringify(data.body, null, 2);
            responseBody.textContent = formattedBody;
            hljs.highlightElement(responseBody);
        } catch (e) {
            responseBody.textContent = data.body;
        }

        // Headers
        responseHeaders.textContent = JSON.stringify(data.headers, null, 2);
        hljs.highlightElement(responseHeaders);
    }

    function renderError(error) {
        responsePanel.style.display = 'block';
        statusText.textContent = 'Error';
        statusText.className = 'status-code server-error';
        timeText.textContent = '-';
        sizeText.textContent = '-';
        responseBody.textContent = error.message;
        responseHeaders.textContent = '{}';
        hljs.highlightElement(responseBody);
        hljs.highlightElement(responseHeaders);
    }

    // --- History Functions ---
    function saveRequestToHistory() {
        const requestData = {
            id: Date.now(),
            method: methodSelect.value,
            url: urlInput.value,
            params: getKeyValuePairs(paramsContainer),
            headers: getKeyValuePairs(headersContainer),
            bodyType: document.querySelector('input[name="body-type"]:checked').value,
            body: bodyTextarea.value,
            formData: getFormDataPairs(), // Note: file content is not saved
        };

        // Avoid saving exact duplicates at the top of the history
        if (requestHistory.length > 0 && 
            requestHistory[0].url === requestData.url && 
            requestHistory[0].method === requestData.method &&
            JSON.stringify(requestHistory[0].params) === JSON.stringify(requestData.params)
            ) {
            return;
        }

        requestHistory.unshift(requestData); // Add to the beginning

        if (requestHistory.length > 20) { // Keep history limited to 20 items
            requestHistory.pop();
        }

        localStorage.setItem('requestHistory', JSON.stringify(requestHistory));
        renderHistory();
    }

    function loadHistory() {
        const savedHistory = localStorage.getItem('requestHistory');
        if (savedHistory) {
            requestHistory = JSON.parse(savedHistory);
        }
        renderHistory();
    }

    function renderHistory() {
        historyList.innerHTML = '';
        if (requestHistory.length === 0) {
            historyList.innerHTML = '<li>没有历史记录</li>';
            clearHistoryBtn.style.display = 'none';
            return;
        }
        
        clearHistoryBtn.style.display = 'block';
        requestHistory.forEach(req => {
            const li = document.createElement('li');
            li.dataset.id = req.id;
            li.title = `${req.method} ${req.url}`;
            li.innerHTML = `
                <span class="history-method ${req.method}">${req.method}</span>
                <span class="history-url">${req.url}</span>
            `;
            historyList.appendChild(li);
        });
    }

    function loadFromHistory(e) {
        const li = e.target.closest('li');
        if (!li || !li.dataset.id) return;
        
        const requestId = Number(li.dataset.id);
        const requestData = requestHistory.find(req => req.id === requestId);

        if (requestData) {
            historyList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
            li.classList.add('active');

            methodSelect.value = requestData.method;
            urlInput.value = requestData.url;

            paramsContainer.innerHTML = '';
            requestData.params.forEach(p => addKeyValuePair(paramsContainer, p.key, p.value));
            
            headersContainer.innerHTML = '';
            requestData.headers.forEach(h => addKeyValuePair(headersContainer, h.key, h.value));

            const bodyTypeRadio = document.querySelector(`input[name="body-type"][value="${requestData.bodyType}"]`);
            if(bodyTypeRadio) {
                bodyTypeRadio.checked = true;
                bodyTypeRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            if (requestData.bodyType === 'json') {
                bodyTextarea.value = requestData.body || '';
            } else if (requestData.bodyType === 'form-data') {
                formDataContainer.innerHTML = '';
                 if(requestData.formData){
                    requestData.formData.forEach(item => {
                        if (item.type === 'Text') {
                             addFormDataPair(formDataContainer, item.key, item.value);
                        }
                    });
                }
            } else {
                 bodyTextarea.value = '';
                 formDataContainer.innerHTML = '';
            }
        }
    }

    function clearHistory() {
        if (confirm('确定要清空所有历史记录吗?')) {
            requestHistory = [];
            localStorage.removeItem('requestHistory');
            renderHistory();
        }
    }

    function init() {
        loadHistory();
        // Add one empty row for user convenience
        addKeyValuePair(paramsContainer);
        addKeyValuePair(headersContainer);
        addFormDataPair(formDataContainer);
    }

    init();
}); 