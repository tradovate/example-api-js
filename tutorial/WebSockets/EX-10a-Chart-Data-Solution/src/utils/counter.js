export function Counter() {
    this.current = 0
}

Counter.prototype.increment = function() {
    return ++this.current
}