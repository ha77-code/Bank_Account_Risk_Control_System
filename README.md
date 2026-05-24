# Bank Account Risk Control System

基于 Spring Boot + React 实现的银行账户交易风控管理系统，模拟银行核心交易流程中的账户开户、转账、实时风控拦截和审计追踪。项目包含后端接口服务和前端管理控制台，前端文件统一放在 `Bank_Account_Risk_Control_System_spring/frontend` 目录下。

## 技术栈

后端：

- Java 17 / Spring Boot 4.0.6
- Spring Data JPA
- H2 Database（内存数据库）
- Springdoc OpenAPI（Swagger）
- JUnit 5 / Spring Boot Test
- Lombok / Maven

前端：

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn 风格项目结构
- lucide-react 图标
- @radix-ui/react-slot
- class-variance-authority

## 项目结构

```text
Bank_Account_Risk_Control_System_spring/
├── frontend/                       # 前端项目
│   ├── index.html                  # Vite 入口 HTML
│   ├── components/
│   │   └── ui/                     # shadcn 默认 UI 组件目录
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── wallet-card-2.tsx
│   ├── lib/
│   │   └── utils.ts                # cn 工具函数
│   ├── src/
│   │   ├── App.tsx                 # 风控管理控制台主页面
│   │   ├── demo.tsx                # WalletCard 演示入口
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── styles/
│   │   └── globals.css             # Tailwind 全局样式入口
│   ├── components.json             # shadcn 配置
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── package-lock.json
├── src/                            # Spring Boot 后端源码
├── pom.xml
├── mvnw
└── mvnw.cmd
```

说明：

- 前端组件默认路径为 `frontend/components/ui`，对应 shadcn 的 `@/components/ui` 导入习惯。
- 全局样式默认路径为 `frontend/styles/globals.css`。
- `@` 路径别名在 `vite.config.ts` 和 `tsconfig.json` 中配置，指向 `frontend` 根目录。
- `frontend/dist` 是执行构建后生成的静态产物，默认不提交到 Git。
- `frontend/node_modules` 是依赖安装目录，默认不提交到 Git。

## 核心功能

- 客户开户：创建客户并返回客户 ID
- 账户管理：创建账户、查询余额、冻结账户、解冻账户
- 账户转账：余额校验、事务保证、交易流水记录
- 实时风控：大额拦截、冻结账户拦截、高频交易拦截
- 风控看板：查看受控账户概览、账户状态和最近拦截
- 审计日志：关键操作全程可追溯

## 风控规则

| 规则 | 说明 |
|------|------|
| 账户冻结 | 冻结账户不允许发起转账 |
| 大额拦截 | 单笔金额超过 50000 元自动拦截 |
| 高频拦截 | 同一账户 10 分钟内超过 5 笔交易拦截 |

## 环境要求

- JDK 17+
- Maven Wrapper（项目已包含 `mvnw` / `mvnw.cmd`）
- Node.js 18+，推荐 Node.js 20+
- npm

Windows PowerShell 如果提示 `npm.ps1` 被系统策略拦截，可以使用 `npm.cmd`，例如：

```powershell
npm.cmd install
npm.cmd run dev
```

## 快速启动

### 1. 启动后端

Windows：

```powershell
cd "Bank_Account_Risk_Control_System_spring"
.\mvnw.cmd spring-boot:run
```

macOS / Linux：

```bash
cd Bank_Account_Risk_Control_System_spring
./mvnw spring-boot:run
```

后端默认端口：

- API 服务：http://localhost:8080
- Swagger 文档：http://localhost:8080/swagger-ui/index.html
- Swagger 文档备用路径：http://localhost:8080/swagger-ui.html
- H2 控制台：http://localhost:8080/h2-console

H2 连接信息见 `src/main/resources/application.yaml`：

```text
JDBC URL: jdbc:h2:mem:bankdb
User Name: as
Password: 123456
```

### 2. 启动前端

打开一个新的终端：

```powershell
cd "Bank_Account_Risk_Control_System_spring\frontend"
npm.cmd install
npm.cmd run dev
```

前端默认访问地址：

```text
http://127.0.0.1:5173/
```

前端通过 Vite proxy 将 `/api` 转发到后端：

```text
/api -> http://localhost:8080
```

因此开发时需要同时启动后端和前端。后端未启动时，前端页面仍能打开，但接口操作会提示连接失败。

## 前端使用方法

进入前端页面后，可以按以下流程演示完整风控链路：

1. 在“客户开户”面板创建客户，记录或自动填充返回的客户 ID。
2. 在“账户创建”面板使用客户 ID 创建两个账户，建议每个账户初始余额填写 `10000` 或更高。
3. 在“转账风控演练”面板点击“填充账户”，自动填入最近两个账户。
4. 发起一笔正常转账，例如 `1000`，查看交易结果和账户余额变化。
5. 点击“大额测试”或手动输入 `60000`，发起转账触发大额风控拦截。
6. 在“账户查询与控制”面板查询付款账户，然后点击“冻结”。
7. 再次使用冻结账户发起转账，触发冻结账户风控拦截。
8. 查看“风控拦截记录”和“审计日志”，确认所有关键操作均被追踪。

前端页面包含以下主要区域：

- 系统连接状态：显示前端是否能请求后端接口。
- 风控概览卡：展示账户余额、正常账户数、冻结账户数和拦截笔数。
- 客户开户：调用 `POST /api/customer`。
- 账户创建：调用 `POST /api/accounts`。
- 账户查询与控制：调用账户查询、冻结、解冻接口。
- 转账风控演练：调用 `POST /api/transaction/transfer`。
- 最近账户：显示当前页面已创建或查询过的账户。
- 风控拦截记录：调用 `GET /api/transaction/risk-blocked`。
- 审计日志：调用 `GET /api/audit-logs`。

## 前端构建与预览

安装依赖：

```powershell
cd "Bank_Account_Risk_Control_System_spring\frontend"
npm.cmd install
```

开发模式：

```powershell
npm.cmd run dev
```

生产构建：

```powershell
npm.cmd run build
```

构建产物会生成到：

```text
Bank_Account_Risk_Control_System_spring/frontend/dist
```

本地预览生产构建：

```powershell
npm.cmd run preview
```

如果需要把前端作为 Spring Boot 静态资源一起发布，可以在执行 `npm.cmd run build` 后，将 `frontend/dist` 中的文件复制到：

```text
Bank_Account_Risk_Control_System_spring/src/main/resources/static
```

当前项目默认采用“后端 8080 + 前端 5173”的开发方式。

## shadcn / Tailwind 说明

本项目已经具备 shadcn 风格结构、Tailwind CSS 和 TypeScript 支持，无需重新初始化。

关键文件：

| 文件 | 说明 |
|------|------|
| `frontend/components.json` | shadcn 配置文件 |
| `frontend/components/ui/card.tsx` | Card 组件 |
| `frontend/components/ui/button.tsx` | Button 组件 |
| `frontend/components/ui/wallet-card-2.tsx` | 风控概览卡组件 |
| `frontend/lib/utils.ts` | `cn` className 合并工具 |
| `frontend/styles/globals.css` | Tailwind 全局样式 |
| `frontend/tailwind.config.ts` | Tailwind 配置 |
| `frontend/vite.config.ts` | Vite 配置和 `/api` 代理 |

为什么使用 `components/ui`：

- shadcn 默认组件导入习惯是 `@/components/ui/...`。
- 统一放在 `components/ui` 可以让后续通过 shadcn CLI 添加组件时保持一致。
- 页面业务组件和通用 UI 组件可以清晰分层，后续维护更方便。

后续如需继续添加 shadcn 组件，可在 `frontend` 目录下执行类似命令：

```powershell
npx shadcn@latest add input table badge
```

## 接口说明

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/customer` | 创建客户 |
| POST | `/api/accounts` | 创建账户 |
| GET | `/api/accounts/{accountNo}` | 查询账户 |
| PATCH | `/api/accounts/{accountNo}/freeze` | 冻结账户 |
| PATCH | `/api/accounts/{accountNo}/unfreeze` | 解冻账户 |
| POST | `/api/transaction/transfer` | 发起转账 |
| GET | `/api/transaction/risk-blocked` | 查询风控拦截记录 |
| GET | `/api/audit-logs` | 查询审计日志 |

## 后端接口演示流程

如果不使用前端，也可以直接通过 Swagger 或 Postman 演示：

1. `POST /api/customer` 创建客户，记录返回的 `id`。
2. `POST /api/accounts` 创建两个账户，各存入 `10000` 元。
3. `POST /api/transaction/transfer` 发起正常转账。
4. `POST /api/transaction/transfer` 发起 `60000` 元转账，触发大额风控。
5. `PATCH /api/accounts/{accountNo}/freeze` 冻结付款账户。
6. `POST /api/transaction/transfer` 再次转账，触发冻结账户风控。
7. `GET /api/transaction/risk-blocked` 查看所有风控拦截记录。
8. `GET /api/audit-logs` 查看完整审计日志。

## 常见问题

### 前端提示后端未连接

确认 Spring Boot 后端已启动，并监听 `8080` 端口：

```text
http://localhost:8080
```

前端开发模式下通过 Vite proxy 请求后端，不需要额外配置 CORS。

### H2 数据为什么重启后丢失

当前使用的是内存数据库：

```text
jdbc:h2:mem:bankdb
```

后端服务重启后数据会清空，这是演示项目的正常行为。

### npm 命令在 PowerShell 中无法执行

如果出现 `npm.ps1` 执行策略报错，请使用：

```powershell
npm.cmd install
npm.cmd run dev
```

### 前端目录中为什么没有传统的 css/js 文件夹

当前前端采用 Vite + React + TypeScript 工程化结构，源码位于 `src`、`components`、`styles` 等目录。执行构建后，Vite 会在 `frontend/dist/assets` 中生成浏览器可直接加载的 CSS 和 JS 静态文件。

## 简历描述

基于 Spring Boot 4、Spring Data JPA、H2、React、TypeScript 和 Tailwind CSS 实现银行账户转账与实时风控管理系统。后端支持客户开户、账户冻结、账户转账、交易流水查询、风控拦截和审计日志等功能，使用 `@Transactional` 保证转账一致性，使用 `BigDecimal` 处理金融金额，设计大额交易、高频交易、冻结账户三类风控规则。前端基于 Vite 和 shadcn 风格组件结构实现风控管理控制台，支持客户开户、账户创建、账户查询、冻结解冻、转账演练、风控拦截记录和审计日志查看。
