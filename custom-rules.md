# 自定义 Shadowrocket 代理规则

核查日期：2026-09-15。以下 `shadowrocket` 代码块中的非注释规则全部启用，策略均为 `PROXY`。
同步脚本按文档顺序提取这些代码块，合并到上游 `[Rule]` 最前面；后续直接编辑此文件即可。

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

### 1.2 ChatGPT 账号、网页和资源兼容

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

## 5. 使用与验证

1. 将此文件提交到 `main`，工作流会生成 `sr_cnip.conf`；也可本地执行 `node --test` 和 `node scripts/sync.mjs`。
2. 在 Shadowrocket 更新并启用该远程配置，使用按配置分流的模式；确认 `PROXY` 对应可用节点。
3. 分别触发 Siri 的在线请求 / ChatGPT 扩展、Google Health 登录与同步、嘉信登录和 TradingView 图表，查看连接记录里的实际主机、命中规则与连接结果。
4. 如果特定操作失败，记录失败时间和主机，再添加精确域名。无需为已被后缀覆盖的子域名重复加规则，也不要把整个共享 CDN 的 IP 段加入代理。

本轮验证限于规则提取、合并顺序和生成文件，并未在你的手机、账号和代理节点上进行端到端验证。上游配置的其他设置仍可能影响连接，特别是 DNS、系统绕过、客户端工作模式和 MITM。
