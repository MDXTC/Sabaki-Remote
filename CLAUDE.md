# CLAUDE.md — Sabaki Remote 项目约束

Sabaki
Remote 是 Sabaki 的 fork：界面在本地运行，GTP 引擎通过 SSH 在远端服务器上运行。通信方式是 spawn 本地的
`ssh` 进程，GTP 走它的 stdin/stdout，不开任何监听端口。

## 硬性约束

### 1. 最小修改原则

只改实现需求所必需的部分。不顺手重构、不重排无关代码、不对无关文件做格式化，改动尽量集中在已有的模块边界内。

### 2. 测试与日志目录

- 所有测试代码放在 `tests/` 下：
  - `tests/unit/`：mocha 单元测试，`npm test` 运行
  - `tests/e2e/`：Playwright 端到端测试，`npx playwright test` 运行
- 运行时日志、调试输出、临时记录放在 `logs/`，该目录已被 `.gitignore` 忽略。
- 不要把测试脚本或日志散落在仓库根目录或其他模块目录。

### 3. 先提问，后修改

需求理解不明确时先提问，不要凭猜测修改。涉及隐私、远端配置、目录结构的问题尤其要先确认。

### 4. 远端公共服务器资源限制

在远端运行的任何程序（KataGo、Leela Zero 等）不得超过：

- **16 线程**
- **50 GB 内存**

配置引擎参数或引入并发行为时必须保证不突破上述上限。示例配置要显式写出限制值。

### 5. 远端 KataGo 服务器地址/账户

这里指的是**运行 KataGo 的远端 SSH 服务器**，不是 GitHub 仓库。该服务器的 SSH 主机、用户名、端口、密钥路径等信息由用户后续在应用内手动填写，不得写死在源码、示例、测试数据或文档中。

### 6. 隐私内容禁止提交

远端 KataGo 服务器的地址、账户、密钥等隐私信息，一律不得提交到远程仓库。GitHub 仓库地址和账号不属于此列，可以正常写在
`package.json` / `src/main.js` 中。

- 测试和示例里如需占位，使用 `gpu.example.com`、`alice` 这类保留示例值。
- 提交前检查 `git diff --cached`。

## 提交前检查清单

- [ ] `git diff --cached` 中没有远端 KataGo 服务器的地址、账号、密钥、token
- [ ] `logs/`、`node_modules/`、`bundle.js`、`playwright-report/`、`test-results/`
      没有被加入暂存区
- [ ] `npm test` 通过
- [ ] 涉及 UI 的改动已跑对应 E2E

## 常用命令

| 用途              | 命令                                   |
| ----------------- | -------------------------------------- |
| 单元测试          | `npm test`                             |
| E2E               | `npx playwright test`                  |
| 只跑某个 E2E 项目 | `npx playwright test --project=<name>` |
| 构建 bundle       | `npm run bundle`                       |
| 启动应用          | `npm start`                            |
| 格式化            | `npx prettier --write <files>`         |

## 进程边界

`src/main.js` 不能 `require` `src/modules/` 或 `src/components/`
下的模块：打包时这些目录会被 `build.files` 排除，只存在于 `bundle.js`
中。主进程逻辑应放在 `src/` 根目录（例如 `src/argv.js`）。该约束由
`tests/unit/packagingTests.js` 强制检查。

## 架构要点

- `src/modules/ssh.js`：SSH 参数构造与校验。主机、用户、端口等输入必须先经过
  `validateSshEngine`，不得把未校验的字符串拼进 ssh 的 argv。
- `src/modules/enginesyncer.js`：根据 `engine.transport`
  选择本地进程或 ssh 进程，GTP 协议层（`@sabaki/gtp`）保持不变。
- SSH 安全基线：仅公钥认证、默认校验 host
  key、禁用 agent 和 X11 转发。修改这些选项前必须说明理由。
