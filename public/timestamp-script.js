document.addEventListener('DOMContentLoaded', () => {
    // 初始化 dayjs
    dayjs.extend(dayjs_plugin_utc);
    dayjs.extend(dayjs_plugin_relativeTime);
    dayjs.locale('zh-cn');

    // 获取DOM元素
    const mainInput = document.getElementById('mainInput');
    const nowBtn = document.getElementById('nowBtn');
    
    const resultsPanel = document.querySelector('.results-panel');
    const tsSeconds = document.getElementById('tsSeconds');
    const tsMilliseconds = document.getElementById('tsMilliseconds');
    const localTime = document.getElementById('localTime');
    const utcTime = document.getElementById('utcTime');
    const isoTime = document.getElementById('isoTime');
    const relativeTime = document.getElementById('relativeTime');

    // --- 事件监听 ---
    mainInput.addEventListener('input', () => {
        handleConversion(mainInput.value);
    });
    
    nowBtn.addEventListener('click', () => {
        const now = dayjs();
        mainInput.value = now.format('YYYY-MM-DD HH:mm:ss');
        handleConversion(mainInput.value);
    });

    resultsPanel.addEventListener('click', (e) => {
        if (e.target.closest('.copy-btn')) {
            const button = e.target.closest('.copy-btn');
            const targetId = button.dataset.target;
            const textToCopy = document.getElementById(targetId).textContent;
            
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalIcon = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i>';
                button.classList.add('copied');
                
                setTimeout(() => {
                    button.innerHTML = originalIcon;
                    button.classList.remove('copied');
                }, 1500);
            });
        }
    });

    // --- 核心逻辑 ---
    function handleConversion(input) {
        if (!input) {
            clearResults();
            return;
        }

        let date;
        const inputAsNumber = Number(input);

        // 判断输入类型
        if (!isNaN(inputAsNumber) && input.trim() !== '') {
            // 输入是纯数字，判断为时间戳
            // 自动检测是秒还是毫秒 (11位数字以上基本是毫秒)
            date = input.length > 10 ? dayjs(inputAsNumber) : dayjs.unix(inputAsNumber);
        } else {
            // 输入是字符串，尝试解析为日期
            date = dayjs(input);
        }

        if (date.isValid()) {
            updateAll(date);
        } else {
            clearResults();
        }
    }

    function updateAll(date) {
        tsSeconds.textContent = date.unix();
        tsMilliseconds.textContent = date.valueOf();
        localTime.textContent = date.format('YYYY-MM-DD HH:mm:ss');
        utcTime.textContent = date.utc().format('YYYY-MM-DD HH:mm:ss [GMT]');
        isoTime.textContent = date.toISOString();
        relativeTime.textContent = date.fromNow();
    }
    
    function clearResults() {
        const values = [tsSeconds, tsMilliseconds, localTime, utcTime, isoTime, relativeTime];
        values.forEach(el => el.textContent = '-');
    }

    // 页面加载时显示当前时间
    nowBtn.click();
}); 