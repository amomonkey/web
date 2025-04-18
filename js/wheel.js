// 获取DOM元素
const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const addOptionBtn = document.getElementById('add-option');
const newOptionInput = document.getElementById('new-option');
const optionsList = document.getElementById('options');
const historyList = document.getElementById('history');
const clearHistoryBtn = document.getElementById('clear-history');

// 获取canvas上下文
const ctx = wheel.getContext('2d');

// 初始化轮盘选项
let options = [
    '选项1', 
    '选项2', 
    '选项3',
    '选项4'
];

// 轮盘颜色
const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
    '#9966FF', '#FF9F40', '#8AC249', '#EA526F',
    '#25CCF7', '#FD7272', '#54a0ff', '#1dd1a1'
];

// 轮盘参数
const centerX = wheel.width / 2;
const centerY = wheel.height / 2;
const radius = Math.min(centerX, centerY) - 10;

// 旋转相关变量
let rotationAngle = 0;
let isSpinning = false;
let spinTimeout = null;
let startAngle = 0;
let spinAngleStart = 0;
let spinTime = 0;
let spinTimeTotal = 0;

// 从本地存储加载数据
function loadFromLocalStorage() {
    const savedOptions = localStorage.getItem('wheelOptions');
    const savedHistory = localStorage.getItem('wheelHistory');
    
    if (savedOptions) {
        options = JSON.parse(savedOptions);
        renderOptions();
    }
    
    if (savedHistory) {
        const history = JSON.parse(savedHistory);
        renderHistory(history);
    }
}

// 保存数据到本地存储
function saveToLocalStorage() {
    localStorage.setItem('wheelOptions', JSON.stringify(options));
    
    const historyItems = Array.from(historyList.children).map(li => li.textContent);
    localStorage.setItem('wheelHistory', JSON.stringify(historyItems));
}

// 绘制轮盘
function drawWheel() {
    // 清除之前的轮盘
    ctx.clearRect(0, 0, wheel.width, wheel.height);
    
    // 如果没有选项则显示提示
    if (options.length === 0) {
        ctx.font = '20px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText('请添加选项', centerX, centerY);
        return;
    }
    
    // 计算每个选项的弧度
    const arc = Math.PI * 2 / options.length;
    
    // 绘制轮盘扇形
    for (let i = 0; i < options.length; i++) {
        const angle = startAngle + i * arc;
        const color = colors[i % colors.length];
        
        // 绘制扇形
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, angle, angle + arc);
        ctx.lineTo(centerX, centerY);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制文字
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        
        // 计算文字位置
        const text = options[i];
        const textRadius = radius - 40;
        
        // 绘制文字，根据长度可能需要调整字体大小
        if (text.length > 8) {
            ctx.font = '12px Arial';
        }
        
        ctx.fillText(text, textRadius, 5);
        ctx.restore();
    }
    
    // 绘制中心圆
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#cccccc';
    ctx.stroke();
}

// 旋转轮盘动画
function rotateWheel() {
    spinTime += 30;
    if (spinTime >= spinTimeTotal) {
        stopRotateWheel();
        return;
    }
    
    // 计算当前旋转角度，使用缓动函数
    const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
    startAngle += (spinAngle * Math.PI / 180);
    drawWheel();
    spinTimeout = setTimeout(rotateWheel, 30);
}

// 缓动函数，使轮盘逐渐减速
function easeOut(t, b, c, d) {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
}

// 停止轮盘旋转，显示结果
function stopRotateWheel() {
    clearTimeout(spinTimeout);
    isSpinning = false;
    
    // 计算结果
    const degrees = startAngle * 180 / Math.PI + 90;
    const arcd = 360 / options.length;
    const index = Math.floor((360 - degrees % 360) / arcd);
    const result = options[index];
    
    // 添加到历史记录
    addToHistory(result);
    
    // 保存数据
    saveToLocalStorage();
}

// 开始旋转
function spin() {
    if (isSpinning || options.length === 0) return;
    
    isSpinning = true;
    spinBtn.disabled = true;
    
    // 设置旋转参数
    spinAngleStart = Math.random() * 10 + 10;
    spinTime = 0;
    spinTimeTotal = Math.random() * 3000 + 4000; // 随机旋转时间，4-7秒
    
    rotateWheel();
    
    setTimeout(() => {
        spinBtn.disabled = false;
    }, spinTimeTotal);
}

// 添加选项
function addOption() {
    const optionText = newOptionInput.value.trim();
    if (optionText && !options.includes(optionText)) {
        options.push(optionText);
        newOptionInput.value = '';
        renderOptions();
        drawWheel();
        saveToLocalStorage();
    }
}

// 删除选项
function deleteOption(index) {
    options.splice(index, 1);
    renderOptions();
    drawWheel();
    saveToLocalStorage();
}

// 渲染选项列表
function renderOptions() {
    optionsList.innerHTML = '';
    options.forEach((option, index) => {
        const li = document.createElement('li');
        li.textContent = option;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '删除';
        deleteBtn.classList.add('delete-option');
        deleteBtn.addEventListener('click', () => deleteOption(index));
        
        li.appendChild(deleteBtn);
        optionsList.appendChild(li);
    });
}

// 添加到历史记录
function addToHistory(result) {
    const now = new Date();
    const timeString = now.toLocaleString();
    
    const li = document.createElement('li');
    li.textContent = `${timeString}: ${result}`;
    
    historyList.prepend(li);
}

// 渲染历史记录
function renderHistory(historyItems) {
    historyList.innerHTML = '';
    historyItems.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        historyList.appendChild(li);
    });
}

// 清除历史记录
function clearHistory() {
    historyList.innerHTML = '';
    localStorage.removeItem('wheelHistory');
}

// 初始化
function init() {
    // 加载本地存储数据
    loadFromLocalStorage();
    
    // 初始绘制轮盘
    drawWheel();
    
    // 事件监听
    spinBtn.addEventListener('click', spin);
    addOptionBtn.addEventListener('click', addOption);
    newOptionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addOption();
    });
    clearHistoryBtn.addEventListener('click', clearHistory);
}

// 启动应用
window.addEventListener('load', init); 