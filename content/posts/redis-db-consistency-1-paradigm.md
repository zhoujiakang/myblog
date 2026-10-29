---
"title": "Redis 与数据库事务的一致性（一）：先立范式，再谈方案"
"group": "系统架构"
"date": "2026-10-26"
"tags": ["Redis", "MySQL", "事务", "一致性", "Spring"]
"summary": "一个 @Transactional 里同时动了 Redis 和 MySQL，MySQL 回滚了 Redis 却不会——这种不一致怎么收场？先说清判断依据，再谈方案。"
"draft": false
---

## 为什么写这个系列

一个 `@Transactional` 方法里同时更新 MySQL 和 Redis，如果 MySQL 回滚，Redis 已执行的修改会不会撤销？默认情况下不会。但这个问题不能只用一句「Redis 不支持回滚」解释，需要先分清事务配置、提交时机，以及 Redis 在业务中的角色。

缓存、秒杀预扣、强一致这三类场景要解决的问题不同，每种方案能保证什么、失败后还留下哪些窗口，比方案名字本身更值得先说清。

## 几个绕不开的事实

- **Redis 事务不提供已执行命令的回滚。** `MULTI/EXEC` 把命令排队执行。入队阶段的语法等错误可以使事务被拒绝执行；执行阶段某条命令报错，其他命令仍会继续，已经执行的修改不会撤销。执行前的 `DISCARD` 是丢弃队列，不是撤销已执行的写入。
- **`@Transactional` 管理哪些资源，取决于事务管理器和资源配置。** 常见 JDBC 事务配置下，`RedisTemplate` 默认不参与事务，写命令会直接执行。显式启用 `setEnableTransactionSupport(true)` 后，它可以在当前事务中排队写命令，事务成功时执行 `EXEC`，回滚时执行 `DISCARD`。Spring Data Redis 本身不提供专用的 `PlatformTransactionManager` 实现。
- **参与事务同步，不等于跨资源原子提交。** MySQL 提交和 Redis `EXEC` 仍是两个动作，进程崩溃、网络故障或 Redis 执行错误，都可能留下不一致。
- **Lua 保证脚本执行期间不被其他 Redis 命令穿插。** 它不能把 MySQL 加入原子操作；脚本运行时报错，也不会自动撤销此前已经执行的写入。因此，应先校验参数和状态，再执行修改。

所以需要区分：尚未执行的 Redis 写入可以丢弃；已经执行的写入需要业务补偿；跨资源的提交一致性需要额外协议。

## 角色决定契约

| Redis 角色 | 典型场景 | 一致性契约 | 主要手段 |
| --- | --- | --- | --- |
| 缓存 / 衍生副本 | 查询加速 | 允许有界的旧值窗口，权威数据在 DB | DB 提交后删缓存、可靠重试、TTL |
| 闸门 / 预扣计数器 | 秒杀请求准入 | Redis 控制准入，DB 决定订单与实际库存 | 预扣流水、状态机、可靠消息、幂等补偿、对账 |
| 参与关键决策的数据 | 余额、可用额度 | 业务明确要求的原子性与隔离性 | 优先收敛到单一事务边界；确有必要再设计跨资源协议 |

我更倾向于先确定权威数据和业务不变量。例如「余额不能扣成负数」「同一请求只能生成一张订单」，应在权威存储的事务中落实。不能因为 Redis 查询快，就默认它和 DB 能随时给出同一个结果。

「不让 Redis 当权威」本身也不会消除缓存旧值：关键决策仍需读取权威存储，普通展示才使用允许延迟的副本。

## 小结

先写清楚「谁是权威、允许多长时间不一致、失败如何恢复」，再选技术方案。提交后回调、Lua、事务消息都只覆盖链路的一部分，不能单靠其中一项得到跨资源的全部保证。

## 参考

- [Redis：事务与错误处理](https://redis.io/docs/latest/develop/using-commands/transactions/)
- [Spring Data Redis：事务支持](https://docs.spring.io/spring-data/redis/reference/redis/transactions.html)
- [Redis：脚本执行](https://redis.io/docs/latest/develop/programmability/eval-intro/)
