import { Link } from 'react-router-dom'
import { PageHead } from './shared/PageHead'
import { copy } from '../data/site'

/* 404 页 */

export function NotFound() {
  return (
    <>
      <PageHead title={copy.notFound.title} desc={copy.notFound.desc} />
      <div className="list-wrap">
        <div className="list-row">
          <Link className="list-card" to="/">
            <div className="list-card-main">
              <h2 className="list-card-title">{copy.notFound.cardTitle}</h2>
              <p className="list-card-summary">{copy.notFound.cardDesc}</p>
            </div>
          </Link>
        </div>
      </div>
    </>
  )
}
