import { useState } from 'react'
import { copy, t } from '../data/site'

/* 月份日历 —— 归档页侧栏第一张卡。
   从 ArchivePage 抽出来的纯展示组件：游标（当前查看的月份）、
   索引表（'年-月' → 日 → 篇数）、边界（最早/最晚有文章的月份）
   全部内聚在这里，页面组件只负责时间线与侧栏的编排。
   ‹ › 只在有文章的月份之间切换；天数按年月动态计算（闰年 2 月 29 天），
   格子上的圆点数量表示当天发布的篇数。 */
export function CalendarCard({ archive }) {
  /* 空内容（刚开始写作）时没有可浏览的月份：显示提示而不是 NaN */
  if (!archive.length) {
    return <div className="side-card">{copy.archive.emptySide}</div>
  }

  /* 月份索引表：'年-月' → Map(日 -> 篇数) */
  const monthMap = new Map()
  for (const y of archive) {
    for (const mm of y.months) {
      const mNum = Number(mm.month.split(' ')[0])
      const days = new Map()
      for (const p of mm.posts) days.set(p.day, (days.get(p.day) ?? 0) + 1)
      monthMap.set(`${y.year}-${mNum}`, days)
    }
  }

  /* 边界：最早 / 最晚有文章的月份（键统一用 0 基月份） */
  const keys = [...monthMap.keys()].map((k) => {
    const [y, m] = k.split('-').map(Number)
    return y * 12 + (m - 1)
  })
  const minKey = Math.min(...keys)
  const maxKey = Math.max(...keys)

  /* 光标默认停在最新月份 */
  const [cursor, setCursor] = useState(() => {
    const y = Math.floor(maxKey / 12)
    return { year: y, month: (maxKey % 12) + 1 }
  })

  const cursorKey = cursor.year * 12 + (cursor.month - 1)
  const move = (dir) => {
    const next = cursorKey + dir
    if (next < minKey || next > maxKey) return
    setCursor({ year: Math.floor(next / 12), month: (next % 12) + 1 })
  }

  const monthData = monthMap.get(`${cursor.year}-${cursor.month}`)
  const now = new Date()
  const isToday = (day) =>
    cursor.year === now.getFullYear() &&
    cursor.month === now.getMonth() + 1 &&
    day === now.getDate()

  const offset = new Date(cursor.year, cursor.month - 1, 1).getDay()
  /* 按年月动态取天数：闰年 2 月 29 天，平年 28 天，不再写死 */
  const daysIn = new Date(cursor.year, cursor.month, 0).getDate()
  const trailing = (7 - ((offset + daysIn) % 7)) % 7

  return (
    <div className="side-card cal-card">
      <div className="cal-head">
        <button
          type="button"
          className="cal-nav"
          aria-label={copy.archive.calPrev}
          disabled={cursorKey <= minKey}
          onClick={() => move(-1)}
        >
          ‹
        </button>
        <span className="cal-label display">
          {t(copy.archive.monthLabel, {
            year: cursor.year,
            month: copy.archive.months[cursor.month - 1],
          })}
        </span>
        <button
          type="button"
          className="cal-nav"
          aria-label={copy.archive.calNext}
          disabled={cursorKey >= maxKey}
          onClick={() => move(1)}
        >
          ›
        </button>
      </div>
      <div className="cal-week">
        {copy.archive.weekdays.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="cal-grid">
        {Array.from({ length: offset }, (_, i) => (
          <span key={`b${i}`} className="cal-cell cal-cell--blank" />
        ))}
        {Array.from({ length: daysIn }, (_, i) => {
          const day = i + 1
          const hits = monthData?.get(day) ?? 0
          const today = isToday(day)
          const cls = ['cal-cell', today ? 'cal-cell--today' : ''].filter(Boolean).join(' ')
          return (
            <span
              key={day}
              className={cls}
              title={hits ? t(copy.archive.calTitle, { day, count: hits }) : ''}
            >
              <span className="cal-num">{day}</span>
              {hits > 0 && (
                <span className={hits >= 2 ? 'cal-dot cal-dot--multi' : 'cal-dot'} />
              )}
            </span>
          )
        })}
        {Array.from({ length: trailing }, (_, i) => (
          <span key={`t${i}`} className="cal-cell cal-cell--blank" />
        ))}
      </div>
      <p className="cal-foot">
        {t(copy.archive.calFoot, {
          month: cursor.month,
          count: monthData ? [...monthData.values()].reduce((a, b) => a + b, 0) : 0,
        })}
      </p>
    </div>
  )
}
