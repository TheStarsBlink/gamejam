import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import GameContainer from './GameContainer.vue'

// 导入全局样式（如果需要）
import './style.css' 

const app = createApp(GameContainer)

app.use(createPinia()) // 使用Pinia
app.use(router) // 使用路由
app.mount('#app') // 挂载到index.html中的#app元素 