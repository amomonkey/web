// 页面加载后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取按钮元素
    const button = document.getElementById('clickMe');
    const message = document.getElementById('message');
    
    // 点击次数变量
    let clickCount = 0;
    
    // 为按钮添加点击事件
    button.addEventListener('click', function() {
        clickCount++;
        message.textContent = `您已点击了${clickCount}次！`;
        
        if (clickCount >= 10) {
            message.textContent += " 您真喜欢点按钮啊！";
        }
    });
});
