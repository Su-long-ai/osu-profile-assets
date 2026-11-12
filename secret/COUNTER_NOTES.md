# Archive 036：解锁人数统计

上线时间：2026-11-13（仅计上线后的事件；无法追溯历史）。

数据页面：https://su-long-ai.github.io/osu-profile-assets/secret/stats.html

- B-Side：首次揭开文字遮罩；
- C-Side：正确完成 DFJK；
- D-Side：完成 2020 → 2025 年份谜题；
- 星图：首次点开星图密语。

机制：每个浏览器使用 localStorage 记录各关卡是否成功上报过，避免重复点按多次累计。页面访问、加载、鼠标经过均不计数。没有账号登录，因此换浏览器、清除本地数据可能重复计算；屏蔽统计或请求失败可能漏算。

计数服务：CountAPI `https://countapi.mileshilliard.com/api/v1/`。独立键名：`archive036_20261113_b_side`、`archive036_20261113_c_side`、`archive036_20261113_d_side`、`archive036_20261113_star_whisper`。

**站长排除**：`secret/metrics.js` 保存的是 SHA-256 验证摘要，站长私密激活链接只在私下发送，不要放进 GitHub。用带 `#owner=` 的私密链接分别在每个站长浏览器中打开，激活后会显示 `OWNER VIEW / NOT COUNTED`。数据不回溯删除：必须在首次解锁前激活。

不向 CountAPI 上传 osu! 用户名或设备 ID，服务端仍会收到一般网络请求信息。数据是浏览器级别**近似人数**，而非可信身份人数；免费公开 API 的数字无法防恶意刷量和篡改。需要严谨数据时应换成有认证和持久化的服务端后端。

GitHub Actions `secret-analytics-smoke.yml` 已对计数 API 写入、读取、CORS 和 JS 语法做测试，专用测试计数键不影响上述四个正式计数键。

请不要把本站的“原有 osu! 主页未改动”与“隐藏档案新增脚本”混为一谈；所有统计事件只发生在秘密档案页面，不会统计 osu! 自带的资料页点击。