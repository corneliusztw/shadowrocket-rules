# 自定义 Shadowrocket 代理规则

核查日期：2026-09-15。以下 `shadowrocket` 代码块中的非注释规则全部启用，策略均为 `PROXY`。
同步脚本按文档顺序提取这些代码块，合并到上游 `[Rule]` 最前面；后续直接编辑此文件即可。

同一份规则也转换到 Clash / Mihomo 的 `clash-rules.yaml`，优先于 Loyalsoldier 上游规则集。Clash 使用方式及支持的转换类型见 [clash/README.md](clash/README.md)。

`DOMAIN` 匹配一个完整域名；`DOMAIN-SUFFIX` 同时覆盖根域名和全部子域名。例如 `tradingview.com` 已覆盖 `www.tradingview.com`、`scanner.tradingview.com`，无需重复添加每个子域名。

本清单依据官方网络文档、官方 API 文档和公开网页中的资源地址整理。它不是手机抓包得出的完整依赖清单；官方端点、页面中发现的主机、为兼容而扩大的范围在下文分别说明。规则控制网络路由，不保证开通地区、账号资格或订阅权限。

## 1. Apple Intelligence、Siri 与 ChatGPT 集成

### 1.1 Apple 官方 AI 网络端点

以下六条直接对应 [Apple 企业网络文档的 Apple Intelligence、Siri 和搜索章节](https://support.apple.com/en-us/101555)。保留共享 CDN 的精确主机名。

```shadowrocket
# Apple Private Cloud Compute（私有云计算）
DOMAIN,apple-relay.cloudflare.com,PROXY
DOMAIN,apple-relay.fastly-edge.com,PROXY
DOMAIN,cp4.cloudflare.com,PROXY
# Apple Intelligence 扩展
DOMAIN,apple-relay.apple.com,PROXY
# Siri、听写和搜索
DOMAIN,guzzoni.apple.com,PROXY
DOMAIN-SUFFIX,smoot.apple.com,PROXY
```

| 域名 | 官方描述 / 覆盖范围 |
| --- | --- |
| `apple-relay.cloudflare.com`、`apple-relay.fastly-edge.com`、`cp4.cloudflare.com` | Private Cloud Compute 中继，官方列出 TCP/UDP 443 |
| `apple-relay.apple.com` | Apple Intelligence 扩展，官方列出 TCP/UDP 443 |
| `guzzoni.apple.com` | Siri、听写，TCP 443 |
| `*.smoot.apple.com` | Siri、Spotlight、查询及多款 Apple 应用的搜索，TCP 443 |

这些主机的连通性要求不等于 Apple 承诺支持任意 HTTP 代理。Shadowrocket 的节点应能传输所需连接；不要对这些流量开启 HTTPS 解密。这里只添加路由规则，不增加 MITM 主机或重写规则。

### 1.2 ChatGPT、Codex 与 Apple ChatGPT 集成共用规则

以下根据 [OpenAI 官方网络建议](https://help.openai.com/en/articles/9247338) 补充，覆盖 ChatGPT 登录与主要资源，也会影响单独使用 ChatGPT 的流量。它们是兼容补充，不能认定 Siri 每次调用都逐一访问这些主机；Apple 扩展自己的中继已在上一节覆盖。

```shadowrocket
DOMAIN-SUFFIX,chatgpt.com,PROXY
DOMAIN-SUFFIX,openai.com,PROXY
DOMAIN-SUFFIX,oaistatic.com,PROXY
DOMAIN-SUFFIX,oaiusercontent.com,PROXY
DOMAIN-SUFFIX,oaistatsig.com,PROXY
DOMAIN,cdn.openaimerge.com,PROXY
# 登录挑战及账号流程可能使用的共享服务：仅代理具体主机
DOMAIN,challenges.cloudflare.com,PROXY
DOMAIN,cdn.workos.com,PROXY
DOMAIN,forwarder.workos.com,PROXY
DOMAIN,setup.workos.com,PROXY
DOMAIN,images.workoscdn.com,PROXY
DOMAIN,workos.imgix.net,PROXY
DOMAIN,humb.apple.com,PROXY
```

`openai.com` 已覆盖 `auth.openai.com`、`auth0.openai.com`、`setup.auth.openai.com`、`ios.chat.openai.com` 等子域名。上述范围没有扩大为整个 `cloudflare.com` 或整个第三方云平台。

Codex 的 ChatGPT 登录、OpenAI API 以及 `chatgpt.com` 上的流式连接复用本组规则；具体说明见第 5 节。不要重复添加 `DOMAIN,api.openai.com,PROXY` 等已被后缀规则覆盖的条目。

### 1.3 可选：Apple 更新及附加组件下载

下面是 Apple 官方列出的更新服务，**默认注释，不启用**。若 AI 一直停留在下载阶段，可结合 Shadowrocket 连接记录逐条启用；官方文档没有将它们全部标注为 AI 模型专用下载域名，不能据此保证修复模型下载。

```shadowrocket
# DOMAIN,mesu.apple.com,PROXY
# DOMAIN,gdmf.apple.com,PROXY
# DOMAIN,gdmf-ados.apple.com,PROXY
# DOMAIN,gsra.apple.com,PROXY
# DOMAIN,updates.cdn-apple.com,PROXY
# DOMAIN,updates-http.cdn-apple.com,PROXY
```

**可用性限制：** 设备型号、系统版本、语言、购买地区及 Apple 账号地区仍需符合要求。Apple 当前说明：中国大陆购买的支持设备尚不能使用 Apple Intelligence；境外购买设备在中国大陆且账号地区也是中国大陆时也不能使用。代理规则不会改变这些资格条件。参见 [Apple Intelligence 开通说明](https://support.apple.com/en-us/121115)。

## 2. Google Health / Fitbit

Google 官方说明 Fitbit 应用从 2026-05-19 起改为 Google Health，本节覆盖该应用的已知健康服务端点、旧 Fitbit 域名、Google 登录和共享资源；不将 Google Cloud 医疗开发者产品当成消费者应用的必要依赖。

### 2.1 健康服务

```shadowrocket
# Google Health 介绍站，以及官方公开健康 API
DOMAIN-SUFFIX,health.google,PROXY
DOMAIN,health.googleapis.com,PROXY
# Fitbit 旧域名与子服务兼容
DOMAIN-SUFFIX,fitbit.com,PROXY
```

| 规则范围 | 说明 |
| --- | --- |
| `health.google` | Google 健康介绍站及其子域名 |
| `health.googleapis.com` | Google Health 官方公开 API；这不能证明手机应用只使用该 API |
| `fitbit.com` | 包含 `www.fitbit.com`、`api.fitbit.com`、`community.fitbit.com`、`dev.fitbit.com` 等旧入口和子服务；部分入口已迁移或跳转 |

### 2.2 Google 登录、支持与共享资源

```shadowrocket
# OAuth 登录与令牌
DOMAIN,accounts.google.com,PROXY
DOMAIN,oauth2.googleapis.com,PROXY
# Google 账号、产品支持、商店与订阅入口
DOMAIN,myaccount.google.com,PROXY
DOMAIN,support.google.com,PROXY
DOMAIN,policies.google.com,PROXY
DOMAIN,store.google.com,PROXY
DOMAIN,one.google.com,PROXY
DOMAIN,payments.google.com,PROXY
DOMAIN,www.google.com,PROXY
# 官方健康介绍页已引用的字体和图像；后缀范围为共享资源兼容
DOMAIN,fonts.googleapis.com,PROXY
DOMAIN-SUFFIX,gstatic.com,PROXY
DOMAIN-SUFFIX,googleusercontent.com,PROXY
```

Google Health 的官方 OAuth 示例明确使用 `accounts.google.com` 和 `oauth2.googleapis.com`；健康介绍页引用 `fonts.googleapis.com`、`fonts.gstatic.com`、`www.gstatic.com` 和 `lh3.googleusercontent.com`。其余账号、支持及订阅入口是使用相关功能时的兼容补充，并非全部都是后台同步依赖。

`gstatic.com` 和 `googleusercontent.com` 是 Google 共享域名，规则会让其他 Google 产品使用这些域名的资源也走代理。若只想代理健康应用，需根据自己的连接日志缩小范围。

### 2.3 可选：Google 广覆盖 / 医疗云开发者接口

当前未启用以下规则。若应用新版出现额外 `*-pa.googleapis.com` 等接口，可以根据日志添加精确域名，或接受更大范围后启用前两条。不要仅凭名称猜测某个 `health-*.googleapis.com` 一定存在。

```shadowrocket
# 兼容性兜底：影响全部 google.com 子域名和 Google API
# DOMAIN-SUFFIX,google.com,PROXY
# DOMAIN-SUFFIX,googleapis.com,PROXY
# 仅 Google Cloud Healthcare API 开发者场景；普通 Health/Fitbit 用户无需开启
# DOMAIN,healthcare.googleapis.com,PROXY
```

Health Connect 是 Android 的本机健康数据存储及共享接口，不是一个靠添加域名就能连上的独立云服务；iPhone 的 Apple Health 数据授权也需要在系统和应用内设置。Google Health Coach / Premium 的资格和地区支持需另外满足。

来源：[Google Health 应用变更说明](https://support.google.com/googlehealth/answer/17068213)、[Google Health API](https://developers.google.com/health/reference/rest)、[OAuth 与首次 API 调用](https://developers.google.com/health/codelabs/make-your-first-api-call)、[Fitbit Web API](https://dev.fitbit.com/build/reference/web-api/)、[Google 健康官网](https://health.google/)、[Health Connect 官方说明](https://developer.android.com/reference/android/health/connect/HealthConnectManager)。

## 3. 嘉信理财 Charles Schwab

```shadowrocket
# 官网、客户登录、国际账户、开户和各类 schwab.com 子服务
DOMAIN-SUFFIX,schwab.com,PROXY
# 客户页面实际引用的嘉信资源域名
DOMAIN-SUFFIX,schwabcdn.com,PROXY
# 国际地区站点（嘉信官网列出）
DOMAIN-SUFFIX,schwab.com.hk,PROXY
DOMAIN-SUFFIX,schwab.co.uk,PROXY
DOMAIN-SUFFIX,schwab.com.sg,PROXY
# thinkorswim 交易平台
DOMAIN-SUFFIX,thinkorswim.com,PROXY
```

| 已被覆盖的地址 | 用途 / 依据 |
| --- | --- |
| `www.schwab.com` | 官网 |
| `client.schwab.com` | 客户登录、账户页面 |
| `client.schwabcdn.com` | 客户登录页实际引用的资源 |
| `international.schwab.com` | 国际客户服务 |
| `eac.schwab.com`、`onboard.schwab.com` | 开户入口 |
| `style.schwab.com`、`rtcontent.schwab.com` | 公开页面引用的样式 / 内容地址 |
| `sws-gateway-nr.schwab.com` | 公开页面引用的网关主机；不能据此推断所有后台接口 |
| `trade.thinkorswim.com` | 嘉信官方确认的 thinkorswim 网页入口 |
| `www.schwab.com.hk`、`www.schwab.co.uk`、`www.schwab.com.sg` | 地区站点，已用独立后缀覆盖 |

### 可选：机构、退休计划及基金服务

以下域名由嘉信官网链接，个人经纪账户通常不需要；使用相应产品时取消注释。

```shadowrocket
# DOMAIN-SUFFIX,schwabinstitutional.com,PROXY
# DOMAIN-SUFFIX,schwabplan.com,PROXY
# DOMAIN-SUFFIX,schwabworkplaceservices.com,PROXY
# DOMAIN-SUFFIX,schwab529plan.com,PROXY
# DOMAIN-SUFFIX,schwabfunds.com,PROXY
# DOMAIN-SUFFIX,csimfunds.com,PROXY
# DOMAIN-SUFFIX,aboutschwab.com,PROXY
```

以上根据[嘉信官网](https://www.schwab.com/)、[客户登录页](https://client.schwab.com/Areas/Access/Login)、[国际开户页](https://eac.schwab.com/content/open-account-international)及 [thinkorswim 官方介绍](https://welcome.schwab.com/content/introduction-to-thinkorswim-web)整理。未登录账户或执行交易，也未核验登录后验证码、文档下载、行情和下单的全部第三方连接；出现具体失败再按日志补充。`schwab.com` 后缀不能覆盖拼写相似但不同的其他域名。

## 4. TradingView 网站、图表与行情

```shadowrocket
# 主站、各地区子站、图表和行情相关子服务
DOMAIN-SUFFIX,tradingview.com,PROXY
# 官方嵌入式行情组件
DOMAIN-SUFFIX,tradingview-widget.com,PROXY
# 官网及图表页实际引用的用户上传资源：只代理具体 CDN 主机
DOMAIN,tradingview-user-uploads.b-cdn.net,PROXY
```

以下是本次从官网和图表页 HTML 中提取的主机示例，均已由 `tradingview.com` 后缀覆盖；用途根据页面配置和名称归类，不代表已验证每项功能。

| 分类 | 已覆盖的主机示例 |
| --- | --- |
| 主站与地区站 | `www.tradingview.com`、`cn.tradingview.com`、`tw.tradingview.com`、`jp.tradingview.com` 等 |
| 静态资源与图标 | `static.tradingview.com`、`s3.tradingview.com`、`s3-symbol-logo.tradingview.com` |
| 实时连接入口 | `pushstream.tradingview.com`；其他位于此后缀下的动态行情主机也会匹配 |
| 筛选器 | `scanner.tradingview.com`、`scanner-backend.tradingview.com`、`screener-facade.tradingview.com`、`screener-storage.tradingview.com` |
| Pine 脚本 | `pine-facade.tradingview.com` |
| 图表与存储 | `charts-storage.tradingview.com`、`crud-storage.tradingview.com` |
| 提醒与通知 | `pricealerts.tradingview.com`、`notifications.tradingview.com` |
| 新闻与日历 | `news-mediator.tradingview.com`、`economic-calendar.tradingview.com`、`chartevents-reuters.tradingview.com` |
| 模拟交易与组合 | `papertrading.tradingview.com`、`papertrading-free.tradingview.com`、`portfolio.tradingview.com` |
| 期权相关 | `options-charting.tradingview.com`、`options-spread-explorer.tradingview.com`、`options-storage.tradingview.com` |
| 社区与支持 | `ideas-uploader.tradingview.com`、`support-middleware.tradingview.com`、`video-ideas.tradingview.com` |
| 其他页面引用 | `ai-copilot.tradingview.com`、`telemetry.tradingview.com` |

来源：[TradingView 官网](https://www.tradingview.com/)、[图表页](https://www.tradingview.com/chart/)、[官方组件文档](https://www.tradingview.com/widget-docs/tutorials/web-components/configuring/)。页面中出现的经纪商推广链接、社交链接或统计服务没有一并当作必要依赖。

网页能够打开不等于行情连接正常。需在实际使用中确认图表能加载、价格持续刷新、Pine 和提醒可用；如连接其他券商，券商自己的域名也需要单独覆盖。不要把 TradingView 的 webhook 发送源 IP 当作手机访问行情的服务器地址。

## 5. Codex、ChatGPT Health 与插件共用服务

### 5.1 Codex 桌面端、CLI、IDE 扩展和 ChatGPT

第 1.2 节已启用 `chatgpt.com`、`openai.com` 及主要资源后缀，因此下列端点无需再加重复规则：

| 场景 | 已覆盖地址 / 说明 |
| --- | --- |
| ChatGPT 登录 | `auth.openai.com` 及其子域名 |
| API 模式 | `api.openai.com`；使用自定义 API 网关时，网关需要自己的域名规则 |
| ChatGPT / Codex 流式连接 | 官方网络文档分别列出 `ws.chatgpt.com` 和 `chatgpt.com` 上的 WebSocket；均使用 TCP 443 |
| 文件与图片 | `files.oaiusercontent.com` 等；由 `oaiusercontent.com` 后缀覆盖 |
| 静态文件与 OpenAI CDN | `oaistatic.com`、`cdn.openai.com`，分别被已有后缀覆盖 |
| 插件入口与身份验证 | ChatGPT/OpenAI 侧复用现有规则；第三方服务授权页和 MCP 地址按实际使用补充 |

以下补齐 [OpenAI 官方网络清单](https://help.openai.com/en/articles/9247338) 的其余服务。它们包含支持、邮件链接、支付脚本和诊断，并非每次对话都必需；设置为代理不等于打开原本关闭的遥测功能。共享服务的相应域名也会影响其他网站使用它们的流量。

```shadowrocket
DOMAIN-SUFFIX,ct.sendgrid.net,PROXY
DOMAIN-SUFFIX,intercom.io,PROXY
DOMAIN-SUFFIX,intercomcdn.com,PROXY
DOMAIN,js.stripe.com,PROXY
DOMAIN,o207216.ingest.sentry.io,PROXY
DOMAIN,o33249.ingest.sentry.io,PROXY
DOMAIN,rum.browser-intake-datadoghq.com,PROXY
```

来源：[Codex 身份验证](https://learn.chatgpt.com/docs/auth)、[OpenAI 网络清单与 WebSocket 要求](https://help.openai.com/en/articles/9247338)、[插件说明](https://learn.chatgpt.com/docs/plugins)、[MCP 配置](https://learn.chatgpt.com/docs/extend/mcp)。这些规则不保证电脑流量经过手机上的 Shadowrocket；桌面端、CLI 和 IDE 所在设备也必须使用相应代理路径。不要把 `localhost` 或 OAuth 回调的 `127.0.0.1` 加入代理。

### 5.2 ChatGPT Health

Health 是 ChatGPT 内的功能，其 ChatGPT 侧流量复用第 1.2 节；核查的官方资料没有提供独立、完整的 Health 网络白名单。不能靠猜测 `health.openai.com` 或某个医疗聚合域名来补全。

以下为官方列出的 One Medical 和 Function Health 数据源增加品牌域名覆盖，用于访问相关网站及位于这些后缀下的授权入口；这不代表已经验证各自授权链上的全部主机。

```shadowrocket
DOMAIN-SUFFIX,onemedical.com,PROXY
DOMAIN-SUFFIX,functionhealth.com,PROXY
```

| 连接方式 | 本机代理需要处理的范围 |
| --- | --- |
| Apple Health | iPhone 本机授权及 ChatGPT 网络连接；不是向一个叫“Apple Health”的云域名请求全部健康数据 |
| WHOOP、Oura、Garmin 等经 Apple Health 分享数据 | 先由对应应用向 Apple Health 分享；不意味着 ChatGPT 直接连接每家设备厂商的云服务 |
| One Medical、Function Health | 上面两条覆盖品牌域名；额外登录提供商按实际跳转地址补充 |
| 医院 / 医疗记录 | 需要实际选择的医疗机构登录入口；没有适用于所有医院的统一域名规则 |

截至本次核查，官方说明 Health 面向符合资格的美国成年账号逐步开放，支持 Web/iOS；**Health 当前不支持 Codex**。添加代理规则不能改变功能资格或让 Codex 获得 Health。来源：[Health 官方说明](https://help.openai.com/en/articles/20001036)、[One Medical](https://www.onemedical.com/)、[Function Health](https://www.functionhealth.com/)。

### 5.3 插件安装与本机开发工具的公共依赖

以下是 GitHub 下载和 npm 包安装的基础路由，供 Codex / Claude Code 等本机工具使用；不代表所有插件都需要全部域名。`github.com` 同时覆盖 `api.github.com`、`codeload.github.com` 等。上游已显式代理 `raw.githubusercontent.com`，本次不重复添加。

```shadowrocket
DOMAIN-SUFFIX,github.com,PROXY
DOMAIN,objects.githubusercontent.com,PROXY
DOMAIN,release-assets.githubusercontent.com,PROXY
DOMAIN,registry.npmjs.org,PROXY
```

插件中的 Python、容器或其他包管理器可能还需要各自源站。企业镜像、自托管 Git/MCP、用户配置的网关地址不在这些公共规则内。GitHub 下载地址依据 [GitHub Codex 项目](https://github.com/openai/codex) 的安装方式与发布资产流程；npm 域名也在下方 Claude Code 官方网络清单中明确列出。

## 6. Claude、Claude Code 与 Claude 浏览器扩展

### 6.1 核心与插件通道

```shadowrocket
# Claude 网页、账号和安装更新
DOMAIN-SUFFIX,claude.ai,PROXY
# Console 登录、OAuth、文档及 claude.com 到 claude.ai 的登录跳转
DOMAIN-SUFFIX,claude.com,PROXY
# 模型 API、MCP 代理及 Anthropic 侧子服务
DOMAIN-SUFFIX,anthropic.com,PROXY
# 浏览器桥接及 Artifact 内容主机
DOMAIN-SUFFIX,claudeusercontent.com,PROXY
# 官方列出的插件元数据，以及旧版本安装更新
DOMAIN,storage.googleapis.com,PROXY
```

| 已覆盖主机 | 官方列出的用途 |
| --- | --- |
| `api.anthropic.com` | 模型请求及 WebFetch 域名检查等 |
| `claude.ai`、`claude.com` | 账号登录与跳转 |
| `platform.claude.com` | Console 认证、OAuth 令牌操作 |
| `mcp-proxy.anthropic.com` | 来自 Claude 账号的 MCP 连接器通道 |
| `downloads.claude.ai` | 插件可执行文件、原生安装与更新 |
| `bridge.claudeusercontent.com` | Claude in Chrome 的 WebSocket 桥接 |
| `*.frame.claudeusercontent.com` | Artifact 文件读取 |
| `storage.googleapis.com` | 插件元数据、旧版本安装更新；这是共享 Google Cloud Storage 主机，会同时代理其他应用访问该主机的流量 |

来源：[Claude Code 官方企业网络配置](https://code.claude.com/docs/en/corporate-proxy)。本次扩大为上述四个服务后缀以覆盖子域名；不表示官方要求代理其全部子服务。npm/GitHub 安装依赖复用第 5.3 节及上游规则。

### 6.2 可选诊断与 Homebrew 安装

以下官方列出的端点仅在相应功能使用时涉及，默认保持注释。服务已经能用时无需为了“完整”强制启用诊断流量。

```shadowrocket
# DOMAIN,http-intake.logs.us5.datadoghq.com,PROXY
# DOMAIN,browser-intake-us5-datadoghq.com,PROXY
# DOMAIN,formulae.brew.sh,PROXY
```

通过 Bedrock、Vertex / Google Cloud 或 Microsoft Foundry 调用 Claude 时，还需要实际云提供商、区域和身份验证端点；这与直接使用 Anthropic API 不同。未使用这些部署方式时不代理整个 `amazonaws.com` 或 Azure 云域名。自定义网关也要按其实际地址补充。

## 7. Gemini 网页 / 应用、AI Studio、API 和开发工具

### 7.1 Gemini 网页及页面引用的服务

```shadowrocket
DOMAIN-SUFFIX,gemini.google.com,PROXY
DOMAIN,gemini.app.google,PROXY
DOMAIN,aistudio.google.com,PROXY
# 下列主机实际出现在本次获取的 Gemini 官网 HTML 中
DOMAIN,geminiweb-pa.clients6.google.com,PROXY
DOMAIN,waa-pa.clients6.google.com,PROXY
DOMAIN,push.clients6.google.com,PROXY
DOMAIN,ogads-pa.clients6.google.com,PROXY
DOMAIN,ogs.google.com,PROXY
DOMAIN,content.googleapis.com,PROXY
# 云盘和文档入口，属于文件相关功能的兼容补充
DOMAIN,drive.google.com,PROXY
DOMAIN,docs.google.com,PROXY
```

`accounts.google.com`、`oauth2.googleapis.com`、`gstatic.com`、`googleusercontent.com` 已在第 2 节启用，无需再次添加。`gemini.gstatic.com` 也已被覆盖。`clients6.google.com` 中的几个地址依据页面引用添加，不宣称每个都是聊天的必要请求；没有把页面中的内部开发域名、全部外链和统计域名一并加入。

来源：[Gemini 官方登录说明](https://support.google.com/gemini/answer/13278668?hl=en)、[Gemini 官网](https://gemini.google.com/)。页面引用会随版本调整，这不是官方完整白名单。

### 7.2 API、Gemini CLI 与 Code Assist

```shadowrocket
# Gemini Developer API
DOMAIN,generativelanguage.googleapis.com,PROXY
# Google 官方 Code Assist 防火墙文档列出的服务
DOMAIN,cloudcode-pa.googleapis.com,PROXY
DOMAIN,cloudaicompanion.googleapis.com,PROXY
DOMAIN,serviceusage.googleapis.com,PROXY
DOMAIN,cloudresourcemanager.googleapis.com,PROXY
DOMAIN,people.googleapis.com,PROXY
DOMAIN,firebaselogging-pa.googleapis.com,PROXY
DOMAIN,feedback-pa.googleapis.com,PROXY
DOMAIN,apihub.googleapis.com,PROXY
```

这里包含模型、IDE、项目选择、资料、反馈和诊断服务，并非全部是 Gemini 消费者应用的依赖。CLI 根据 Google 登录、API Key 或 Vertex 等认证方式使用不同后台；已覆盖官方 Gemini API 和 Code Assist 常用端点，Vertex 地区端点仍需按实际项目补充。

来源：[Gemini API](https://ai.google.dev/api/generate-content)、[Gemini CLI 认证方式](https://geminicli.com/docs/get-started/authentication/)、[Google Code Assist 网络要求](https://docs.cloud.google.com/gemini/docs/codeassist/set-up-gemini)。没有启用整个 `googleapis.com` 后缀，已有 Google Health 和 OAuth 精确规则继续有效。

## 8. 插件与连接器的范围边界

- **本机发起的连接：** 浏览器 OAuth、CLI / IDE 的 MCP、本地插件下载等，只有流量经过 Shadowrocket 时才受本文件控制。第三方授权平台可能需要额外域名。
- **云端发起的连接：** 例如 Claude 官方说明的自定义远程连接器由 Anthropic 云端访问 MCP 服务器；本机加代理规则不会改变云端到目标服务的网络。来源：[Claude 连接器说明](https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities)。
- **任意插件：** GitHub、Google Drive、Slack、Notion、医院门户及自建 MCP 的依赖各不相同，没有能保证所有插件均可用的一组固定域名。这里补齐 AI 平台公共通道、安装源及明确命名的 Health 数据源；新增具体插件时依据该插件的实际端点扩充。
- **流式及语音：** 规则可匹配域名，但无法让节点自动获得 WebSocket 或 UDP 支持。OpenAI 官方另列 ChatGPT Voice 的 UDP 3478 与动态 IP 清单；本文件没有静态复制这些 IP，不能声称覆盖所有直接 IP 语音连接。参见第 5.1 节官方网络文档。

## 9. 使用与验证

1. 将此文件提交到 `main`，工作流会生成 `sr_cnip.conf`；也可本地执行 `node --test` 和 `node scripts/sync.mjs`。
2. 在 Shadowrocket 更新并启用该远程配置，使用按配置分流的模式；确认 `PROXY` 对应可用节点。
3. 分别触发 Siri / ChatGPT、Codex、Claude / Claude Code、Gemini、Health 登录同步、嘉信登录和 TradingView 图表，查看连接记录里的实际主机、命中规则与连接结果。
4. 如果特定操作失败，记录失败时间和主机，再添加精确域名。无需为已被后缀覆盖的子域名重复加规则，也不要把整个共享 CDN 的 IP 段加入代理。

本轮验证限于规则提取、合并顺序和生成文件，并未在你的手机、账号和代理节点上进行端到端验证。上游配置的其他设置仍可能影响连接，特别是 DNS、系统绕过、客户端工作模式和 MITM。
