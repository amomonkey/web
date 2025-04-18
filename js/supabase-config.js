// Supabase配置
// 注意：您需要使用自己的Supabase项目URL和API密钥
const SUPABASE_URL = 'https://ymwnsngznsuiwvblhcyo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltd25zbmd6bnN1aXd2YmxoY3lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NDU3MzEsImV4cCI6MjA2MDUyMTczMX0.KmJN9c72Ic7uscQsxtywPP9xlMqEbHzGou_UPy6jr2k';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
        console.log('开始注册流程', { email });
        
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                emailRedirectTo: window.location.origin
            }
        });
        
        console.log('注册结果', { data, error });
        
        if (error) throw error;
        
        showMessage('注册成功！请查收确认邮件，并完成邮箱验证后登录。', 'success');
        
        // 初始化用户数据
        if (data.user) {
            console.log('初始化用户数据', data.user.id);
            await initUserData(data.user.id);
        }
    } catch (error) {
        console.error('注册错误:', error);
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
        console.log('创建用户数据记录', userId);
        const { error } = await supabase
            .from('user_data')
            .insert([{ 
                user_id: userId, 
                options: JSON.stringify(['选项1', '选项2', '选项3', '选项4']),
                history: JSON.stringify([])
            }]);
            
        if (error) {
            console.error('初始化数据错误', error);
            throw error;
        }
        console.log('用户数据初始化成功');
    } catch (error) {
        console.error('初始化用户数据错误:', error.message);
    }
}

// 加载用户数据
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        console.log('开始加载用户数据', currentUser.id);
        const { data, error } = await supabase
            .from('user_data')
            .select('options, history')
            .eq('user_id', currentUser.id)
            .single();
            
        if (error) throw error;
        
        if (data) {
            console.log('用户数据加载成功', data);
            // 加载选项
            if (data.options) {
                try {
                    options = typeof data.options === 'string' 
                        ? JSON.parse(data.options) 
                        : data.options;
                    renderOptions();
                } catch (e) {
                    console.error('解析选项错误', e);
                }
            }
            
            // 加载历史记录
            if (data.history) {
                try {
                    const history = typeof data.history === 'string'
                        ? JSON.parse(data.history)
                        : data.history;
                    renderHistory(history);
                } catch (e) {
                    console.error('解析历史记录错误', e);
                }
            }
            
            // 重绘轮盘
            drawWheel();
        } else {
            // 如果没有找到数据，初始化用户数据
            console.log('未找到用户数据，初始化数据');
            await initUserData(currentUser.id);
        }
    } catch (error) {
        console.error('加载用户数据错误:', error);
        // 如果是没有找到数据的错误，初始化用户数据
        if (error.code === 'PGRST116') {
            console.log('PGRST116错误，初始化用户数据');
            await initUserData(currentUser.id);
        }
    }
}

// 保存用户数据
async function saveUserData() {
    if (!currentUser) return;
    
    const historyItems = Array.from(historyList.children).map(li => li.textContent);
    
    try {
        console.log('保存用户数据', { options, historyCount: historyItems.length });
        const { error } = await supabase
            .from('user_data')
            .update({ 
                options: JSON.stringify(options),
                history: JSON.stringify(historyItems)
            })
            .eq('user_id', currentUser.id);
            
        if (error) throw error;
        console.log('用户数据保存成功');
    } catch (error) {
        console.error('保存用户数据错误:', error);
    }
}

// 清除用户历史记录
async function clearUserHistory() {
    if (!currentUser) return;
    
    try {
        console.log('清除历史记录');
        const { error } = await supabase
            .from('user_data')
            .update({ history: JSON.stringify([]) })
            .eq('user_id', currentUser.id);
            
        if (error) throw error;
        console.log('历史记录清除成功');
    } catch (error) {
        console.error('清除历史记录错误:', error);
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

// 处理URL中的认证参数
async function handleAuthRedirect() {
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const tokenType = urlParams.get('token_type');
    
    if (accessToken && refreshToken && tokenType) {
        try {
            const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
            });
            
            if (error) throw error;
            
            currentUser = data.user;
            updateUserInterface(true);
            loadUserData();
            showMessage('邮箱验证成功！', 'success');
            
            // 清除URL中的认证参数
            window.location.hash = '';
        } catch (error) {
            console.error('认证错误:', error);
            showMessage(`认证失败: ${error.message}`, 'error');
        }
    }
}

// 检查初始会话
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    handleAuthRedirect();
}); 