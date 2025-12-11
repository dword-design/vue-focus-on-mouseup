export default {
  mounted: (el: HTMLElement) => {
    el.addEventListener('mousedown', event => {
      console.log('mousedown');

      if (el !== document.activeElement) {
        console.log('prevented');
        event.preventDefault();
      }
    });

    el.addEventListener('mouseup', () => el.focus());
  },
};
