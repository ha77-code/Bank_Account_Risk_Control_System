# Bank Account Risk Control System

基于 Spring Boot 实现的银行账户交易风控后端系统，模拟银行核心交易流程中的风险控制。

## 技术栈

- Java 21 / Spring Boot 3.3
- Spring Data JPA
- H2 Database（内存数据库）
- Springdoc OpenAPI（Swagger）
- JUnit 5 / Spring Boot Test
- Lombok / Maven

## 核心功能

- 客户开户：创建客户和银行账户
- 账户管理：查询余额、冻结、解冻
- 账户转账：余额校验、事务保证、流水记录
- 实时风控：大额拦截、冻结拦截、高频拦截
- 审计日志：关键操作全程可追溯

## 风控规则

| 规则 | 说明 |
|------|------|
| 账户冻结 | 冻结账户不允许发起转账 |
| 大额拦截 | 单笔金额超过 50000 元自动拦截 |
| 高频拦截 | 同一账户 10 分钟内超过 5 笔交易拦截 |

## 快速启动

\```bash
git clone <your-repo-url>
cd bank-risk-control
mvn spring-boot:run
\```

启动后访问：
- Swagger 文档：http://localhost:8080/swagger-ui/index.html
- H2 控制台：http://localhost:8080/h2-console

## 接口说明

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/customers | 创建客户 |
| POST | /api/accounts | 创建账户 |
| GET | /api/accounts/{accountNo} | 查询账户 |
| PATCH | /api/accounts/{accountNo}/freeze | 冻结账户 |
| PATCH | /api/accounts/{accountNo}/unfreeze | 解冻账户 |
| POST | /api/transactions/transfer | 发起转账 |
| GET | /api/transactions | 查询交易流水 |
| GET | /api/transactions/risk-blocked | 查询风控拦截记录 |
| GET | /api/audit-logs | 查询审计日志 |

## 演示流程

1. POST /api/customers 创建客户，记录返回的 id
2. POST /api/accounts 创建两个账户，各存入 10000 元
3. POST /api/transactions/transfer 发起正常转账
4. POST /api/transactions/transfer 发起 60000 元转账，触发大额风控
5. PATCH /api/accounts/{accountNo}/freeze 冻结付款账户
6. POST /api/transactions/transfer 再次转账，触发冻结风控
7. GET /api/transactions/risk-blocked 查看所有风控拦截记录
8. GET /api/audit-logs 查看完整审计日志

## 简历描述

基于 Spring Boot 3、Spring Data JPA 和 MySQL 实现银行账户转账与实时风控后端系统，
支持客户开户、账户冻结、账户转账、交易流水查询、风控拦截和审计日志等功能。
使用 @Transactional 保证转账一致性，使用 BigDecimal 处理金融金额，
设计大额交易、高频交易、冻结账户三类风控规则，编写 9 个单元测试覆盖核心业务场景。