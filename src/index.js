export default {
  bind: el => {
    el.addEventListener('mousedown', event => {
      if (el != document.activeElement) {
        event.preventDefault()
      }
    })
    el.addEventListener('mouseup', () => el.focus())
  },
}
