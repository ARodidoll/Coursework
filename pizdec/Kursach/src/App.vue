<template>
  <nav>
   
  </nav>
  <router-view/>
</template>
<script setup>
import { onMounted } from 'vue';
import { useCoinsState } from '@/composables/useCoinsState';

const { loadUserData } = useCoinsState();

onMounted(() => {
  // Загрузка данных при первом запуске приложения
  loadUserData();
});
</script>
<style>
* {
  margin: 0;
  padding: 0;

}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 0px;
}



nav a.router-link-exact-active {
  color: #42b983;
}
</style>
