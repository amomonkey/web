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
        
        // 等待短暂时间，确保身份验证完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 先检查用户数据是否已存在
        const { data: existingData, error: checkError } = await supabase
            .from('user_data')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
            
        if (!checkError && existingData) {
            console.log('用户数据已存在，跳过创建');
            return;
        }
        
        // 创建新的用户数据
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
        console.error('初始化用户数据错误:', error);
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

// 检查初始会话
document.addEventListener('DOMContentLoaded', checkSession);

// 手动创建用户数据
async function manuallyCreateUserData() {
    if (!currentUser) {
        showMessage('请先登录', 'error');
        return;
    }
    
    try {
        showMessage('尝试创建用户数据...', 'info');
        await initUserData(currentUser.id);
        showMessage('用户数据创建成功', 'success');
    } catch (error) {
        showMessage('创建失败: ' + error.message, 'error');
    }
}

// 添加一个隐藏的按钮触发手动创建功能
document.addEventListener('DOMContentLoaded', function() {
    // 创建一个隐藏按钮
    const fixButton = document.createElement('button');
    fixButton.textContent = '修复数据';
    fixButton.style.marginTop = '10px';
    fixButton.style.display = 'none'; // 默认隐藏
    
    // 添加到用户信息容器
    if (userInfoContainer) {
        userInfoContainer.appendChild(fixButton);
    }
    
    // 添加点击事件
    fixButton.addEventListener('click', manuallyCreateUserData);
    
    // 添加快捷键 Ctrl+Shift+F 显示按钮
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'F') {
            fixButton.style.display = fixButton.style.display === 'none' ? 'block' : 'none';
        }
    });
}); 