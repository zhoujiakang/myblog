/* 站点数据的唯一入口。
 *
 * 所有「写死的信息」都不在这个文件里：
 *   - 关于我的资料：src/content/site/profile.json（联系方式、简介、关于页正文）
 *   - 全站可见文案：src/content/site/copy.json（导航、页脚、页头、按钮、空状态…）
 *   - 展示规则配色：src/content/site/config.json（分类/状态配色、排序、数量上限）
 *
 * 这里只负责导入、命名兼容和一点点字符串模板求值。
 * 换文案不需要改任何 .jsx / .css。 */

import profile from '../content/site/profile.json'
import copy from '../content/site/copy.json'
import config from '../content/site/config.json'

export const site = profile
export { copy, config }

/** 把 copy.json 里的 "{name}" 占位替换成实际值。
 *  没给的占位原样保留，便于一眼发现漏传的参数。 */
export function t(template, vars = {}) {
  return String(template ?? '').replace(/\{(\w+)\}/g, (whole, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : whole
  )
}

/** public 目录下的图片路径：base 为 './' 时也要能正确解析 */
export function asset(path) {
  return `${import.meta.env.BASE_URL}${path}`
}
