<script>
  import { Play, Minus, Plus, SkipBack, Pause, SkipForward } from 'lucide-svelte';
  import { onMount } from 'svelte';

  let isExpanded = false; 
  let isFirstClick = true;
  let isPlaying = false; 
  let audio; 
  let currentTime = 0; 
  let duration = 0; 
  let currentSongIndex = 0; 
  let isLoading = false;
  let audioReady = false; 

  const songs = [
    {
      title: "What You Wont Do For Love",
      artist: "Bobby Caldwell",
      src: "/song/what-you-wont-do-for-love.mp3"
    },
    {
      title: "Dancing Queen",
      artist: "ABBA",
      src: "/song/dancing-queen.mp3"
    },
    {
      title: "Careless Whisper",
      artist: "George Michale",
      src: "/song/careless-whisper.mp3"
    }
  ];

  $: currentSong = songs[currentSongIndex];

  onMount(() => {
    loadCurrentSong();
    
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  });

  function loadCurrentSong() {
    isLoading = true;
    audioReady = false;
    isPlaying = false;
    currentTime = 0;
    duration = 0;
    
    if (audio) {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('error', handleError);
    }
    
    audio = new Audio();
    audio.preload = 'metadata';
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('error', handleError);
 
    audio.src = currentSong.src;
    audio.load(); // Force load
  }

  function handleLoadedMetadata() {
    duration = audio.duration;
    console.log(`Loaded: ${currentSong.title} - Duration: ${duration}s`);
  }

  function handleCanPlayThrough() {
    audioReady = true;
    isLoading = false;
    console.log(`Ready to play: ${currentSong.title}`);
  }

  function handleError() {
    console.error(`Error loading: ${currentSong.title}`);
    isLoading = false;
    audioReady = false;
  }

  function handleTimeUpdate() {
    currentTime = audio.currentTime;
  }

  function handleEnded() {
    isPlaying = false;
    // Auto play next song
    nextSong();
  }

  function handleToggle() {
    if (isFirstClick) {
      isFirstClick = false;
      playAudio();
    }
    isExpanded = !isExpanded;
  }
  
  function playAudio() {
    if (audio && audioReady) {
      audio.play().then(() => {
        isPlaying = true;
        console.log(`Playing: ${currentSong.title}`);
      }).catch(err => {
        console.error('Play failed:', err);
      });
    } else if (isLoading) {
      // Tunggu sampai audio ready
      const checkReady = setInterval(() => {
        if (audioReady) {
          clearInterval(checkReady);
          playAudio();
        }
      }, 100);
    }
  }
  
  function pauseAudio() {
    if (audio) {
      audio.pause();
      isPlaying = false;
    }
  }
  
  function togglePlayPause() {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }
  
  function skipForward() {
    if (audio) {
      audio.currentTime = Math.min(audio.currentTime + 10, audio.duration);
    }
  }
  
  function skipBackward() {
    if (audio) {
      audio.currentTime = Math.max(audio.currentTime - 10, 0);
    }
  }

  function nextSong() {
    const wasPlaying = isPlaying;
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    console.log(`Switching to: ${songs[currentSongIndex].title}`);
    
    // Trigger reactive update dan load song baru
    setTimeout(() => {
      loadCurrentSong();
      if (wasPlaying || isFirstClick) {
        setTimeout(() => playAudio(), 200);
      }
    }, 50);
  }

  function previousSong() {
    const wasPlaying = isPlaying;
    currentSongIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1;
    console.log(`Switching to: ${songs[currentSongIndex].title}`);
    
    // Trigger reactive update dan load song baru
    setTimeout(() => {
      loadCurrentSong();
      if (wasPlaying || isFirstClick) {
        setTimeout(() => playAudio(), 200);
      }
    }, 50);
  }
  
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  function handleProgressClick(event) {
    if (audio && duration > 0) {
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * duration;
      audio.currentTime = newTime;
    }
  }
</script>

<!-- Container utama dengan padding untuk gambar yang overflow -->
<div class="fixed bottom-5 left-5 z-999">
  <div class="relative">
    <div class="absolute left-0.5 z-10 transition-all duration-300 ease-out" 
         class:-top-2={!isExpanded} 
         class:-top-1.5={isExpanded}>
      <img 
        src="/bs.png" 
        alt="BackSong" 
        class="object-cover rounded-lg transition-all duration-300 ease-out transform"
        class:w-18={!isExpanded}
        class:h-18={!isExpanded}
        class:w-25={isExpanded}
        class:h-25={isExpanded}
        class:scale-100={!isExpanded}
        class:scale-105={isExpanded}
      >
    </div>

    <!-- Card Lagu -->
    <div 
      class="bg-transparent blur-8xl text-gray-800 rounded-lg shadow-2xl overflow-visible transition-all duration-300 ease-out border border-gray-200 relative"
      class:w-25={!isExpanded}
      class:w-105={isExpanded}
      class:h-16={!isExpanded}
      class:h-24={isExpanded}
    >
      <div class="relative w-full h-full p-3 flex items-center">
        <div class="w-14 h-14 flex-shrink-0"></div>
        {#if isExpanded}
          <div class="flex flex-col justify-center flex-1 ml-10 animate-fade-in">
            <div class="flex items-center justify-between mb-2">
    
              <div class="flex-1 min-w-0">
                <p class="font-bold text-sm truncate text-gray-800">
                  {#if isLoading}
                    <span class="animate-pulse">Loading...</span>
                  {:else}
                    {currentSong.title}
                  {/if}
                </p>
                <p class="text-xs text-gray-500 truncate">{currentSong.artist}</p>
                <p class="text-xs text-gray-400 truncate">{currentSongIndex + 1} / {songs.length}</p>
              </div>

              <div class="flex items-center space-x-2">
                <button 
                  class="text-gray-400 hover:text-gray-600 transition-colors p-1 disabled:opacity-50"
                  aria-label="Previous track"
                  disabled={isLoading}
                  on:click={previousSong}
                >
                  <SkipBack size={16} />
                </button>
                <button 
                  class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors border border-gray-300 disabled:opacity-50"
                  aria-label={isPlaying ? 'Pause track' : 'Play track'}
                  disabled={isLoading}
                  on:click={togglePlayPause}
                >
                  {#if isLoading}
                    <div class="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  {:else if isPlaying}
                    <Pause size={16} class="text-gray-600" />
                  {:else}
                    <Play size={16} class="text-gray-600 ml-0.5" />
                  {/if}
                </button>
                <button 
                  class="text-gray-400 hover:text-gray-600 transition-colors p-1 disabled:opacity-50"
                  aria-label="Next track"
                  disabled={isLoading}
                  on:click={nextSong}
                >
                  <SkipForward size={16} />
                </button>
              </div>
            </div>

            <div class="flex items-center space-x-2 text-xs text-gray-500">
              <span class="w-8 text-right">{formatTime(currentTime)}</span>
              <button 
                class="flex-1 h-1 bg-gray-200 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                on:click={handleProgressClick}
                on:keydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleProgressClick(e);
                  }
                }}
                aria-label="Seek audio progress"
                role="slider"
                aria-valuemin="0"
                aria-valuemax={duration}
                aria-valuenow={currentTime}
              >
                <div 
                  class="h-full bg-blue-500 rounded-full transition-all duration-500 pointer-events-none"
                  style="width: {duration > 0 ? (currentTime / duration) * 100 : 0}%"
                ></div>
              </button>
              <span class="w-8">{formatTime(duration)}</span>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <button 
      on:click={handleToggle}
      class="absolute -top-5 -right-5 w-12 h-12 bg-white rounded-full flex items-center justify-center text-black z-20 transition-all duration-300 hover:scale-105 shadow-lg border-2 border-gray-200"
      aria-label="Toggle music player"
    >
      {#if isFirstClick}
        <Play size={16} class="ml-0.5" />
      {:else if isExpanded}
        <Minus size={16} />
      {:else}
        <!-- Plus Icon -->
        <Plus size={16} />
      {/if}
    </button>
  </div>
</div>

<style>
  /* Animasi sederhana untuk fade-in konten */
  @keyframes fade-in {
    from { 
      opacity: 0; 
      transform: translateX(-15px) scale(0.95); 
    }
    to { 
      opacity: 1; 
      transform: translateX(0) scale(1); 
    }
  }
  .animate-fade-in {
    animation: fade-in 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }
</style>