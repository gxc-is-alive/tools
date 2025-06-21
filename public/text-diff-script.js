document.addEventListener('DOMContentLoaded', () => {
    const text1 = document.getElementById('text1');
    const text2 = document.getElementById('text2');
    const compareBtn = document.getElementById('compareBtn');
    const diffOutput = document.getElementById('diffOutput');
    const resultContainer = document.getElementById('resultContainer');

    // 默认隐藏结果区域
    resultContainer.style.display = 'none';

    compareBtn.addEventListener('click', () => {
        const str1 = text1.value;
        const str2 = text2.value;

        // 使用 jsdiff 库进行比对 (修正：使用 Diff 对象)
        const diff = Diff.diffLines(str1, str2, { newlineIsToken: true });

        // 清空之前的结果
        diffOutput.innerHTML = '';

        if (diff.length === 1 && !diff[0].added && !diff[0].removed) {
            // 文本完全相同
            const noDiffElement = document.createElement('div');
            noDiffElement.style.color = '#27ae60';
            noDiffElement.style.fontWeight = 'bold';
            noDiffElement.textContent = '两段文本完全相同。';
            diffOutput.appendChild(noDiffElement);
        } else {
            // 存在差异
            const fragment = document.createDocumentFragment();
            diff.forEach(part => {
                const span = document.createElement('span');
                
                // 根据差异类型设置不同颜色
                // 红色表示删除，绿色表示添加
                const color = part.added ? 'green' :
                    part.removed ? 'red' : 'grey';
                
                const element = part.added ? document.createElement('ins') :
                    part.removed ? document.createElement('del') :
                    document.createElement('span');
                
                element.appendChild(document.createTextNode(part.value));
                fragment.appendChild(element);
            });
            diffOutput.appendChild(fragment);
        }
        
        // 显示结果区域
        resultContainer.style.display = 'block';
    });
}); 