# 家务赚钱任务（housework-points）— 对话进展记录

> 用途：本文件汇总截至 2026-08-18 的全部设计/开发进展，方便**新开对话**无缝继续。
> 风格主线：从「治愈奶油风」→「Google Stitch 浅蓝黄风」→ **neobrutalism（黑粗边 + 实心硬投影）童趣贴纸风**。
> 本地预览：`http://127.0.0.1:8888/index.html?v=20260818c`（需先启动本地服务，见文末）。

---

## 一、当前版本状态

| 项目 | 值 |
|------|----|
| 当前最新 CSS 版本号 | `?v=20260818c`（基础零花钱/赚与罚 药丸大小统一） |
| `store.js` / `app.js` 版本号 | `?v=20260818a`（字体层级系统化，最后改动 JS 的提交） |
| 本地 Git 提交 | `ac9e73f` v5.1（仅含 reskin **之前**的代码，neobrutalism 改动全部 **未提交**） |
| 远程仓库 | `https://github.com/piwieei/housework-points.git`（public，main 分支） |
| 本地与远程关系 | **不相关**（历史分叉，见「关键决策 4」） |
| 预览服务 | 已在 8888 端口后台运行（Python http.server） |

**重要**：工作区有 4 个文件已修改但未提交（`css/style.css`、`index.html`、`js/app.js`、`js/store.js`），外加未跟踪的 `PRD.md`、`assets/`、`_shot_pill.mjs`、`err.txt`、`push_log.txt`。neobrutalism 全部视觉改动都在这 4 个未提交文件里。

---

## 二、已完成事项（按时间）

### A. 功能与逻辑（reskin 之前，已 commit 进 v5.0 / v5.1）
1. **复利激励系统**：连续打卡 streak + 12 个成就 + 基础零花钱按天领取 + 到账动画/撒花。
2. **基础零花钱改为「每日制」**（v=20260817g）：完成当日任务自动弹「今日已完成」弹窗并到账；按天重置。
3. **成就墙独立 Tab + 收支记录子标签**（v=20260817d）：底部 5 Tab = 首页/成就/排行/奖励/我的。
4. **首页「赚与罚」双栏并列**（v=20260817m）：左绿「💰赚钱花」右红「🔴扣款项」，行式任务项 + 金额胶囊。
5. **修复「基础零花钱领取后弹窗不立即显示」**（v=20260817a/c）：根因是 `claimBasicAllowance()` 返回结构（直接返回 record）与调用方 `result.record.amount` 不匹配导致 `TypeError` 静默崩溃；已改为读 `result.amount`。
6. **PRD 产品需求文档**（`PRD.md`）：含产品概述、双角色画像、8 场景、信息架构、视觉关键词、交互要点。

### B. 视觉换肤（neobrutalism，全部未提交）
7. **Stitch 浅蓝黄风**（v=20260817h） → **深度换肤 v2**（v=20260817i）：均匀中蓝 `#4D9DE0` 背景、大色块、黄色成员名、白色任务卡。
8. **成就页重设计**（v=20260817j）：圆形徽章 + 彩色环 + 3 统计项 + 收集进度。
9. **奖励页重设计**（v=20260817l）：心愿大卡 + 2 列奖励网格 + 彩色 icon 区 + 兑换按钮 + 锁角标。
10. **排行页重设计**（v=20260817n）：黄色药丸 Tab + 第一名皇冠大卡。
11. **Neobrutalism 黑粗边 + 实心投影**（v=20260817o）：新增设计令牌 `--nb-border / --nb-shadow / --nb-shadow-sm`，全站卡片/按钮/列表项应用；hover 推开展示、active 按下收缩。
12. **我的页补齐黑边**（v=20260817p）：profile-item / 表单 / 弹窗 / 通用按钮全部统一。
13. **成员头像栏黑边**（v=20260817q）。
14. **勋章墙圆形徽章黑边**（v=20260817r）：多阴影叠加 `box-shadow`（offset + inset 共存）实现环 + 投影。
15. **底部 Tab 图标替换**（v=20260817v）：🏡/🥇/👑/🎁/👦。
16. **儿童插画背景图**（v=20260817w）：`assets/bg.jpg` 全屏铺底，形成「手绘背景 + 纸切卡片」对比。
17. **全站「黄色药丸」统一**（v=20260817t/u/x/y）：排行/成就 Tab、奖励分区标题、成就勋章墙标题、我的页 4 个分区标题，全部 = 黄底 `#FFC93C` + 999px 圆角 + 2px 黑边 + 4px 硬投影 + 右侧橙色 ➕。
18. **黄色药丸字体统一 16px**（v=20260817z）。
19. **字体层级系统化**（v=20260818a）：21 档 → 15 档，最小字号 ≥ 11px（儿童可读性），建立 5 档文字 Type Scale。
20. **药丸 ➕ 按钮橙色填充 + 右对齐**（v=20260818b）：`.btn-add` 改 `#FF8A3D` 橙 + 白字 + `margin-left:auto`。
21. **基础零花钱 vs 赚与罚 药丸大小统一**（v=20260818c）：移除 `.basic-section-toggle` 上覆盖的 `padding:4px 0`，使其继承 `.section-header` 完整 padding，两个药丸高度/内距一致。

---

## 三、关键决策（新对话必须知道）

1. **设计系统令牌**（写在 `css/style.css` `:root`）：
   - `--nb-border: 2px solid #1A1A1A`（黑粗边）
   - `--nb-shadow: 4px 4px 0 #1A1A1A`（实心硬投影，零模糊）
   - `--nb-shadow-sm: 3px 3px 0 #1A1A1A`（小元素）
   - 主色黄 `#FFC93C`、强调橙 `#FF8A3D`、背景蓝 `#4D9DE0`（fallback）+ `assets/bg.jpg` 插画。
   - 所有「黄色药丸」统一配方：黄底 + 999px 圆角 + 2px 黑边 + 4px 硬投影 + 右侧橙色 ➕。

2. **缓存刷新模式（强制用户看到新效果）**：改完代码必须：
   - 在 `index.html` 里把对应 `css/style.css?v=`、`app.js?v=`、`store.js?v=` 版本号升一位（如 `20260818c`）；
   - 用**带查询参数**的 URL 打开预览（`?v=20260818c`），否则浏览器可能直接用缓存的 `index.html`。
   - 三处版本号要与实际改动文件对齐（改 CSS 就升 CSS 的号，改 JS 就升 JS 的号）。

3. **无头 Chrome + CDP 验证法**（Node 22 原生 `WebSocket`，无需安装库）：
   - 启动：`chrome.exe --headless=new --remote-debugging-port=9222 --user-data-dir=<临时目录>`
   - 脚本：`fetch('http://127.0.0.1:9222/json/new?<url>')` 建 tab → 连 `webSocketDebuggerUrl` → `Runtime.enable`/`evaluate` → 检查 DOM / computed style / 收集 `Runtime.exceptionThrown`。
   - 截图用 `Page.captureScreenshot` + `Emulation.setDeviceMetricsOverride(430×932, deviceScaleFactor:2)`。
   - ⚠️ 连到**旧 Chrome 实例**（带磁盘缓存）会加载旧 JS 导致假失败 → 每次用全新 `--user-data-dir` 或确认 9222 上是新实例。
   - ⚠️ 测试脚本 `.mjs` 末尾可能被注入 `</content></invoke>` 残留 XML，运行前需 `s.replace(/\n<\/content>\n<\/invoke>/g,'')` 剥离。

4. **GitHub 推送的替代方案（本机网络限制）**：
   - 本机 `github.com` 主域 443 **被阻断**（git push / curl 均超时），但 `api.github.com`、`codeload.github.com` **可访问**；无本地代理。
   - 之前（v=20260817 上传）用 **GitHub Contents API**（`PUT https://api.github.com/repos/piwieei/housework-points/contents/<path>`，base64 单文件上传，空仓库直接建初始 commit）成功上传 6 个文件。
   - ⚠️ 因此**本地 git 历史（2 commit）与远程（6 commit）不相关**，后续同步需 `git pull --rebase`（或 force push，谨慎）先对齐再正常 push。
   - 当前会话 **GitHub 连接器显示 disconnected**，若要直连 push 需先在连接器中心连接 GitHub。

5. **设计语言优先级**：童趣手绘背景（`assets/bg.jpg`，AI 生成带水印）+ 现代 neobrutalism 纸切卡片（黑粗边 + 硬投影）。视觉风格对标 Google Stitch 参考图。

---

## 四、未完成 / 待办

- [ ] **上传 GitHub**：当前 neobrutalism 改动全部未提交、未推送。两种路径：
  1. （推荐，若连不上 GitHub 直连）用 **GitHub Contents API** 逐个文件 `PUT` 上传（沿用 `push_log.txt` 记录的方法/令牌需重新生成）；
  2. （若已连接 GitHub 连接器）`git add -A && git commit && git pull --rebase && git push`（注意历史分叉，先 rebase 对齐远程）。
- [ ] **清理测试产物**：`_shot_pill.mjs`（CDP 截图脚本，含 XML 残留需剥离）、`err.txt`、`push_log.txt` 为会话临时文件，可删除或 `.gitignore`。
- [ ] **药丸大小统一（v=20260818c）的最终肉眼验证**：CSS 改动是确定性的，但本轮未做最终截图对比交付；建议新对话用无头 Chrome 截 `before/after` 确认基础零花钱药丸与赚与罚药丸高度一致。
- [ ] **提交版本号对齐核对**：`index.html` 中 `store.js`/`app.js` 仍为 `20260818a`，若后续再改 JS 需同步升号。
- [ ] **（可选）设计系统文档化**：可将 neobrutalism 令牌 + 药丸配方沉淀为 `design-tokens` 说明，便于后续页面复用。

---

## 五、如何继续（给新对话的提示词）

> 我们在做 `housework-points`（家务赚钱任务）移动端 web app 的 neobrutalism 风格重设计。
> 当前所有视觉改动都在工作区未提交的 4 个文件里（css/style.css、index.html、js/app.js、js/store.js），最新 CSS 版本号 `20260818c`。
> 设计令牌见 `css/style.css` 的 `:root`（`--nb-border/--nb-shadow/--nb-shadow-sm`，黄 `#FFC93C`、橙 `#FF8A3D`、蓝 `#4D9DE0` + `assets/bg.jpg`）。
> 改完代码务必升 `index.html` 里的版本号并用 `?v=` 带参 URL 打开预览。
> 验证用无头 Chrome + CDP（端口 9222，全新 user-data-dir）。
> 进度详情见 `progress.md`。下一步想做：<在此填写你的需求，例如“把成就页也按新风格再细化”或“上传 GitHub”>。

---

## 六、本地运行 / 验证命令速查

```bash
# 启动预览服务（在 housework-points 目录下）
python -m http.server 8888 --bind 127.0.0.1
# 浏览器打开（务必带 ?v= 参数强制刷新）
# http://127.0.0.1:8888/index.html?v=20260818c

# 启动无头 Chrome（验证用，全新 user-data-dir）
chrome.exe --headless=new --remote-debugging-port=9222 --user-data-dir=%TEMP%/chrome-test
```
