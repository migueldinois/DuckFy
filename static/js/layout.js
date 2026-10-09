document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.querySelector('.dropdown-trigger');
  
  if (trigger) {
    trigger.addEventListener('click', (e) => {
      if (e.target.closest('.dropdown-menu')) return;
      
      trigger.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!trigger.contains(e.target)) {
        trigger.classList.remove('show');
      }
    });
  }
});
