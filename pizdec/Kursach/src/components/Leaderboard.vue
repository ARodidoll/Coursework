<template>
  <div class="game-container">
    <div class="player player-top" @click="increaseScore(1)">
      <h2 class="nickname">{{ player1.name }}</h2>
      <img :src="catTop" alt="Cat" class="cat-image" />
      <p class="counter">{{ player1.score }}</p>
    </div>
    
    <div class="player player-bottom" @click="increaseScore(2)">
      <h2 class="nickname">{{ player2.name }}</h2>
      <img :src="catBottom" alt="Cat" class="cat-image" />
      <p class="counter">{{ player2.score }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Импортируем изображения
//import catTopImage from '@/assets/cat_top.png';///import catBottomImage from '@/assets/cat_bottom.png';

// Проверяем, что изображения импортированы корректно
console.log(catTopImage, catBottomImage);

const player1 = ref({ name: 'Игрок 1', score: 0 });
const player2 = ref({ name: 'Игрок 2', score: 0 });

const catTop = catTopImage;
const catBottom = catBottomImage;

const increaseScore = (player) => {
  if (player === 1) {
    player1.value.score++;
  } else {
    player2.value.score++;
  }
};
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100vh;
  text-align: center;
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
  padding: 20px;
}

.player {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.player-top {
  transform: rotate(180deg);
}

.nickname {
  font-size: 18px;
  font-weight: bold;
  color: #555;
}

.cat-image {
  width: 150px;
  height: auto;
}

.counter {
  font-size: 24px;
  font-weight: bold;
  margin-top: 10px;
  color: #333;
}
</style>