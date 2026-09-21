# Shadowrocket / Clash 自用规则

每天北京时间 **09:00**，GitHub Actions 下载[上游 sr_cnip.conf](https://johnshall.github.io/Shadowrocket-ADBlock-Rules-Forever/sr_cnip.conf)，合并 [自定义规则](custom-rules.md)，更新仓库根目录的 `sr_cnip.conf`。内容未变化时不产生提交；下载或校验失败时保留上一版配置，Actions 会显示失败。

同一任务也同步 [Loyalsoldier/clash-rules](https://github.com/Loyalsoldier/clash-rules) 的规则集，生成 [clash-rules.yaml](clash-rules.yaml) 并镜像规则数据到 `clash/providers/`。两个版本复用同一份自定义 Markdown。

## Clash / Mihomo 规则地址

https://raw.githubusercontent.com/corneliusztw/shadowrocket-rules/main/clash-rules.yaml

这是规则配置片段，包含 `rule-providers` 和 `rules`，需合并到你已有的节点配置，并提供名为 `PROXY` 的策略组。它不是完整节点订阅。Clash 版采用国内及局域网直连、其余流量代理，不包含广告屏蔽；自定义规则优先。[合并方法、更新方式及策略说明](clash/README.md)。

## Shadowrocket 配置地址

https://raw.githubusercontent.com/corneliusztw/shadowrocket-rules/main/sr_cnip.conf

将此链接添加为 Shadowrocket 的远程配置，启用该配置并在客户端设置中开启配置自动更新。仓库同步和手机拉取是两件事：手机的具体更新时间取决于客户端设置。

**此地址需要仓库为公开仓库才能供客户端直接访问。** 私有仓库的文件不能通过普通公开链接读取；不要把 GitHub 访问令牌写入配置文件。

## 填写自定义规则

已在 [custom-rules.md](custom-rules.md) 分组启用 Apple Intelligence / Siri、ChatGPT / Codex / ChatGPT Health、Claude / Claude Code、Gemini / AI Studio / Code Assist、Meta AI、Google Health / Fitbit、嘉信理财 / thinkorswim 和 TradingView 的代理规则，附有域名用途、官方来源及可选规则。插件覆盖公共通道与安装依赖，第三方授权和自建 MCP 仍按实际服务扩充。

编辑其中的 `shadowrocket` 代码块即可修改；以 `#` 开头的可选规则默认不生效。提交到 `main` 后立即触发同步，也可以在 Actions → Sync Shadowrocket and Clash rules → Run workflow 手动运行。

规则插入上游 `[Rule]` 的最前面。不要直接修改生成的 `sr_cnip.conf`，它会在下次同步时被覆盖。

## 运行方式

- GitHub Actions：默认分支应为 `main`，允许 Actions 运行及工作流写入仓库；使用内置 `GITHUB_TOKEN`，无需额外密钥。
- 本地：安装 Node.js 24，执行 `npm ci --ignore-scripts`、`npm test`，再执行 `npm run sync` 同步两个版本。只生成 Shadowrocket 可运行 `node scripts/sync.mjs`；只生成 Clash 可运行 `node scripts/sync-clash.mjs`。
- 测试覆盖规则优先级、空规则、Markdown 提取、上游异常和章节保留。

GitHub 定时任务可能排队延迟，并不保证 09:00 准点完成；公开仓库连续 60 天没有活动时，定时工作流可能自动停用，届时需要在 Actions 中重新启用。参见 [GitHub 调度文档](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)。

## 上游来源

配置来源于 [Johnshall/Shadowrocket-ADBlock-Rules-Forever](https://github.com/Johnshall/Shadowrocket-ADBlock-Rules-Forever)，保留上游署名及配置内容。当前选用的 `sr_cnip.conf` 是国内外分流版本，上游注明不包含广告过滤。
