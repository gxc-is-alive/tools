document.addEventListener('DOMContentLoaded', () => {
    const plainText = document.getElementById('plainText');
    const base64Text = document.getElementById('base64Text');
    const encodeBtn = document.getElementById('encodeBtn');
    const decodeBtn = document.getElementById('decodeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const fileInput = document.getElementById('fileInput');
    const fileDropArea = document.getElementById('fileDropArea');
    const fileInfo = document.getElementById('fileInfo');
    const imagePreviewSection = document.getElementById('imagePreviewSection');
    const decodedImage = document.getElementById('decodedImage');
    const downloadImageBtn = document.getElementById('downloadImageBtn');

    // --- 事件监听 ---

    // 实时输入
    plainText.addEventListener('input', () => handleEncode());
    base64Text.addEventListener('input', () => handleDecode());
    
    // 按钮点击
    encodeBtn.addEventListener('click', () => handleEncode(true));
    decodeBtn.addEventListener('click', () => handleDecode(true));
    clearBtn.addEventListener('click', clearAll);

    // 文件上传
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    
    // 拖拽上传
    fileDropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropArea.classList.add('dragover');
    });
    fileDropArea.addEventListener('dragleave', () => {
        fileDropArea.classList.remove('dragover');
    });
    fileDropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropArea.classList.remove('dragover');
        handleFile(e.dataTransfer.files[0]);
    });

    // --- 核心函数 ---

    function handleEncode(force = false) {
        try {
            // 使用TextEncoder来确保正确的UTF-8编码
            const encoder = new TextEncoder();
            const utf8Bytes = encoder.encode(plainText.value);
            // btoa需要一个字符一个字节的字符串
            const binaryString = String.fromCharCode(...utf8Bytes);
            base64Text.value = btoa(binaryString);
            base64Text.classList.remove('error');
        } catch (e) {
            if (force) {
                base64Text.value = '编码错误: ' + e.message;
                base64Text.classList.add('error');
            }
        }
    }

    function handleDecode(force = false) {
        try {
            const b64_string = base64Text.value;
            // 使用TextDecoder来正确解析UTF-8
            const binaryString = atob(b64_string);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const decoder = new TextDecoder('utf-8');
            plainText.value = decoder.decode(bytes);
            plainText.classList.remove('error');

            // 尝试解码成图片
            tryToDecodeAsImage(b64_string);

        } catch (e) {
            if (force) {
                plainText.value = '解码错误: ' + e.message;
                plainText.classList.add('error');
                imagePreviewSection.style.display = 'none';
            }
        }
    }

    function tryToDecodeAsImage(b64_string) {
        // 简单的 image mime type 检测
        const mimeRegex = /^(data:image\/(jpeg|png|gif|svg\+xml|webp);base64,)/;
        let final_b64_string = b64_string;
        let mime_type = 'image/png'; // 默认

        if(mimeRegex.test(b64_string)) {
            // base64字符串已包含mime类型
            mime_type = b64_string.match(mimeRegex)[1];
        } else {
            // 尝试添加常见的mime类型
            final_b64_string = `data:image/png;base64,${b64_string}`;
        }
        
        decodedImage.src = final_b64_string;
        decodedImage.onload = () => {
            imagePreviewSection.style.display = 'block';
            downloadImageBtn.href = final_b64_string;
            const extension = (mime_type.split('/')[1] || 'png').split('+')[0];
            downloadImageBtn.download = `decoded_image.${extension}`;
        };
        decodedImage.onerror = () => {
            imagePreviewSection.style.display = 'none';
        };
    }
    
    function handleFile(file) {
        if (!file) return;

        fileInfo.textContent = `文件名: ${file.name} | 大小: ${(file.size / 1024).toFixed(2)} KB`;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            // 从data URL中提取Base64部分
            const base64Content = dataUrl.split(',')[1];
            
            base64Text.value = base64Content;
            plainText.value = `--- 文件: ${file.name} ---\n(文件内容已编码至右侧)`;
            plainText.classList.remove('error');
            base64Text.classList.remove('error');
        };
        reader.onerror = (e) => {
            plainText.value = "文件读取错误: " + e.target.error;
            plainText.classList.add('error');
        };
        
        reader.readAsDataURL(file);
    }

    function clearAll() {
        plainText.value = '';
        base64Text.value = '';
        fileInput.value = '';
        fileInfo.textContent = '';
        plainText.classList.remove('error');
        base64Text.classList.remove('error');
        imagePreviewSection.style.display = 'none';
    }
}); 