export function saveLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}