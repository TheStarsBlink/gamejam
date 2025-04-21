<template>
  <div class="game-container">
    <!-- 导航栏 -->
    <nav class="game-nav">
      <router-link to="/" class="nav-link">主页</router-link>
    </nav>
    
    <!-- 路由出口 -->
    <router-view></router-view>
  </div>
</template>

<script setup>
// 导入需要的依赖
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.game-nav {
  display: flex;
  background-color: var(--background-darker);
  padding: 10px 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.nav-link {
  color: var(--text-color);
  text-decoration: none;
  padding: 8px 16px;
  margin-right: 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: var(--background-light);
}

.nav-link.router-link-active {
  background-color: var(--primary-color);
  color: white;
}

/* 路由出口样式 */
.game-container > :last-child {
  flex: 1;
  overflow: auto;
}
</style> 