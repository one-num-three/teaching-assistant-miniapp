# 支教管理小程序 - 架构设计与开发落地计划 (V2.1 终极版)

本项目旨在开发一款面向大学生支教志愿者的微信小程序。核心目标是解决支教活动中信息不对称、流程不规范、资源难复用的痛点，实现从档期发布、岗位认领、教案提交到知识沉淀的全流程闭环管理。

> [!IMPORTANT]
> ## User Review Required
> 本方案 (V2.1) 已吸收深度的架构评审建议。特别强化了 **NoSQL 反范式设计、并发事务处理、教案驳回流转规则、文件安全访问机制** 及 **工程化隔离**。请您做最后确认，无异议后我们将严格基于此方案进入代码开发阶段。

## 一、 核心技术栈与工程化分层

- **前端框架**：`uni-app (Vue3 + TypeScript)` + `Pinia`
- **后端支撑**：**微信云开发 (CloudBase)**（云函数、云数据库、云存储）
- **UI 与样式管理**：
  - 采用 `uni-ui` 作为基础骨架。
  - **样式隔离规范**：禁止在业务页面零散写 `::v-deep`。引入专用的覆盖文件统一管理：
    ```text
    src/styles/
    ├── variables.scss       # 雾霾蓝主题色及全局设计 Token
    ├── theme.scss           # 核心业务组件样式
    ├── override-uni.scss    # 【专属】统一覆盖 uni-ui 的样式
    └── mixins.scss          # 常用样式混入
    ```

## 二、 核心状态机设计 (State Machine)

对状态流转做极严格的定义，特别是教案驳回后的处理机制：

### 1. 项目档期状态 (`project_status`)
- `draft` (草稿)
- `pending_claim` (待认领 - 等待负责人抢单)
- `recruiting` (招募中 - 教案审核通过，招募辅助岗位)
- `revision_required` (🔥 **需修改** - 教案被驳回，负责人需重交，不影响已认领助教，也不对外招募新成员)
- `locked` (已锁定/执行中 - 人员招募完毕，达到总人数限制自动流转)
- `completed` (已完成)
- `cancelled` (已取消)

### 2. 教案审核状态 (`lesson_status`)
- `not_submitted` (未提交)
- `pending_review` (待审核)
- `approved` (已通过)
- `rejected` (已驳回)

## 三、 数据库设计 (NoSQL 反范式架构)

所有集合包含审计字段：`created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`(软删标记)。

### 1. 实体集合 (用于高频读)
- **`users`**：微信 `openid`, 角色矩阵 (`roles`), `stats`, 以及业务身份认证数据。
- **`projects` (核心高频查询)**：使用**反范式设计**，直接内嵌当前的认领状态，确保首页日历无需联查即可渲染。
  ```ts
  {
    leader: { user_id, name, avatar },
    positions: {
      lecturer: { total: 1, members: [{ user_id, name, avatar, claimed_at }] },
      assistant: { total: 2, members: [] }
    }
  }
  ```
- **`materials`**：资料库元数据 (标题、标签、适用年级、时长、难度、来源项目、下载量等)。

### 2. 过程与审计集合 (用于低频写/查日志)
- **`project_claims` (审计日志)**：记录完整的动作 (`action: 'claim' | 'cancel' | 'removed'`)，仅做历史追溯，不参与首页渲染。
- **`lesson_reviews`**：审核记录、意见与驳回原因。
- **`notifications`**：MVP 优先实现**站内信**。预留 `subscription_tasks` 集合供二期微信订阅消息接入。

## 四、 云函数设计规范 (事务与文件安全)

### 1. 并发认领事务闭环 (`claimPosition`)
- 包含完整的事务处理闭环 (`db.runTransaction`)：
  1. 状态与权限拦截 (`ALREADY_CLAIMED`, `NO_PERMISSION`)
  2. 检查岗位容量限制 (`PROJECT_FULL`)
  3. 写入 `projects.positions.members`
  4. 同步写入 `project_claims` 审计日志
  5. 判断若容量已满 -> 自动将 `project_status` 更新为 `locked`。

### 2. 安全的文件访问机制 (`getLessonPlanTempUrl`)
- **坚决禁止在前端长期暴露文件的 `fileID`**。
- 采用临时链接机制：
  - 前端请求云函数 `getLessonPlanTempUrl`。
  - 云端做**动态权限校验**：负责人查自己、同项目成员查已审核教案、管理员全权查看、普通成员阻断。
  - 下发带时效的链接 `{ tempFileURL, expiresIn: 1800 }`。

## 五、 前端目录结构与工程化

```text
src/
├── api/              # 云函数调用封装 (按业务模块划分)
├── stores/           # Pinia 状态管理
├── types/            # TypeScript 核心业务类型
├── utils/            # 工具类 (权限、时间、格式化)
├── constants/        # 全局统一常量、状态码与错误码 (如 PROJECT_FULL)
├── styles/           # (见上文样式隔离规范)
├── components/       # 自研业务组件
└── pages/            # 页面视图 (聚焦核心闭环)
```

## 六、 开发实施阶段划分 (聚焦 MVP 闭环)

- **阶段 1：工程基建与用户认证** (预计 1.5 天)
  - 搭建完整前端目录（Types/Stores/API/Styles）。
  - 跑通 `guest` -> 完善业务资料 -> `member` 的认证流转闭环。
- **阶段 2：项目大厅与高并发抢单事务** (预计 2 天)
  - 核心攻坚：项目日历渲染、`claimProjectLeader` 与 `claimPosition` 的事务与锁控制。
- **阶段 3：安全文件治理与教案审核** (预计 2 天)
  - 实现基于临时链接的文件安全存取。
  - 跑通管理员审核台状态机 (`revision_required` 流转控制)。
- **阶段 4：通知触达与资料沉淀** (预计 1.5 天)
  - 开发站内 `notifications` 触达。
  - 跑通优秀教案向 `materials` 资料库沉淀。

## 七、 微信小程序落地风险控制 (Platform Risk Control)

> [!WARNING]
> 本项目涉及多项可能触发微信小程序官方审核机制（隐私、文件、权限）的高危点，开发全程必须严格遵守以下红线规则：

1. **写操作安全红线**：前端绝对禁止直写数据库。所有 `update/add/remove` 必须走云函数，并由云端统一切面调用 `assertRole/assertPermission`。
2. **用户身份红线**：用户身份以 `openid` + 业务资料为准，不依赖微信昵称头像。首次使用核心功能前，强制引导完善真实的“支协业务资料”。涉及教案文件和成员姓名的页面，未登录状态下必须做隐藏或阻断处理。
3. **文件与隐私红线**：教案上传需严格限制格式与大小（如 20MB）。访问必须走 `getTempFileURL` 临时链接，并由云端记录访问日志。
4. **事务范围控制**：`db.runTransaction` 仅用于处理核心数据（如 `projects` 与 `project_claims`）的强一致性，发送通知等带副作用的外部依赖必须剥离在事务之外。
5. **状态机白名单**：项目状态流转严禁随意越级（如直接从 `pending` 跳到 `completed`），云函数内必须配置合法的流转图（白名单），非法流转直接拒绝。
6. **全量扫描防御**：首页日历、通知列表、资料库等高频访问接口，必须提前在 CloudBase 后台配置组合索引，并在查询中强制设定分页与数量上限。
7. **平台 API 隔离**：所有微信专用 API（如 `wx.chooseMessageFile`, `wx.uploadFile` 等）统一封装在 `utils/platform.ts` 中，严禁在页面代码中散落条件编译。
8. **UI 适配防坑**：处理 Fixed Bottom Bar 时，必须增加 `padding-bottom: env(safe-area-inset-bottom);` 以规避 iOS 刘海屏阻挡问题。文件上传与预览功能必须在真机环境反复回归。
