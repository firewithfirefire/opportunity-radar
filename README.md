# Opportunity Radar

一个本地优先的个人机会雷达，用来从预设信息源收集候选机会，并把原始信息解析成可筛选、可评分、可实验验证的机会列表。

## v0.1 功能

- `/sources`：配置 RSS、公开网页、API、手动文本来源。
- `/radar`：查看自动抓取到的 RawItem 原始信息。
- `/opportunities`：查看由规则解析生成的候选机会。
- `/opportunities/[id]`：查看机会详情、原文、风险、评分和实验入口。

第一版只做信息收集和结构化分析，不做自动交易、自动任务执行、自动注册账号、登录态抓取或反爬绕过。

## 本地启动

```bash
npm install
npm run dev
```

然后打开：

```text
http://localhost:3000
```

macOS Finder 中也可以双击 `启动机会雷达.command` 启动。
