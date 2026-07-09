# Volunteer-First MVP Product Design

## Product Positioning

This mini program is a lightweight tool for university volunteer teaching teams. It is not an admin backend. The first screen should help volunteers answer:

- What teaching slots are available soon?
- What state is each slot in?
- What role can I claim now?
- What do I need to do next?

The MVP keeps the core loop small and complete: publish slot, claim leader, submit lesson plan, review lesson plan, recruit support roles, lock project, and save approved lesson plans into the library.

## Navigation

The bottom tab bar has three entries:

```txt
档期   资料库   我的
```

There is no separate admin tab. Admin-only actions live under `我的`, so the product still feels like a volunteer tool rather than a management system.

## Roles

### Volunteer

Volunteers can:

- Browse teaching slots.
- Claim the leader role when a slot is waiting for a leader.
- Submit or revise a lesson plan after becoming leader.
- Claim support roles after a lesson plan is approved.
- Browse approved materials in the library.
- See their own projects and pending tasks.

### Admin

Admins can:

- Publish teaching slots.
- Review submitted lesson plans.
- View all project states.

Admins cannot manually manage materials in MVP. Manual material upload, edit, delete, and featured tagging are deferred.

## Core Flow

```txt
管理员发布档期
-> 志愿者在档期页查看
-> 志愿者抢占负责人
-> 负责人提交教案
-> 管理员审核教案
-> 审核通过后进入招募中
-> 志愿者认领助教/PPT/摄影/场务
-> 项目锁定/完成
-> 审核通过教案自动进入资料库
```

## Project Status Model

The MVP uses these project states:

- `pending_claim`: waiting for a leader.
- `pending_review`: leader has submitted a lesson plan and waits for admin review.
- `revision_required`: lesson plan was rejected and leader needs to resubmit.
- `recruiting`: lesson plan approved and support roles can be claimed.
- `locked`: all configured roles are filled.
- `completed`: project finished.
- `cancelled`: project cancelled.

Lesson plan states:

- `not_submitted`
- `pending_review`
- `approved`
- `rejected`

## Role Slot Rules

Each project has configurable role slots.

```txt
负责人/主讲：固定 1 人
助教：可配置 0-N 人
PPT：可配置 0-N 人
摄影：可配置 0-N 人
场务：可配置 0-N 人
其他岗位：后续可扩展
```

Rules:

- Leader/main lecturer is fixed to one person.
- Admin configures support role quantities when publishing a slot.
- Roles with quantity `0` are hidden from volunteer claim UI.
- A role becomes unavailable after its configured quantity is filled.
- When every configured role is filled, the project automatically becomes `locked`.
- A volunteer can claim only one role in the same project in MVP.

## Page Design

### 档期

Primary purpose: let volunteers browse and act.

Content:

- Recent slots grouped by date or week.
- Status badge.
- Time and location.
- Target audience.
- Leader if already claimed.
- Role vacancies.
- My pending action when relevant.

The page should not feel like a dense admin calendar. It should prioritize current and upcoming slots.

### 项目详情

Primary purpose: answer three questions.

```txt
1. 这个项目是什么？
2. 当前进行到哪一步？
3. 我现在能做什么？
```

Content:

- Project title, time, location, audience.
- Current state timeline.
- Lesson outline.
- Leader block.
- Support role slots.
- One primary action based on state and user role.

Primary actions:

- `抢占负责人`
- `提交/修改教案`
- `认领岗位`
- `查看教案状态`

### 资料库

Primary purpose: reuse approved lesson plans.

MVP behavior:

- Only approved lesson plans enter the library automatically.
- Users can browse by category.
- Users can search by title.
- Materials display title, source project, file type, date, and tag.

Deferred:

- Manual upload.
- Edit/delete.
- Featured management.
- Advanced ranking.

### 我的

Primary purpose: personal workbench.

Volunteer content:

- Profile identity.
- My projects.
- Pending tasks.
- Basic participation stats.

Admin-only entries:

- 发布档期
- 审核教案
- 查看项目状态

Admin entries should be visible only to admin users.

## MVP Scope

### Included

- Slot browsing.
- Leader claim.
- Lesson plan submission.
- Admin lesson review.
- Support role claiming.
- Auto-lock after configured roles fill.
- Approved lesson plans automatically entering the library.
- My projects and pending tasks.
- Local storage database for frontend validation.

### Excluded

- CloudBase deployment and production database rules.
- Manual material upload.
- Material edit/delete.
- Favorites.
- Reimbursement.
- Complex analytics.
- WeChat subscription messages.
- Reviewer/super-admin UI.
- Full admin backend.

## Local Test Data Strategy

Before CloudBase integration, the app uses a local storage adapter.

Rules:

- Pages call `src/api/*` only.
- `src/api/*` calls local storage during MVP validation.
- Later CloudBase migration swaps API adapter implementation without rewriting pages.
- Local data must support the full product loop.

## Acceptance Criteria

The product rethink is accepted when the app can demonstrate this flow locally:

```txt
管理员发布一个档期并配置岗位数量
-> 志愿者在档期页看到该档期
-> 志愿者进入详情并抢占负责人
-> 负责人提交教案
-> 管理员在审核台看到待审核教案
-> 管理员审核通过
-> 项目进入招募中
-> 志愿者认领配置好的支持岗位
-> 岗位满员后项目锁定
-> 审核通过的教案出现在资料库
```

The UI is accepted when:

- The app feels volunteer-first, not admin-first.
- There are only three bottom tabs.
- Each page has one obvious primary action.
- Admin functions are discoverable but not dominant.
- Role quantities are visible and understandable.
