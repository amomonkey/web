// Supabase配置
// 注意：您需要使用自己的Supabase项目URL和API密钥
const SUPABASE_URL = 'https://your-project-url.supabase.co';
const SUPABASE_KEY = 'your-supabase-anon-key';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 获取DOM元素
const userEmailInput = document.getElementById('user-email');
const userPasswordInput = document.getElementById('user-password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfoContainer = document.getElementById('user-info');
const loginContainer = document.getElementById('login-container');
const currentUserSpan = document.getElementById('current-user');
const authMessage = document.getElementById('auth-message');

// 全局变量
let currentUser = null;

// 检查当前会话状态
async function checkSession() {
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (data.session) {
            currentUser = data.session.user;
            updateUserInterface(true);
            loadUserData();
        }
    } catch (error) {
        console.error('会话检查错误:', error.message);
    }
}

// 用户注册
async function signUp() {
    const email = userEmailInput.value.trim();
    const password = userPasswordInput.value.trim();
    
    if (!email || !password) {
        showMessage('请输入邮箱和密码', 'error');
        return;
    }
    
    try {
        showMessage('注册中...', 'info');
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password 
        });
        
        if (error) throw error;
        
        showMessage('注册成功，请检查邮箱验证', 'success');
        
        // 初始化用户数据
        if (data.user) {
            await initUserData(data.user.id);
        }
    } catch (error) {
        showMessage(`注册失败: ${error.message}`, 'error');
    }
}

// 用户登录
async function logIn() {
    const email = userEmailInput.value.trim();
    const password = userPasswordInput.value.trim();
    
    if (!email || !password) {
        showMessage('请输入邮箱和密码', 'error');
        return;
    }
    
    try {
        showMessage('登录中...', 'info');
        const { data, error } = await supabase.auth.signInWithPassword({ 
            email, 
            password 
        });
        
        if (error) throw error;
        
        userEmailInput.value = '';
        userPasswordInput.value = '';
        
        currentUser = data.user;
        showMessage('登录成功', 'success');
        updateUserInterface(true);
        loadUserData();
    } catch (error) {
        showMessage(`登录失败: ${error.message}`, 'error');
    }
}

// 用户退出
async function logOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        updateUserInterface(false);
        
        // 重置为默认选项
        options = ['选项1', '选项2', '选项3', '选项4'];
        historyList.innerHTML = '';
        renderOptions();
        drawWheel();
        
        showMessage('已退出登录', 'info');
    } catch (error) {
        showMessage(`退出失败: ${error.message}`, 'error');
    }
}

// 初始化用户数据
async function initUserData(userId) {
    try {
        const { error } = await supabase
            .from('user_data')
            .insert([{ 
                user_id: userId, 
                options: ['选项1', '选项2', '选项3', '选项4'],
                history: []
            }]);
            
        if (error) throw error;
    } catch (error) {
        console.error('初始化用户数据错误:', error.message);
    }
}

// 加载用户数据
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        const { data, error } = await supabase
            .from('user_data')
            .select('options, history')
            .eq('user_id', currentUser.id)
            .single();
            
        if (error) throw error;
        
        if (data) {
            // 加载选项
            if (data.options && data.options.length > 0) {
                options = data.options;
                renderOptions();
            }
            
            // 加载历史记录
            if (data.history && data.history.length > 0) {
                renderHistory(data.history);
            }
            
            // 重绘轮盘
            drawWheel();
        } else {
            // 如果没有找到数据，初始化用户数据
            await initUserData(currentUser.id);
        }
    } catch (error) {
        console.error('加载用户数据错误:', error.message);
        // 如果是没有找到数据的错误，初始化用户数据
        if (error.code === 'PGRST116') {
            await initUserData(currentUser.id);
        }
    }
}

// 保存用户数据
async function saveUserData() {
    if (!currentUser) return;
    
    const historyItems = Array.from(historyList.children).map(li => li.textContent);
    
    try {
        const { error } = await supabase
            .from('user_data')
            .update({ 
                options: options,
                history: historyItems
            })
            .eq('user_id', currentUser.id);
            
        if (error) throw error;
    } catch (error) {
        console.error('保存用户数据错误:', error.message);
    }
}

// 清除用户历史记录
async function clearUserHistory() {
    if (!currentUser) return;
    
    try {
        const { error } = await supabase
            .from('user_data')
            .update({ history: [] })
            .eq('user_id', currentUser.id);
            
        if (error) throw error;
    } catch (error) {
        console.error('清除历史记录错误:', error.message);
    }
}

// 更新用户界面
function updateUserInterface(isLoggedIn) {
    if (isLoggedIn && currentUser) {
        loginContainer.style.display = 'none';
        userInfoContainer.style.display = 'block';
        currentUserSpan.textContent = currentUser.email;
    } else {
        loginContainer.style.display = 'block';
        userInfoContainer.style.display = 'none';
    }
}

// 显示消息
function showMessage(message, type = 'info') {
    authMessage.textContent = message;
    authMessage.className = `message ${type}`;
    
    // 5秒后自动清除消息
    setTimeout(() => {
        authMessage.textContent = '';
        authMessage.className = 'message';
    }, 5000);
}

// 事件监听
loginBtn.addEventListener('click', logIn);
signupBtn.addEventListener('click', signUp);
logoutBtn.addEventListener('click', logOut);

// 检查初始会话
document.addEventListener('DOMContentLoaded', checkSession); 