<template>
  <div class="loading-screen">
    <div class="content-container">
      <div class="cat-container">
        <img src="@/assets/catwhite.png" alt="Cat" class="cat-image" />
      </div>

      <div class="loading-bar-container">
        <div class="loading-bar" :style="{ width: loadingProgress + '%' }"></div>
      </div>

      <div class="loading-text">Загрузка...</div>
    </div>

    <div class="paw-trail">
      <transition-group name="paw" tag="div">
        <div
          v-for="paw in paws"
          :key="paw.id"
          class="paw-print"
          :style="{
            top: paw.y + 'px',
            left: paw.x + 'px',
            transform: `rotate(${paw.rotation}deg) scale(${paw.scale})`,
            opacity: paw.opacity,
            width: paw.size + 'px',
            height: paw.size + 'px',
          }"
        >
          <img
            src="@/assets/Clap.png"
            alt="paw print"
            class="paw-image"
            :style="{ width: paw.size + 'px', height: paw.size + 'px' }"
          />
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      paws: [],
      interval: null,
      loadingProgress: 0,
      minPawSizeRatio: 0.02,
      maxPawSizeRatio: 0.06,
      maxPaws: 25,
    };
  },
  mounted() {
    this.interval = setInterval(() => {
      if (this.paws.length >= this.maxPaws) {
        this.paws.shift();
      }

      this.addPaw();

      if (this.loadingProgress < 100) {
        this.loadingProgress += 1;
      } else if (this.loadingProgress === 100) {
         clearInterval(this.interval);
         this.$router.push("/main")
      } else {
        clearInterval(this.interval);
      }

      
    }, 40);

    window.addEventListener("resize", this.handleResize);
  },
  beforeUnmount() {
    clearInterval(this.interval);
    window.removeEventListener("resize", this.handleResize);
  },
  methods: {
    handleResize() {
      // при необходимости
    },
    addPaw() {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      let newX, newY, newSize;
      let attempts = 0;
      const maxAttempts = 50;

      const cat = this.$el.querySelector(".cat-image");
      const catRect = cat.getBoundingClientRect();

      const minSize = this.minPawSizeRatio * screenWidth;
      const maxSize = this.maxPawSizeRatio * screenWidth;

      do {
        newSize = Math.random() * (maxSize - minSize) + minSize;

        newX = Math.random() * (screenWidth - newSize);
        newY = Math.random() * (screenHeight - newSize);

        attempts++;
      } while (
        (this.isOverlapping(newX, newY, newSize) || this.isNearCat(newX, newY, newSize, catRect)) &&
        attempts < maxAttempts
      );

      if (attempts < maxAttempts) {
        this.paws.push({
          id: Date.now() + Math.random(),
          x: newX,
          y: newY,
          size: newSize,
          rotation: Math.random() * 360,
          opacity: 0.5 + Math.random() * 0.5,
          scale: 0.8 + Math.random() * 0.5,
        });
      }
    },
    isOverlapping(x, y, size) {
      return this.paws.some((paw) => {
        const dx = paw.x - x;
        const dy = paw.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < size;
      });
    },
    isNearCat(x, y, size, catRect) {
      const buffer = 60;
      return (
        x + size > catRect.left - buffer &&
        x < catRect.right + buffer &&
        y + size > catRect.top - buffer &&
        y < catRect.bottom + buffer
      );
    },
  }, 
};
</script>




<style scoped>
.loading-screen {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #ff8fab, #ff69b4); /* красивый розовый градиент */
  overflow: hidden;
  margin: 0%;
}

.paw-enter-active,
.paw-leave-active {
  transition: opacity 1s ease, transform 1s ease;
}

.paw-enter-from,
.paw-leave-to {
  opacity: 0;
  transform: scale(0.5) rotate(0deg);
}

.content-container {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2vh;
  padding: 2vh;
}

.cat-container {
  margin-bottom: 2vh;
}

.cat-image {
  width: 20vw;
  max-width: 200px;
  height: auto;
}

.paw-trail {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 1;
}

.paw-print {
  position: absolute;
  animation: floaty 3s ease-in-out infinite alternate;
  pointer-events: none;
}

.paw-image {
  display: block;
  filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.2));
}

@keyframes floaty {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-10px);
  }
}

.paw-enter-active,
.paw-leave-active {
  transition: opacity 1s ease, transform 1s ease;
}
.paw-enter-from,
.paw-leave-to {
  opacity: 0;
  transform: scale(0.5) rotate(0deg);
}

.loading-bar-container {
  width: 50vw;
  max-width: 200px;
  height: 8px;
  background-color: black;
  border-radius: 4px;
  border: 1px solid black;
}

.loading-bar {
  height: 100%;
  background-color: #ffffff;
  border-radius: 4px;
  transition: width 0.1s ease;
}

.loading-text {
  font-size: 2.5vh;
  color: white;
  font-family: 'Comic Neue', 'Poppins', cursive, sans-serif;
}
</style>
