# Clash / Mihomo 使用说明

## 文件和订阅地址

规则配置片段：[clash-rules.yaml](../clash-rules.yaml)

固定 URL：<https://raw.githubusercontent.com/corneliusztw/shadowrocket-rules/main/clash-rules.yaml>

此文件包含 `rule-providers` 和 `rules` 两个配置字段，**不是包含节点的完整代理订阅，也不是能直接填入单个 rule-provider 的 payload 文件**。适用于支持 RULE-SET 的 Clash Premium / Mihomo 配置；本项目优先验证 Mihomo。

`providers/*.yaml` 是规则集内容，由此片段自动引用你仓库中的固定地址，无需逐个手动添加。上游原始数据来自 [Loyalsoldier/clash-rules](https://github.com/Loyalsoldier/clash-rules)，本仓库每天北京时间 09:00 下载并校验后发布。

## 合并到现有配置

1. 保留你原来配置里的 `proxies`、`proxy-providers`、`proxy-groups`、DNS 和端口设置。
2. 将生成文件的 `rule-providers` 合并进现有同名字段；用生成文件的 `rules` **替换**原有 `rules`。不要在同一个 YAML 文档里粘贴两个同名顶层字段，也不要把新规则接到原有 `MATCH` 后面。
3. 确保已有一个名为 `PROXY` 的节点或策略组，并在其中选择你的代理节点；如名称不同，可在客户端合并时将所有策略 `PROXY` 映射成你已有的组名。不要在本仓库提交机场订阅地址、节点密码或令牌。
4. 使用 Rule 模式，更新规则集并查看连接命中情况。DNS、TUN 和 UDP 能力继续由你的原配置及节点决定。

不同客户端的“合并配置 / 覆写 / Merge”功能不完全相同。若客户端支持远程合并片段，可使用上面的 URL 并设置定期刷新；否则下载该文件后合并。原机场订阅刷新时，要让客户端重新应用这个片段。

## 更新时间的含义

- GitHub 每天北京时间 09:00 同时生成 Shadowrocket 和 Clash 文件，也支持手动运行；修改 `custom-rules.md` 会立即触发生成。
- `rule-providers` 的 `interval: 86400` 表示客户端每隔一天检查规则集，**不是客户端也固定在 09:00 刷新**。
- 自定义规则和匹配顺序在顶层 `clash-rules.yaml` 中。只更新 provider 不会刷新这部分；修改 Markdown 后，也要刷新客户端的合并片段 / 配置。
- 下载或校验失败时，工作流不推送任何此次生成的文件，GitHub 保留上一版。上游数据全部锁定到同一个 release 提交；版本、条数和 SHA-256 见 [upstream.json](upstream.json)。

## 策略顺序

| 顺序 | 内容 | 策略 |
| --- | --- | --- |
| 1 | Markdown 启用的自定义规则，按原顺序 | 当前为 PROXY；也支持明确填写 DIRECT / REJECT |
| 2 | private | DIRECT |
| 3 | reject | REJECT |
| 4 | icloud、apple | DIRECT |
| 5 | google、proxy | PROXY |
| 6 | direct | DIRECT |
| 7 | lancidr、cncidr | DIRECT |
| 8 | telegramcidr | PROXY |
| 9 | 未匹配流量 | MATCH,PROXY |

这是参考上游白名单模式的组合，调整为自定义规则优先。Apple AI、Gemini 等自定义代理规则会先于 Apple 直连或广告列表命中。自定义域名与上游重叠时，保留上游原始内容以方便更新，依靠顺序落实你的覆盖意图。

不启用上游 `applications` 进程直连列表，以免进程规则带来额外直连行为；不额外依赖下载 GEOIP 数据库，使用同版本的 `lancidr` / `cncidr` 规则集做地址匹配。这与上游示例末尾的 GEOIP 数据来源可能存在差异。

**Clash 版包含上游 reject 广告列表**；原 Shadowrocket 的 `sr_cnip.conf` 是不含广告过滤的另一套上游。两个版本共享自定义规则，但不是逐条相同的配置。自定义规则优先也意味着你明确指定代理的域名会覆盖其下原本可能被屏蔽的广告子域名。

## 自定义规则转换范围

继续只编辑根目录 [custom-rules.md](../custom-rules.md)。支持 `DOMAIN`、`DOMAIN-SUFFIX`、`DOMAIN-KEYWORD`、`IP-CIDR`、`IP-CIDR6`、`GEOIP`，策略支持 `PROXY` / `DIRECT` / `REJECT`；IP / GEOIP 可使用 `no-resolve`。IPv6 CIDR 会转换为 Clash 的 `IP-CIDR6`。若新增其他 Shadowrocket 专有类型或策略，生成会明确失败，不会静默忽略规则。

## 来源和许可

本目录 `providers/` 是 Loyalsoldier/clash-rules release 分支选定文件的未修改副本。上游标注 GPL-3.0，许可证全文保留于 [LICENSE-Loyalsoldier](LICENSE-Loyalsoldier)。原始下载地址和提交版本记录于 [upstream.json](upstream.json)；版权和来源声明不因镜像而改变。

格式参考：[Loyalsoldier 使用方式](https://github.com/Loyalsoldier/clash-rules#使用方式)、[Mihomo rule-provider](https://wiki.metacubex.one/en/config/rule-providers/)、[Mihomo 路由规则](https://wiki.metacubex.one/en/config/rules/)。
