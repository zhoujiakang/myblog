<template>
  <main>
    <PageHeader
      :label="site.aboutLabel"
      :title="site.aboutTitle"
      :intro="site.aboutIntro"
    />

    <section class="container">
      <!-- 简介 + 头像徽章 -->
      <div class="card bio" v-reveal>
        <p class="bio-text">{{ about.bio }}</p>
        <div class="avatar">
          <img :src="avatarImg" alt="zzZ" />
        </div>
      </div>

      <!-- 三个数据 -->
      <div class="stats">
        <div class="card stat" v-for="(s, i) in about.stats" :key="s.label" v-reveal="i * 80">
          <p class="lab">{{ s.label }}</p>
          <p class="num">{{ s.num }}<span class="unit" v-if="s.unit">{{ s.unit }}</span></p>
        </div>
      </div>

      <!-- Now -->
      <div class="card now" v-reveal>
        <h3>{{ about.nowTitle }}</h3>
        <p v-for="line in about.now" :key="line">{{ line }}</p>
      </div>

      <!-- 联系 CTA -->
      <div class="cta" v-reveal>
        <p class="cta-text">{{ site.ctaText }}</p>
        <CopyEmailBtn />
      </div>
    </section>

    <SiteFooter />
  </main>
</template>

<script setup>
import avatarImg from '../assets/avatar.png'
import PageHeader from '../components/PageHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
import CopyEmailBtn from '../components/CopyEmailBtn.vue'
import { about, site } from '../content'
</script>

<style scoped>
.bio {
  position: relative;
  margin-top: 60px;
  min-height: 210px;
  padding: 32px;
  padding-right: 400px;
}

.bio-text {
  max-width: 900px;
  font-size: 16px;
  line-height: 1.9;
  color: #4a463e;
}

.avatar {
  position: absolute;
  right: 80px;
  top: -35px;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: #fae3a8;
  border: 8px solid var(--yellow);
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.stats {
  margin-top: 60px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

.stat {
  padding: 30px 28px;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.num {
  margin-top: 12px;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 44px;
  line-height: 1;
  color: var(--accent);
  display: flex;
  align-items: baseline;
}

.num .unit {
  font-size: 19px;
  font-weight: 600;
  margin-left: 7px;
  color: var(--accent);
  opacity: 0.72;
}

.lab {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.06em;
  color: #8a8475;
}

.now {
  margin-top: 30px;
  padding: 32px;
  min-height: 230px;
}

.now h3 {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 20px;
}

.now p {
  margin-top: 24px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--muted);
}

.cta {
  margin-top: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
  padding: 40px 32px;
  border-radius: 16px;
  background: rgba(242, 180, 65, 0.14);
}

.cta-text {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 20px;
}

@media (max-width: 1000px) {
  .bio {
    padding-right: 32px;
  }
  .avatar {
    position: static;
    margin: 24px auto 0;
  }
}

@media (max-width: 700px) {
  .stats {
    grid-template-columns: 1fr;
  }
  .stat {
    min-height: 0;
  }
  .num {
    font-size: 40px;
  }
}
</style>
