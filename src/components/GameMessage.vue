<template>
  <Transition name="fade">
    <div class="game-message" v-if="message">
      {{ message }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

defineProps<{
  message: string | null;
}>();
</script>

<style scoped>
.game-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  max-width: 80%;
  z-index: 100;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 10px rgba(255, 255, 255, 0.2); }
  50% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.5); }
  100% { box-shadow: 0 0 10px rgba(255, 255, 255, 0.2); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style> 