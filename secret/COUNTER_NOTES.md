# Archive 036：解锁人数统计

上线时间：2026-11-13（仅计上线后的事件；无法追溯历史）。

数据页面：https://su-long-ai.github.io/osu-profile-assets/secret/stats.html

- B-Side：首次揭开文字遮罩；
- C-Side：正确完成 DFJK；
- D-Side：完成 2020 → 2025 年份谜题；
- 星图：首次点开星图密语。
- E-Side：解锁星图密语后，在顶部档案编号按顺序输入 `0→3→6`，首次解锁 E-Side。键盘和触摸均支持。

机制：每个浏览器使用 localStorage 记录各关卡是否成功上报过，避免重复点按多次累计。页面访问、加载、鼠标经过均不计数。没有账号登录，因此换浏览器、清除本地数据可能重复计算；屏蔽统计或请求失败可能漏算。

计数服务：CountAPI `https://countapi.mileshilliard.com/api/v1/`。独立键名：`archive036_20261113_b_side`、`archive036_20261113_c_side`、`archive036_20261113_d_side`、`archive036_20261113_star_whisper`、`archive036_20261113_e_side`。

**站长排除**：`secret/metrics.js` 保存的是 SHA-256 验证摘要，站长私密激活链接只在私下发送，不要放进 GitHub。用带 `#owner=` 的私密链接分别在每个站长浏览器中打开，激活后会显示 `OWNER VIEW / NOT COUNTED`。数据不回溯删除：必须在首次解锁前激活。

不向 CountAPI 上传 osu! 用户名或设备 ID，服务端仍会收到一般网络请求信息。数据是浏览器级别**近似人数**，而非可信身份人数；免费公开 API 的数字无法防恶意刷量和篡改。需要严谨数据时应换成有认证和持久化的服务端后端。

GitHub Actions `secret-analytics-smoke.yml` 已对计数 API 写入、读取、CORS 和 JS 语法做测试，专用测试计数键不影响上述五个正式计数键。

请不要把本站的“原有 osu! 主页未改动”与“隐藏档案新增脚本”混为一谈；所有统计事件只发生在秘密档案页面，不会统计 osu! 自带的资料页点击。

## 2026-11-13 · 非线性重构
原先所有 B-E 阶段全部保留在 \`secret/tape.html\`，不再挤在 \`secret/index.html\` 里。
新入口 \`secret/index.html\` 汇总三个**可以任意顺序**完成的独立调查：
- SIGNAL：八拍四轨残谱中的四个长音符，解谜输入通过后得到 S 碎片；
- CHRONICLE：混杂一个虚构年份的四条真实时间记录，排序后得到 C 碎片；
- ORBIT：11 颗星、镜面对称的空间谜题，解开后得到 O 碎片。

\`secret/sealed.html\` 要求任意两份不同碎片，重建四位校验码并主动提交，才可打开普通结局；集齐三份并解开封条后有另一结局。
所有新成果按浏览器 localStorage 存储，不向外上传结果或用户账户。
统计新键：\`archive036_20261113_case_signal\`、\`archive036_20261113_case_chronicle\`、\`archive036_20261113_case_orbit\`、\`archive036_20261113_case_final\`、\`archive036_20261113_case_true\`。原五个旧键仍保留并在统计页单独分组。

真实 Chrome 移动端/桌面端自动测试 \`secret/browser_smoke.cjs\` 已通过。测试阻断 CountAPI 请求，以防测试行为污染真实解锁人数。GitHub Actions 自动保存首页和结局的响应式截图。
