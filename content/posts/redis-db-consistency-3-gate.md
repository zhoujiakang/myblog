---
"title": "Redis 与数据库事务的一致性（三）：秒杀预扣，Redis 闸门与 MySQL 真相"
"group": "系统架构"
"date": "2026-10-28"
"tags": ["Redis", "秒杀", "Lua", "MQ", "补偿", "分布式"]
"summary": "秒杀里 Redis 不是缓存，是流量闸门：先 Redis Lua 预扣 → 发 MQ → 消费者写 MySQL。这套顺序跟缓存型相反，但「DB 是真相、靠补偿收场」的原则一致。"
"draft": false
---

## Redis 在秒杀里是闸门

秒杀里可以先通过 Redis 预扣限制准入，再发消息，由消费者在 MySQL 中创建订单。这里 Redis 是闸门，不是简单的 DB 缓存。

MySQL 仍负责「库存不能为负」「一个请求最多生成一张订单」等最终约束。Redis 预扣成功只能表示请求已受理，不能直接向用户承诺订单已经创建。

## 预扣必须有请求身份

只有库存计数，无法判断一次超时请求到底扣没扣过，也无法安全补偿。应为每个请求生成稳定的 `flowKey`，重试使用同一个标识，并记录预扣数量和状态。

以下 Lua 展示预扣的最小模型。`KEYS[1]` 是库存，`KEYS[2]` 是该请求的预扣 Hash；Redis Cluster 中两者须通过相同 hash tag 落在同一槽。请求参数和 key 类型必须受控，预扣记录的保留期要覆盖消息重试与对账周期。

```lua
-- ARGV[1]：正整数扣减数量；返回 1=首次成功，2=已预扣，0=不足
local delta = tonumber(ARGV[1])
if not delta or delta <= 0 or delta ~= math.floor(delta) then
  return redis.error_reply('invalid count')
end
local state = redis.call('HGET', KEYS[2], 'state')
if state then
  local count = tonumber(redis.call('HGET', KEYS[2], 'count'))
  if count ~= delta then
    return redis.error_reply('request count mismatch')
  end
  if state == 'PENDING' or state == 'CONFIRMED' then return 2 end
  return redis.error_reply('request already cancelled')
end
local stock = tonumber(redis.call('GET', KEYS[1]))
if not stock or stock < delta then return 0 end
redis.call('DECRBY', KEYS[1], delta)
redis.call('HSET', KEYS[2], 'state', 'PENDING', 'count', delta)
return 1
```

脚本不允许命令穿插，但运行错误不会自动撤销先前写入。生产环境还需处理资源耗尽、持久化与主从切换的数据丢失风险；这个示例不是持久化的跨资源事务。

## 缺口一：预扣成功，消息发送结果未知

发送失败至少要分两类：

- **明确未受理**：可进入取消流程，但仍需确保同一个请求不会再被消费者接受。
- **结果未知**：例如 Broker 已接收消息，但生产者没收到确认。不能立即回补并认定结束，否则消息之后仍可能创建订单。

比较稳妥的处理是先持久化请求身份和状态，再以相同 `flowKey` 重试或查询，由后台扫描长期未决请求。Redis 扣减与 DB 请求记录仍不是原子的，因此还需要能从预扣流水发现孤儿记录，并保守恢复。Redis 自身故障丢失记录的情况，也要纳入恢复设计。

本地消息表能保证「DB 请求记录 + 待发送消息」同事务提交，**不能顺带把先前的 Redis 扣减也包进来**。RocketMQ 事务消息需要可回查的本地事务结果，也不能只把 Redis 当前剩余库存当作请求结果。

## 缺口二：消费失败，不一定该回补

消费端要区分业务拒绝、暂时故障和重复消息：

| 情况 | 处理 |
| --- | --- |
| DB 超时、死锁等暂时故障 | 保留预扣，重试并确认事务结果 |
| 同一请求订单已创建 | 返回已有结果，不再扣库存、不回补 |
| 业务明确拒绝且请求已终止 | 发出可靠的释放任务 |
| DB 提交结果未知 | 先按请求号查询，不能直接释放 |

消费端在同一个 DB 事务里锁定或条件推进请求状态，完成条件扣库存、订单插入和最终状态更新。唯一请求号用于防重；订单插入失败时，库存更新也必须一起回滚。

```sql
-- count 必须在进入事务前验证为正整数
UPDATE seckill_stock
SET stock = stock - #{count}
WHERE activity_id = #{activityId} AND stock >= #{count};
```

这条 SQL 只展示库存约束，不等于完整的下单事务。受影响行数为零时应结束当前下单路径，并按业务规则记录拒绝结果。

取消和下单还必须在同一个权威请求状态上竞争。例如下单从 PENDING 进入 SUCCEEDED，取消从 PENDING 进入 CANCELLED；两者由 DB 行锁或条件更新串行化，失败的一方读取最终结果。仅在 Redis 标记取消，无法阻止已经执行中的 DB 下单。

## 回补幂等：状态变更与加库存在 Redis 内一起执行

单靠 DB 唯一流水不能保证 Redis 回补幂等：先写流水再加库存可能漏补，反过来可能重复补。释放任务必须来自权威请求已进入 CANCELLED 的可靠记录，再通过 Lua 执行一次性回补。

```lua
-- 与预扣使用相同的两个 key；只消费可信的取消任务
local state = redis.call('HGET', KEYS[2], 'state')
if state == 'CANCELLED' then return 0 end
if state ~= 'PENDING' then
  return redis.error_reply('reservation not releasable')
end
local count = tonumber(redis.call('HGET', KEYS[2], 'count'))
if not count or count <= 0 or count ~= math.floor(count) then
  return redis.error_reply('invalid reservation count')
end
local stock = tonumber(redis.call('GET', KEYS[1]))
if not stock or stock ~= math.floor(stock) then
  return redis.error_reply('invalid stock')
end
redis.call('INCRBY', KEYS[1], count)
redis.call('HSET', KEYS[2], 'state', 'CANCELLED')
return 1
```

预扣不存在或状态冲突时，应进入核查，不能猜测数量后直接 `INCR`。释放任务可重复投递；任务完成标记失败后再次执行，脚本也不会重复加库存。成功订单则通过可靠任务把预扣标记为 CONFIRMED。

上述幂等依赖预扣记录未丢失、key 类型正确且脚本正常完成。Redis 故障恢复后不能仅凭旧消息盲目回放，应先核对权威请求状态并重建一致的库存视图。

## 对账不能直接拿 DB 库存覆盖 Redis

正常情况下，消息在途时 Redis 可售库存就低于 DB 当前库存。直接对比两个数字并覆盖，会把尚未完成的预扣重新放出去。

对账应在相同统计口径下计算，例如：**Redis 期望可售库存 = DB 剩余库存 − 尚未计入 DB 扣减的有效预扣数量**。必须区分已成功但确认通知未到、已取消但释放未完成等状态，避免重复扣减或重复释放。

在线修复还要处理扫描期间的新预扣，可通过活动暂停、版本水位或带版本校验的修复协议完成，不能直接覆盖正在变化的计数器。

## 小结

秒杀一致性需要围绕请求身份和状态设计：预扣只是受理，结果未知先查证；重复消息不代表业务失败；取消与成功必须互斥，回补只能执行一次。可靠消息和对账负责把未决状态推进到终态。

## 参考

- [Redis：Lua 脚本执行与原子性](https://redis.io/docs/latest/develop/programmability/eval-intro/)
- [RocketMQ：事务消息与事务回查](https://rocketmq.apache.org/docs/featureBehavior/04transactionmessage/)
