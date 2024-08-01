

export function useRandomColorGenerator() {
  let prevColor = ""; // makes sure always a different color

  return {
    get() {
      var letters = '0123456789ABCDEF';
      var color = '#';
      for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      if (prevColor === color) color = this.get();
      else prevColor = color;
      return color;
    }
  }
}
