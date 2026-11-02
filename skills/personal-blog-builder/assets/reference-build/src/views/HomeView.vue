<template>
  <main>
    <!-- Hero：满屏单屏 + 垂直居中，文字柱与插画柱等高并排 -->
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-text">
          <h1 class="brand" v-reveal="0">{{ site.name }}</h1>
          <p class="tagline" v-reveal="120">{{ site.tagline }}</p>

          <!-- 紧凑单行副标题：用最少的字占住空间，替代原来的三枚标签 -->
          <p class="subline" v-reveal="240">
            <template v-for="(t, i) in site.identity" :key="t">
              <span v-if="i > 0" class="slash">/</span>
              <span>{{ t }}</span>
            </template>
          </p>
        </div>

        <div class="hero-art">
          <svg
            class="star"
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L14.85 8.62L22 9.27L16.5 14.14L18.18 21.14L12 17.77L5.82 21.14L7.5 14.14L2 9.27L9.15 8.62L12 2Z"
              fill="var(--accent)"
            />
          </svg>
          <img :src="heroImg" alt="zzZ 和它的狗" />
        </div>
      </div>

      <!-- 滚到底部的提示：下面确实有真实的栏目区 -->
      <div class="scroll-wrap">
        <div class="container">
          <div class="scroll">
            <span class="scroll-dot">↓</span>
            <span>{{ home.scrollHint }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 栏目入口 -->
    <section class="explore container">
      <p class="label" v-reveal>{{ home.exploreLabel }}</p>
      <h2 class="sec-title" v-reveal="80">{{ home.exploreTitle }}</h2>

      <div class="cards">
        <RouterLink
          v-for="(e, i) in home.entries"
          :key="e.to"
          class="entry card"
          :to="e.to"
          v-reveal="(i + 1) * 90"
        >
          <h3>{{ e.title }}</h3>
          <p>{{ e.desc }}</p>
          <span class="more">{{ site.viewMore }}</span>
        </RouterLink>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta container" v-reveal>
      <p class="cta-text">{{ site.ctaText }}</p>
      <CopyEmailBtn />
    </section>
  </main>
</template>

<script setup>
import heroImg from '../assets/hero.png'
import CopyEmailBtn from '../components/CopyEmailBtn.vue'
import { site, home } from '../content'
</script>

<style scoped>
/* ① hero 一屏高，但内容块不撑满：收敛在屏幕中部，上下各留约 20% 呼吸空间 */
.hero {
  position: relative;
  display: flex;
  align-items: center;
  min-height: calc(100vh - 92px);
  min-height: calc(100svh - 92px);
  padding: 24px 0 96px;
}

/* 文字 + 插画是一个「整体组合块」：内部间距固定，整体在容器里居中。
   所以拉动窗口只改变这个块到页面左右的距离，不会改变两者的相对位置。 */
.hero-inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 56px;
}

/* 文字列贴合内容宽度（而非撑满固定宽度），这样 CSS 里的 gap 就等于真实视觉间距，
   组合块内部不留空洞 */
.hero-text {
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
  width: max-content;
  max-width: 100%;
}

.brand {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 88px;
  line-height: 1;
}

.tagline {
  margin-top: 12px;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 56px;
  line-height: 1.1;
}

/* ③ 紧凑单行副标题：字距拉开的等宽小字，克制地占住中间层 */
.subline {
  margin-top: 30px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.16em;
  color: var(--faint);
}

.subline .slash {
  color: var(--line);
}

/* ④ 插画柱：与标题块并排，去掉容器面板，用柔和光晕 + 羽化边缘融进纸面 */
.hero-art {
  position: relative;
  z-index: 1;
  flex: 0 0 440px;
  height: 440px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: art-float 6s ease-in-out infinite;
}

.hero-art::before {
  content: '';
  position: absolute;
  inset: 2%;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent-halo), transparent 70%);
  animation: glow-pulse 6s ease-in-out infinite;
}

.hero-art img {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* 羽化四边，让插画"融"进点阵纸面，不出现硬边方框 */
  -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 42%, rgba(0, 0, 0, 0) 76%);
  mask-image: radial-gradient(circle at 50% 50%, #000 42%, rgba(0, 0, 0, 0) 76%);
}

.star {
  position: absolute;
  top: -16px;
  right: -8px;
  animation: star-float 5s ease-in-out infinite;
}

.scroll-wrap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 36px;
}

.scroll {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--faint);
}

.scroll-dot {
  width: 32px;
  height: 32px;
  border: 1px solid var(--line);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  animation: dot-bounce 1.8s ease-in-out infinite;
}

.explore {
  padding-top: 88px;
}

.sec-title {
  margin-top: 10px;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 40px;
}

.cards {
  margin-top: 48px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
}

.entry {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 240px;
  padding: 24px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

/* 顶部描金条：悬停时从左滑入 */
.entry::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent), var(--btn-bg));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.entry:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lift);
  background: var(--bg-hover);
}

.entry:hover::before {
  transform: scaleX(1);
}

.entry h3 {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 24px;
}

.entry p {
  margin-top: 20px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--muted);
}

.entry .more {
  margin-top: auto;
  font-family: var(--font-mono);
  font-size: 16px;
  color: var(--accent);
  transition: transform 0.2s ease;
}

.entry:hover .more {
  transform: translateX(6px);
}

.cta {
  margin: 80px auto 100px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
  padding: 40px 32px;
  border-radius: var(--radius-card);
  background: var(--accent-wash);
}

.cta-text {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 20px;
}

/* hero 循环微动效 */
@keyframes art-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes glow-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.85;
  }
  50% {
    transform: scale(1.06);
    opacity: 1;
  }
}

@keyframes star-float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-8px) rotate(8deg);
  }
}

@keyframes dot-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-art,
  .hero-art::before,
  .star,
  .scroll-dot {
    animation: none;
  }
}

/* 每个像素区间有自己的一套内部排布（允许不同），但同一区间内相对位置恒定 */
/* ≤1100px 切成上下排版：文字 + 插画作为一组，整体在屏幕垂直居中，
   文字不再贴着导航栏下方；两者统一居中对齐，避免"文字靠左、插画偏中"的重心分散 */
@media (max-width: 1100px) {
  .cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .hero-inner {
    flex-direction: column;
    align-items: center;
    gap: 40px;
  }
  .hero-text {
    width: 100%;
    text-align: center;
  }
  .subline {
    justify-content: center;
  }
  .tagline {
    font-size: 48px;
  }
  .hero-art {
    flex: 0 0 auto;
    width: 100%;
    max-width: 340px;
    height: auto;
    aspect-ratio: 1 / 1;
  }
}

@media (max-width: 900px) {
  .brand {
    font-size: 60px;
  }
  .tagline {
    font-size: 38px;
  }
  .hero-art {
    max-width: 320px;
  }
  .scroll-wrap {
    bottom: 28px;
  }
  .explore {
    padding-top: 64px;
  }
}

/* ≤720px 导航会折成两行，hero 的可用高度要相应多减一些 */
@media (max-width: 720px) {
  .hero {
    min-height: calc(100vh - 130px);
    min-height: calc(100svh - 130px);
  }
}

@media (max-width: 560px) {
  .cards {
    grid-template-columns: 1fr;
  }
}
</style>
