# 决策轮盘

这是一个帮助您在难以做决定时的轮盘工具。当您无法在多个选项中做选择时，可以利用随机概率来帮助决策。

## 功能特点

- 可视化的彩色轮盘界面
- 添加、删除自定义选项
- 支持云端数据存储 (Supabase)
- 用户账户系统，保存个人选项和历史
- 记录历史决策结果
- 响应式设计，支持各种设备

## 使用方法

1. 添加您的决策选项（如"吃中餐"、"吃西餐"等）
2. 点击"旋转"按钮开始随机选择
3. 轮盘停止后，将显示随机选中的结果
4. 结果会自动保存到历史记录中
5. 可选择注册账户，跨设备同步数据

## 技术实现

- 原生JavaScript实现轮盘动画
- 使用Canvas绘制轮盘
- Supabase提供云端数据存储和用户认证
- 在未登录状态使用localStorage作为备用存储

## Supabase配置

使用此应用前，您需要：

1. 创建Supabase账户和项目（https://supabase.com）
2. 在Supabase中创建`user_data`表，包含以下字段：
   - `id`: uuid (主键)
   - `user_id`: uuid (外键，关联auth.users表)
   - `options`: jsonb[]
   - `history`: jsonb[]
3. 设置适当的行级安全策略(RLS)
4. 更新`js/supabase-config.js`文件中的项目URL和API密钥

## 本地运行

直接在浏览器中打开`index.html`文件即可使用。

## 在线访问

项目托管在GitHub Pages上：https://amomonkey.github.io/web/
