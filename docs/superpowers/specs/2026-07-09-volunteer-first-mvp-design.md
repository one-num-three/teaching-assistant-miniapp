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

## Technical Implementation Addendum

### Local API First

The first implementation phase should use a local API server for debugging, not page-level mock data and not CloudBase. This keeps the frontend close to the later production architecture.

Target architecture:

```txt
uni-app pages
-> src/api/*
-> src/utils/request.ts
-> local API server: http://127.0.0.1:3100/api
-> local JSON or SQLite database
```

Later production architecture:

```txt
uni-app pages
-> src/api/*
-> src/utils/request.ts
-> production API server: https://api.example.com
-> production database
```

The page layer should not know whether data comes from local debug storage, local API server, or production server. Pages call `src/api/*` only.

### Recommended Local Server Structure

```txt
mock-server/
├── package.json
├── src/server.ts
├── src/db.json
├── src/routes/projects.ts
├── src/routes/materials.ts
├── src/routes/users.ts
├── src/services/projectService.ts
└── src/services/materialService.ts
```

The local server should run on:

```txt
http://127.0.0.1:3100/api
```

Frontend configuration should be centralized:

```txt
src/config/env.ts
src/utils/request.ts
```

Do not hard-code `localhost` or `127.0.0.1` inside pages.

### Local Debugging Notes

- In WeChat DevTools, enable "do not verify legal domain name" for local API requests.
- In simulator mode, `127.0.0.1:3100` points to the development machine.
- In real-device preview, `127.0.0.1` points to the phone itself, not the computer. Use the computer LAN IP, for example `http://192.168.1.8:3100/api`.
- Production must use HTTPS and a configured WeChat Mini Program legal request domain.
- H5 debugging may require CORS headers from the local server.
- JSON-file storage must serialize writes to avoid corrupting data during concurrent requests.

### API Contract

The frontend should be built against these endpoints. Production should keep the same contract where possible.

```txt
GET    /api/me
POST   /api/dev/switch-user
POST   /api/dev/reset

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
POST   /api/projects/:id/claim-leader
POST   /api/projects/:id/submit-lesson
POST   /api/projects/:id/review
POST   /api/projects/:id/claim-position

GET    /api/materials
GET    /api/admin/projects
```

Local debugging must support switching users:

```txt
x-dev-user-id: admin-1
x-dev-user-id: volunteer-1
x-dev-user-id: volunteer-2
```

This is required to test admin review, leader claim, and support role claim without real WeChat login.

### State Machine Rules

State transitions must live in the service layer, not inside pages.

```txt
pending_claim
-> claim leader
-> pending_review + not_submitted

pending_review
-> submit lesson
-> pending_review + pending_review

pending_review
-> approve
-> recruiting + approved
-> auto create material

pending_review
-> reject
-> revision_required + rejected

revision_required
-> resubmit lesson
-> pending_review + pending_review

recruiting
-> claim support roles
-> locked when all configured roles are full
```

The service layer must reject invalid transitions. The page layer should only display user-friendly errors.

### Role Slot Edge Cases

The server must enforce role constraints. Frontend hiding is not sufficient.

Rules:

- Leader/main lecturer is fixed to one person.
- Support role quantities are configured when publishing a slot.
- A role with `total = 0` cannot be claimed.
- A full role cannot be claimed again.
- One user can claim only one role in the same project in MVP.
- The leader cannot also claim a support role in MVP.
- `total = 0` roles are excluded from the full-project check.
- The project becomes `locked` only when every configured role with `total > 0` is full.

### Material Library Rules

The material library MVP is automatic only.

When a lesson plan is approved:

- Create one material entry from the approved lesson plan.
- Set `sourceProjectId`.
- Set `sourceProjectTitle`.
- Set file metadata from the submitted lesson plan.
- Do not create duplicate materials if the same project is approved again.

Suggested material fields:

```ts
{
  id: string
  title: string
  category: string
  fileName: string
  fileType: string
  sourceProjectId: string
  sourceProjectTitle: string
  createdAt: number
  tags: string[]
}
```

Manual upload, edit, delete, and featured management are deferred.

### Implementation Order

The implementation should follow this order:

```txt
1. Define API contract and shared types.
2. Build local API server.
3. Add src/utils/request.ts and frontend environment config.
4. Switch src/api/* from direct local storage to request-based APIs.
5. Add dev user switching and data reset.
6. Rebuild the slot page around recent slots and volunteer actions.
7. Rebuild project detail around current state and primary action.
8. Connect leader claim, lesson submission, review, and support role claim.
9. Connect automatic material library ingestion.
10. Polish UI only after the full local flow works.
```

The implementation priority is:

```txt
API contract first
local server second
page integration third
visual polish last
```
