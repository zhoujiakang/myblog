import { Link } from 'react-router-dom'
import { Pill, SectionTitle } from '../components/Blocks'
import { config, copy, t } from '../data/site'
import { works } from '../lib/works'

/* 单个折腾条目 —— 状态由左缘色轨与所属区块表达 */
function WorkCard({ work }) {
  return (
    <Link
      className={`work-card work-card--${config.statusModifiers[work.status] ?? 'paused'}`}
      to={`/works/${work.slug}`}
    >
      <div className="work-card-flags">
        {(work.tags ?? []).map((t) => (
          <Pill key={t} tone="plain" size="sm">
            {t}
          </Pill>
        ))}
        <span className="work-card-date">{work.date}</span>
      </div>
      <h2 className="work-card-title">{work.title}</h2>
      <p className="work-card-summary">{work.summary}</p>
      <span className="work-card-more">{copy.works.cardMore}</span>
    </Link>
  )
}

export function WorksPage() {
  /* 块 1：接下来想做的 = 未完成的全在这，滑动浏览 */
  const planned = works
    .filter((w) => w.status !== config.worksStatuses.done)
    .sort(
      (a, b) =>
        (config.plannedOrder[a.status] ?? 9) - (config.plannedOrder[b.status] ?? 9) ||
        (a.datetime < b.datetime ? 1 : -1)
    )

  /* 块 2 / 3：已完成的按类型分列 */
  const doneProjects = works.filter(
    (w) => w.kind === config.kinds.project && w.status === config.worksStatuses.done
  )
  const doneSkills = works.filter(
    (w) => w.kind === config.kinds.skill && w.status === config.worksStatuses.done
  )

  const stats = [
    { label: copy.works.statPlanned, mod: 'todo', count: planned.length },
    { label: copy.works.statDone, mod: 'done', count: works.length - planned.length },
  ]

  return (
    <>
      <header className="page-head works-top">
        <div className="works-intro">
          <h1 className="page-title">{copy.works.title}</h1>
          <div className="work-stats">
            {stats.map((s) => (
              <span key={s.label} className="work-stat">
                <span className={`work-status work-status--${s.mod}`}>{s.label}</span>
                <b className="work-stat-num">{s.count}</b>
              </span>
            ))}
            <span className="work-stat-total">{t(copy.works.total, { count: works.length })}</span>
          </div>
          <p className="works-desc">{copy.works.desc}</p>
        </div>
      </header>

      <div className="list-wrap">
        <section className="section-block works-col works-planned">
          <SectionTitle
            dot="yellow"
            title={copy.works.plannedTitle}
            note={t(copy.works.plannedNote, { count: planned.length })}
          />
          {planned.length > 0 ? (
            <div className="works-slider">
              {planned.map((work) => (
                <WorkCard key={work.slug} work={work} />
              ))}
            </div>
          ) : (
            <div className="work-card work-card--next work-card--solo">
              <h2 className="work-card-title">{copy.works.plannedEmptyTitle}</h2>
              <p className="work-card-summary">{copy.works.plannedEmptyDesc}</p>
            </div>
          )}
        </section>

        <div className="works-columns">
          <section className="section-block works-col">
            <SectionTitle
              dot="blue"
              title={copy.works.projectsTitle}
              note={t(copy.works.columnNote, { count: doneProjects.length })}
            />
            {doneProjects.length > 0 ? (
              <div className="works-grid">
                {doneProjects.map((work) => (
                  <WorkCard key={work.slug} work={work} />
                ))}
              </div>
            ) : (
              <p className="works-empty">{copy.works.projectsEmpty}</p>
            )}
          </section>

          <section className="section-block works-col">
            <SectionTitle
              dot="mint"
              title={copy.works.skillsTitle}
              note={t(copy.works.columnNote, { count: doneSkills.length })}
            />
            {doneSkills.length > 0 ? (
              <div className="works-grid">
                {doneSkills.map((work) => (
                  <WorkCard key={work.slug} work={work} />
                ))}
              </div>
            ) : (
              <p className="works-empty">{copy.works.skillsEmpty}</p>
            )}
          </section>
        </div>

        <Link className="work-card work-card--next" to="/about">
          <h2 className="work-card-title">{copy.works.nextTitle}</h2>
          <p className="work-card-summary">{copy.works.nextDesc}</p>
        </Link>
      </div>
    </>
  )
}
